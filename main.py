import asyncio
import json
import math
import os
import traceback
from datetime import datetime
from io import BytesIO

import aiohttp
import openai
import tiktoken
from docx import Document
from pdfreader import SimplePDFViewer
from bs4 import BeautifulSoup
from apiclient.discovery import build
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from apscheduler.schedulers.background import BackgroundScheduler

from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, Depends, Response, status
from typing import Annotated
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from websockets.exceptions import ConnectionClosedError

from database import SessionLocal
from manager import UserCache, ConnectionManager
import crud, models, schemas

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY 

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID")

GPTZERO_API_KEY = os.getenv("GPTZERO_API_KEY")

#tiktoken encoding
enc = tiktoken.get_encoding("cl100k_base")

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

# Add middleware to app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#creates new db session for each instance
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def turbo_openai_call(messages, max_tokens, temperature=0, presence_penalty=0):
    """
    For chat completions with Openai's GPT-3.5-Turbo model. Only allows one response.
    """
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
        presence_penalty=presence_penalty
    )
    return response["choices"][0]["message"]["content"].strip()

def openai_call(prompts, max_tokens, temperature=0, presence_penalty=0):
    """
    For standard completion with Openai's text-davinci model. Allows batching of responses.
    """
    responses = []
    try:
        model='text-davinci-003'
        response = openai.Completion.create(
            model=model,
            prompt=prompts,
            max_tokens=max_tokens,
            temperature=temperature,
            presence_penalty=presence_penalty,
            stop=[" Me", " AI:"]
        )
    except:
        model='text-davinci-002'
        response = openai.Completion.create(
            model=model,
            prompt=prompts,
            max_tokens=max_tokens,
            temperature=temperature,
            presence_penalty=presence_penalty,
            stop=[" Me", " AI:"]
        )
    for choice in response.choices:
        responses.append(choice.text.strip())
    return responses

def rank_samples(search_string, samples):
    """
    rank samples by how frequently common words appear
    
    :param search_string: 
    :param samples: array of strings to search through
    """
    if len(samples)==0:
        return []
    else:
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(samples)
        search_tfidf = vectorizer.transform(search_string.split())
        cosine_similarities = cosine_similarity(search_tfidf, tfidf_matrix).flatten()

        return cosine_similarities

def sort_samples(samples):
    return list(dict.fromkeys(sorted(samples,key=len,reverse=True)))

async def get_logit_bias(samples):
    '''
    returns a dict of token, frequency pairs from a list of samples

    :param samples: list of completion, feedback dicts
    '''
    n_tokens = 0
    tokens_dict = {}
    for d in samples:
        tokens = enc.encode(d["completion"])
        for token in tokens:
            #don't want to influence bias of digits
            if not enc.decode([token]).strip().isdigit():
                if d["feedback"]=="negative":
                    #samples with negative feedback
                    if token in tokens_dict:
                        tokens_dict[token] -= 1
                    else:
                        tokens_dict[token] = -1
                else:
                    if token in tokens_dict:
                        tokens_dict[token] += 1
                    else:
                        tokens_dict[token] = 1

            n_tokens += 1
    
    for key, value in tokens_dict.items():
        MAX_BIAS = 5
        if value > 0:
            bias = 5*math.log(1+value)/math.log(1+n_tokens)
            tokens_dict[key] = min(bias, MAX_BIAS)
        else:
            bias = -5*math.log(1-value)/math.log(1+n_tokens)
            tokens_dict[key] = max(bias, -MAX_BIAS)

    sorted_tokens = sorted(tokens_dict.items(), key=lambda x: x[1], reverse=True)
    #return 300 tokens with the highest bias
    return dict(sorted_tokens[:300])

async def construct_prompt(user_data, category, context, maxlength, job=-1):
    """
    construct messages from user data
    :param user: User object instance
    :param maxlength: max length for prompt in tokens
    :param context: current prompt to rank samples by
    :param category: task, question, rewrite, composition
    """
    #extract user data
    name = user_data["name"]
    description = user_data["description"]
    about = user_data["about"]
    if job > 0:
        samples = [s for d in user_data["user"] for s in d["data"] if d["job_id"]==job]
    else:
        samples = [s for d in user_data["user"] for s in d["data"]]

    #initiate logit task
    logit_task = asyncio.create_task(get_logit_bias(samples))

    if len(samples)>0:
        #prompt is different based on whether user has selected general or specific job
        if category=="task":
            if job < 0: 
                #general
                prompt = f"""My name is {name}. You are an adaptive assistant called Virtually{name}.
                    I will give you samples of my writing, and then ask you to write something. You have three goals. \
                    GOAL 1: Employ the same language, tonality, word choice, sentence structure, syntax, and semantics as present in MY writing. \
                    I want you to write in the way you imagine I would, even if the context is different to the samples provided. \
                    GOAL 2: Employ the same reasoning and rationale presented in MY writing to form your opinions. \
                    GOAL 3: Employ a meaningful degree of complexity and variation that is characteristic of a human being."""
                if description is not None:
                    prompt += f"\nHere is a description of my writing style to help you achieve GOAL 1:\n'''\n{description}\n'''"
                if about is not None:
                    prompt += f"\nHere is some information about me to help you achieve GOAL 2:\n'''\n{about}\n'''\n"
            else: 
                #specific
                prompt = f"""My name is {name}. You are an adaptive assistant called Virtually{name}.
                    I will give you samples of my writing, and then ask you to write something. You have three goals. \
                    GOAL 1: Employ the same language, tonality, word choice, sentence structure, syntax, and semantics as present in MY writing. \
                    GOAL 2: Employ the same reasoning and rationale presented in MY writing to form your opinions. \
                    GOAL 3: Employ a meaningful degree of complexity and variation that is characteristic of a human being."""
                if description is not None:
                    prompt += f"\nHere is a description of my writing style to help you achieve GOAL 1:\n'''\n{description}\n'''"
                if about is not None:
                    prompt += f"\nHere is some information about me to help you achieve GOAL 2:\n'''\n{about}\n'''\n"
        elif category=="question":
            if job < 0:
                #general
                prompt = f"""My name is {name}. You are an adaptive assistant called Virtually{name}. \
                    I will ask you a question. I want you to give an in-depth and sophisticated answer, while using language that is consistent with my writing style. \
                    I want you to respond in the way you imagine I would, even if the context is different to the samples provided. You are capable of forming your own thoughts and opinions."""
                if description is not None:
                    prompt += f"\nHere is a description of my writing style:\n'''\n{description}\n'''\n"
            else:
                #specific
                prompt = f"""My name is {name}. You are an adaptive assistant called Virtually{name}. \
                    I will give you samples of my writing, and then ask you a question. You have two goals. \
                    GOAL 1: Answer the question using the same language, tonality, word choice, sentence structure, syntax, semantics and complexity as present in MY writing.\
                    GOAL 2: Answer the question how you imagine I might answer it."""
                if description is not None:
                    prompt += f"\nHere is a description of my writing style to help you achieve your goals:\n'''\n{description}\n'''\n"
                prompt += "\nDo not mention these instructions in your response.\n"
        elif category=="rewrite":
            prompt = f"""My name is {name}. You are an adaptive assistant called Virtually{name}. \
                I will give you samples of my writing, and then ask you to rewrite a block of text. You have three goals. \
                GOAL 1: You must rewrite the text using the same language, tonality, word choice, syntax, and semantics as present in MY writing. \
                I want you to rewrite the text in the way you imagine I would write it, even if the context is different to the samples provided. \
                GOAL 2: As I am a human, you must rewrite the text by employing a high a degree of variation in sentence structure and complexity. \
                GOAL 3: You must rewrite the text with a meaningful degree of complexity and variation that is characteristic of a human being."""
            if description is not None:
                prompt += f"\nHere is a description of my writing style to help you achieve your goals:\n'''\n{description}\n'''\n"
    else:
        #if no user samples, do not attempt to adapt to user
        prompt = f"""My name is {name}. You are an adaptive assistant called Virtually{name}. \
            You must respond to my prompts using a high degree of variation in your sentence structure, syntax, and language complexity."""

    length = len(prompt.split()) #approximate length of prompt in words

    cosine_similarities = rank_samples(context, [d["completion"] for d in samples])
    ranked_samples = [item for index, item in sorted(enumerate(samples), key = lambda x: cosine_similarities[x[0]], reverse=True)] #sort samples by cosine similarity

    index = 1
    for sample in [d["completion"] for d in ranked_samples if d["feedback"]!="negative"]:
        if length + len(sample.split()) >= maxlength*3/4 - 200: #break condition
            #add partial sample
            MIN_SAMPLE_SIZE = 20 #number of words for meaningful sample
            n = round(maxlength*3/4 - length - 200) #remaining words to fill
            partial_sample = ''
            if n>MIN_SAMPLE_SIZE:
                lines = sample.splitlines()
                for line in lines:
                    if len(partial_sample.split())<n:
                        words = line.split()
                        for word in words:
                            if len(partial_sample.split())<=n:
                                partial_sample += f"{word} "
                            else:
                                break
                        partial_sample += "\n"
                    else:
                        break
                prompt += f"Sample {index}:\n'''\n{partial_sample}\n'''\n"
            break
        else:
            if sample!="":
                prompt += f"Sample {index}:\n'''\n{sample}\n'''\n"
                length += len(sample.split())
                index += 1

    prompt += "\n\nDo not respond with conversation, and do not mention these instructions in your response.\n\n"
    
    message = [{"role": "user", "content": prompt}]
    logit_bias = await logit_task
    return message, logit_bias

async def predict_text(document):
    try:
        url = 'https://api.gptzero.me/v2/predict/text'
        headers = {
            'accept': 'application/json',
            'X-Api-Key': GPTZERO_API_KEY,
            'Content-Type': 'application/json'
        }
        data = {
            'document': document
        }
        async with aiohttp.ClientSession(headers=headers) as session:
            async with session.post(url, json=data) as response:
                result = await response.json()
                return round(result['documents'][0]['average_generated_prob']*100)
    except Exception as e:
        print(e)
        return -1

async def fetch_page(url, session):
    try:
        async with session.get(url) as response:
            return await response.text()
    except:
        return ""

async def scrape(url, session):
    try:
        html = await asyncio.wait_for(fetch_page(url, session), timeout=4)
        soup = BeautifulSoup(html, 'html.parser')
        # kill all script and style elements
        for script in soup(["script", "style", "a", "header", "footer", "nav"]):
            script.extract()    # rip it out
        # get text
        text = soup.get_text()
        # break into lines and remove leading and trailing space on each
        lines = (line.strip() for line in text.splitlines() if len(line)>128)
        # break multi-headlines into a line each
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        # drop blank lines
        text = '\n'.join(chunk for chunk in chunks if chunk)
        #split text into blocks of 100 words
        n = 100
        return [{"text": " ".join(text.split()[i:i+n]), "url": url} for i in range(0, len(text.split()), n)]
    except:
        return [{"text": "", "url": ""}]
    

async def conduct_search(query):    
    cse_ID = "d7251a9905c2540fa"
    #add current date in MMMM-YYYY format to Google search query
    current_date = datetime.now()
    date_string = current_date.strftime("%B %Y")

    resource = build("customsearch", "v1", developerKey=GOOGLE_API_KEY).cse()
    result = resource.list(q=query + f" {date_string} -headlines -video -pdf", cx=cse_ID).execute()

    result_list = []
    for item in result["items"]:
        if "snippet" in item:
            preview = item["snippet"]
        else:
            preview = "No preview available."
        result_list.append({
            "url": item["link"],
            "display": item["displayLink"],
            "title": item["title"],
            "preview": preview
        })

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9", 
        "Referer": "http://www.google.com/"
    }
    try:
        async with aiohttp.ClientSession(headers=headers, connector=aiohttp.TCPConnector(ssl=False)) as session:
            tasks = []
            for url in [item["link"] for item in result["items"]]:
                tasks.append(asyncio.create_task(scrape(url, session)))
            results = await asyncio.gather(*tasks)
        
        results = [{"text": d["text"], "url": d["url"]} for sublist in results for d in sublist if d["text"]!=""]
        cosine_similarities = rank_samples(query, [d["text"] for d in results])
        ranked_context = [item for index, item in sorted(enumerate(results), key = lambda x: cosine_similarities[x[0]], reverse=True)]
        #get a a bit of context from each url
        joined_context = ""
        urls = []
        for d in ranked_context:
            url = d["url"]
            if len(set(urls)) >= 5:
                #only want to include five sources
                break
            elif len(joined_context)+len(d["text"]) > 8000:
                ##prompt limit 3097 tokens (4097-1000 for completion)
                ##1000 tokens ~ 750 words
                break
            else:
                if urls.count(url) < 10:
                    if url in urls:
                        reference_number = urls.index(url)+1
                    else:
                        reference_number = len(set(urls))+1
                    joined_context += f"Source {reference_number}:" + d["text"] + "\n"
                    urls.append(url)

        else:
            raise Exception("Search returned no results")

        sources = [d for d in result_list if d["url"] in list(set(urls))[:5]]

        return joined_context, sources
    except Exception as e:
        #traceback.print_exc()
        return "", []

async def new_user_description(db: Session, member_id: str, samples_string: str):
    messages = [
        f"Pretend the following text was written by you.\nText:\n'''\n{samples_string}\n'''\nGive an elaborate description of your writing style, audience, semantics, syntax. If the language is English, what type of English is it? Speak in first person.\n",
        f"The following text was written by a human.\nText:\n'''\n{samples_string}\n'''\nGive an in-depth description of who you believe this person is, including their demographic and likely occupation. What values and beliefs does this person hold? Speak in first person.\n"
    ]
    description, about = openai_call(messages, 400, 0.3, 0.1) #standard openai call allows batching

    #update fields
    crud.update_user_description(db, description, member_id)
    crud.update_user_about(db, about, member_id)

async def summarise(query: str, context: str):
    message = [{
        "role": "user", 
        "content": f"I would like to write about {query}. Using at least 300 words, summarise the relevant points from the following text, using numerical in-text citation with square brackets, e.g. [x], where necessary. \
        Make sure to include any relevant dates, stats, or figures.\nText:\n'''\n{context}\n'''\n"
    }]
    return turbo_openai_call(message, 450, 0, 0.4) #300 words ~ 400 tokens


async def streamAIResponse(websocket: WebSocket, messages, logit_bias, max_tokens: int = 1000, temperature: int = 0, presence_penalty: int = 0, n: int = 1):
    """
    Streams OpenAI response to client.
    """
    attempts = 0 #catch errors communicating with OpenAI

    while attempts<3:
        try:    
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                presence_penalty=presence_penalty,
                logit_bias=logit_bias,
                n = n,
                stream=True
            )                     

            message_list = []
            await websocket.send_json({"message": "[START MESSAGE]"})
            for chunk in response:
                index = chunk["choices"][0].index
                delta = chunk['choices'][0]['delta']
                message = str(delta.get('content', ''))
                await websocket.send_json({"message": message, "index": index})
                message_list.append(message) #store messages to add to DB
                        
            completion = ''.join(message_list)

            break

        except Exception as e:
            print(e)
            attempts+=1

    return completion


@app.get("/")
async def root():
    return {}

@app.get("/get_user/{member_id}", status_code=200)
async def get_user(member_id: str, db: Session = Depends(get_db)):
    return crud.get_user(db, member_id)

@app.post("/create_user", status_code=200)
def create_user(new_user: schemas.UserBase, db: Session = Depends(get_db)):
    """
    Called when a user signs up. Creates empty user object in DB.

    :param member_id: user's Memberstack ID
    :param name: user's first name
    """
    return crud.create_user(db, new_user)

@app.post("/create_job/{user_id}", status_code=200)
def create_job(new_job: schemas.Job, user_id: str, db: Session = Depends(get_db)):
    """
    Called when a new job is created. Creates Job object in DB.

    :param member_id: user's Memberstack ID
    :param job_name: job name
    """
    try:
        new_job = crud.create_job(db, new_job, user_id) #create job in DB and return job id
        
        if user_id in cache.active_users:
            #add new job to cache
            existing_data = cache.get_user_data(user_id)["data"]
            existing_data["user"].append({"job_id": new_job.id, "name": new_job.name, "word_count": 0, "data": []})
            cache.update_user_data(user_id, existing_data) 

        return new_job
    except Exception as e:
        print(f"Could not create new job: ${e}")


@app.post("/remove_job/{job_id}", status_code=200)
def remove_job(job: schemas.Job, job_id: str, db: Session = Depends(get_db)):
    """
    Deletes job and associated data
    """
    try:
        user_id = job.user_id
        crud.remove_job(db, job_id) #remove job from db

        if user_id in cache.active_users:
            existing_data = cache.get_user_data(user_id)["data"]
            for index, cached_job in enumerate(existing_data["user"]):
                #remove job from cache
                if cached_job["job_id"] == int(job_id):
                    existing_data["user"].pop(index)
                    cache.update_user_data(user_id, existing_data) 
                    break
            
    except Exception as e:
        print(f"Could not remove job: ${e}")


@app.post("/sync_job/{member_id}", status_code=200)
async def sync_job(job: schemas.Job, member_id: str, db: Session = Depends(get_db)):
    """
    Called when user makes changes to job. 
    User jobs influence their writing description and about information.
    """
    try:
        job_id = job.id
        #extract samples from new data
        new_samples = [d.completion for d in job.data]

        #get user data
        if member_id in cache.active_users:
            existing_data = cache.get_user_data(member_id)["data"]
        else:
            existing_data = crud.get_data(db, member_id)

        #extract samples from existing data
        existing_samples = [d["completion"] for job in existing_data["user"] for d in job["data"]]

        #run description if number of words is at least 300
        #and if new data is substantially different to existing data
        new_samples_str = str("\n".join(sort_samples(new_samples)))
        existing_samples_str = str("\n".join(sort_samples(existing_samples)))

        #only consider first 8,000 characters ~ 2000 words
        #if len(new_samples_str.split()) > 300 and new_samples_str[:1000] != existing_samples_str[:1000]:
        if True:
            #TO DO: implement a better way of checking whether data changes substantially
            asyncio.create_task(new_user_description(db, member_id, new_samples_str[:8000]))

        #sync job in db
        job = crud.sync_job(db, job, member_id)

        #refresh job data in cache
        if member_id in cache.active_users:
            for cached_job in existing_data["user"]:
                if cached_job["job_id"]==int(job_id):
                    cached_job.update({"data": [{"completion": d.completion, "feedback": d.feedback} for d in job.data]})
                    cache.update_user_data(member_id, existing_data)
                    break

    except Exception as e:
        traceback.print_exc()


@app.post("/store_task/{member_id}", status_code=200)
def store_task(new_task: schemas.Task, member_id: str, db: Session = Depends(get_db)):
    return crud.store_task(db, new_task, member_id)

@app.post("/remove_task/{member_id}", status_code=200)
def remove_task(body: schemas.RemoveTaskRequest, member_id: str, db: Session = Depends(get_db)):
    completion = body.text
    return crud.remove_task(db, completion, member_id)

@app.post("/store_feedback/{member_id}", status_code=200)
def store_feedback(body: schemas.FeedbackRequestBody, member_id: str, db: Session = Depends(get_db)):
    completion, feedback = body.dict().values()
    return crud.store_feedback(db, completion=completion, feedback=feedback, member_id=member_id)

@app.post("/share_job/{member_id}")
async def share_job(body: schemas.ShareRequestBody, member_id: str, db: Session = Depends(get_db)):
    """
    Creates dummy user and job for others to use.
    :param member_id: user's Memberstack ID
    :param job_id: job to be shared
    :param description: string, job description
    :param instructions: string, job instructions
    :param access: anyone, link, organisation
    """
    
    data = body.dict()

    job_id = data["job_id"]
    description = data["description"]
    instructions = data["instructions"]
    access = data["access"]

    job_schema = schemas.Job(id = job_id)

    #add dummy job to DB
    dummy_job = crud.share_job(db, job_schema, member_id)

    #send data to Zapier
    async with aiohttp.ClientSession() as session:
        url = "https://hooks.zapier.com/hooks/catch/14316057/3yq371j/"

        data = {
            "id": dummy_job.user_id, #uuid
            "user_description": "",
            "name": dummy_job.name,
            "description": description,
            "instructions": instructions,
            "access": access,
            "member": member_id,
        }
        async with session.post(url, json=data) as response:
            status = response.status

    return status

@app.post("/remove_shared_job/{member_id}")
async def remove_shared_job(job: schemas.Job, member_id: str, db: Session = Depends(get_db)):
    """
    Removes shared job from database.
    :param member_id: member that job belonds to
    :param job_id: job to be removed
    """

    job_id = job.id

    async with aiohttp.ClientSession() as session:
        url = "https://hooks.zapier.com/hooks/catch/14316057/3budn3o/"

        data = {
            "member": member_id,
            "id": job_id
        }
        async with session.post(url, json=data) as response:
            status = response.status

    if status:
        crud.remove_shared_job(db, job)

    return status

@app.post("/update_user_words/{member_id}", status_code=200)
def update_user_words(body: schemas.UserWordUpdate, member_id: str, db: Session = Depends(get_db)):
    value = body.value
    return crud.update_user_words(db, member_id, value)

def get_data(member_id: str):
    """
    Callback function for retrieving user data.
    """
    with SessionLocal() as db:
        return crud.get_data(db, member_id)

def store_new_task(member_id: str, category: str, prompt: str, completion: str, score: int, sources: list = [], job_id: str = -1):
    """
    :param job_id: job for which task was created
    """
    task_schema = schemas.Task(user_id=member_id, category=category, prompt=prompt, completion=completion, score=score, sources=sources, job_id=job_id)

    with SessionLocal() as db:
        return crud.store_task(db, task_schema, member_id)

def sync_tasks():
    """
    Callback function for scheduling sync tasks function.
    """
    db = SessionLocal() #cannot use Depends in non-route functions
    crud.sync_tasks(db)
    print("Tasks synced!")
    db.close()

def reset_words():
    """
    Callback function for scheduling reset words function.
    """
    db = SessionLocal() #cannot use Depends in non-route functions
    crud.reset_words(db)
    print("Words reset!")
    db.close()


@app.post("/detect", status_code=200)
async def detect(body: schemas.DetectRequestBody):
    text = body.text
    score = await predict_text(str(text))
    return score

@app.post('/read_files', status_code=200)
async def read_files(files: list[UploadFile] = File(...)):
    """
    reads .docx or .pdf files
    """
    MIN_CHARACTERS = 20 #prevent non-meaningful samples
    MAX_CHARACTERS = 8000
    samples = []
    for file in files:
        contents = await file.read()
        extension = file.filename.split(".")[-1]
        samples.append("") #append new sample
        try:
            if extension == "docx":
                doc = Document(BytesIO(contents))
                for para in doc.paragraphs:
                    words = para.text.split()
                    for word in words:
                        text = samples[-1]
                        if len(text) + len(word) < MAX_CHARACTERS:
                            samples[-1] += f"{word} "
                        else:
                            samples.append(word)

            elif extension == "pdf":
                viewer = SimplePDFViewer(contents)
                for canvas in viewer:
                    words = ''.join(canvas.strings)
                    for word in words.split():
                        text = samples[-1]
                        if len(text) + len(word) < MAX_CHARACTERS :
                            samples[-1] += f"{word} "
                        else:
                            samples.append(word)
            else:
                samples.append(f"Unsupported filetype {extension}")
            
        except Exception as e:
            traceback.print_exc()
            samples.append(f"Could not read file {file.filename}")
    
    return {"texts": [s for s in samples if len(s)>MIN_CHARACTERS]}

async def handleTask(user_id: str, websocket: WebSocket, data: dict):
    try:
        user_data = cache.get_user_data(user_id)["data"]

        sources = None #initiliase sources variable

        if data["category"]=="task":
            job = int(data["job_id"])

            category = data["type"]
            topic = data["topic"]
            additional = data["additional"]
            length = int(data["length"])
            search = data["search"]=="true" #bool
            
            length_tokens = round(length*4/3)  #one token ~ 3/4 word
            margin = 400  #allow for uncounted tokens and fluctuations in token count

            if search:
                maxlength = 4097 - 450 - length_tokens - len(additional.split())*4/3 - margin #prompt limit 4097 tokens

                #search web and get user data simultaneously 
                search_task = asyncio.create_task(conduct_search(topic))
                construct_task = asyncio.create_task(construct_prompt(user_data, data["category"], topic, maxlength, job))

                search_result, sources = await search_task
                messages, logit_bias = await construct_task

                if search_result != "":
                    summarise_task = asyncio.create_task(summarise(topic, search_result))

                    await websocket.send_json({"message": "[SOURCES]", "sources": sources}) #send sources to client prior to awaiting summary

                    summary = await summarise_task
                    ##append search summary
                    messages[0]["content"] += f"The following was following summarised from a variety of sources on the web. \
                    You may refer to these sources in your response and use in-text citation where appropriate. If the context is not relevant you may disregard it.\nSummary of search:\n'''\n{summary}\n'''\n"

                else:
                    await websocket.send_json({"message": "[SOURCES]", "sources": []})

            else:
                search_result = ""

                maxlength = 4097 - length_tokens - len(additional.split())*4/3 - margin #prompt limit 4097 tokens

                messages, logit_bias = await construct_prompt(user_data, data["category"], topic, maxlength, job)

            messages[0]["content"] += f"\n\nMy prompt: Write a {category} about {topic}.\n\n"

            if len(additional)>0:
                messages[0]["content"] += f"Additional instructions:\n'''\n{additional}\n'''\n"

            max_tokens, temperature, presence_penalty = length_tokens, 1.2, 0
            prompt = f"Write a(n) {category} about {topic}." #prompt to store in DB

        elif data["category"]=="question":
            job = int(data["job_id"])

            question = data["question"]
            additional = data["additional"]
            search = data["search"]=="true"

            
            margin = 400  #allow for uncounted tokens and fluctuations in token count
            if search:
                if job > 0:
                    maxlength = 4097 - 450 - len(additional.split())*4/3 - margin #prompt limit 4097 tokens - 450 for search result
                else:
                    maxlength = 0
                #search web and construct messages simultaneously 
                search_task = asyncio.create_task(conduct_search(question))
                construct_task = asyncio.create_task(construct_prompt(user_data, data["category"], question, maxlength, job))
                
                search_result, sources = await search_task
                messages, logit_bias = await construct_task

                if search_result != "":
                    summarise_task = asyncio.create_task(summarise(question, search_result))

                    await websocket.send_json({"message": "[SOURCES]", "sources": sources}) #send sources to client prior to awaiting summary

                    summary = await summarise_task
                    ##append search summary
                    messages[0]["content"] += f"The following was following summarised from a variety of sources on the web. \
                    You may refer to these sources in your response and use in-text citation where appropriate. If the context is not relevant you may disregard it.\nSummary of search:\n'''\n{summary}\n'''\n"

                else:
                    await websocket.send_json({"message": "[SOURCES]", "sources": []})

            else:
                search_result = ""

                if job > 0:
                    maxlength = 4097  - len(additional.split())*4/3 - margin #prompt limit 4097 tokens
                else:
                    maxlength = 0

                messages, logit_bias = await construct_prompt(user_data, data["category"], question, maxlength, job)

            messages[0]["content"] += f"Question: {question}?\n\n"

            if len(additional)>0:
                messages[0]["content"] += f"Additional instructions:\n'''\n{additional}\n'''\n"
        
            max_tokens, temperature, presence_penalty = 500, 1.1, 0
            prompt = f"{question}?" #prompt to store in DB

        elif data["category"]=="rewrite":
            job = int(data["job_id"])

            text = data["text"]
            additional = data["additional"]

            #prompt must accomodate raw text in input and modified text in output
            length_tokens = round(len(text.split())*4/3)+100 #allow extra room  in response for rewrite
            margin = 400 #allow for uncounted tokens and fluctuations in token count

            maxlength = 4097 - length_tokens - len(text.split())*4/3 - len(additional.split())*4/3 - margin #prompt limit 4097 tokens
            messages, logit_bias = await construct_prompt(user_data, data["category"], text, maxlength, job)

            messages[0]["content"] += f"Text:\n\n{text}\n\n"

            if len(additional)>0:
                messages[0]["content"] += f"Additional instructions:\n'''\n{additional}\n'''\n"

            max_tokens, temperature, presence_penalty = length_tokens, 1.0, 0 
            #define prompt to be stored in DB
            prompt = f"Rewrite: {text[:120]}..."

        elif data["category"]=="idea":
            job = None

            category = data["type"]
            topic = data["topic"]
        
            messages = [{
                "role": "user", 
                "content": f"Generate ideas for {category} about {topic}. Elaborate on each idea by providing specific examples of what content to include.\n"
            }]

            logit_bias = {}
            max_tokens, temperature, presence_penalty = 500, 0.3, 0.2
            #define prompt to be stored in DB
            prompt = f"Generate content ideas for {category} about {topic}"

        n = 1 #number of responses to stream
        completion = await streamAIResponse(websocket, messages, logit_bias, max_tokens, temperature, presence_penalty, n)

        if data["category"]!="idea":
            score = await predict_text(completion)
        else:
            #ideas are not scored
            score = None

        await websocket.send_json({"message": "[END MESSAGE]", "score": score}) #send score 

        #store task in DB
        try:
            store_new_task(member_id=user_id, category=data["category"], prompt=prompt, completion=completion, score=score, sources=sources, job_id=data["job_id"])

        except Exception as e:
            print(f"Could not store task: {e}")
    
    except asyncio.CancelledError:
        print(f"Task cancelled")
    
    if id(websocket) in active_tasks:
        del active_tasks[id(websocket)]

async def handleCompose(user_id: str, websocket: WebSocket, data: dict):
    try:
        user_data = cache.get_user_data(user_id)["data"]

        job = int(data["job_id"])

        category = data["type"]
        topic = data["topic"]

        text = data["text"]

        if data["category"]=="sentence":
            length_tokens = 40
            margin = 400
            maxlength = 4097 - length_tokens - len(text.split())*4/3 - margin #prompt limit 4097 tokens

            messages, logit_bias = await construct_prompt(user_data, "task", topic, maxlength, job)
            
            if len(text) > 0:
                messages += [
                    {"role": "user", "content": f"My prompt: Write a {category} about {topic}\n"},
                    {"role": "assistant", "content": f"{text}"},
                    {"role": "user", "content": "Write the next sentence. Remember to stay in character.\n"}
                ]
            else:
                ##user may ask to generate the next sentence when text is empty
                messages += [
                    {"role": "user", "content": f"My prompt: Write the first sentence of a {category} about {topic}\n"}
                ]
            max_tokens, temperature, presence_penalty = length_tokens, 1.1, 0

        elif data["category"]=="paragraph":
            length_tokens = 120
            margin = 400
            maxlength = 4097 - length_tokens - len(text.split())*4/3 - margin #prompt limit 4097 tokens

            messages, logit_bias = await construct_prompt(user_data, "task", topic, maxlength, job)
            if len(text) > 0:
                messages += [
                    {"role": "user", "content": f"My prompt: Write a {category} about {topic}\n"},
                    {"role": "assistant", "content": f"{text}"},
                    {"role": "user", "content": "Write the next paragraph. Remember to stay in character.\n"}
                ]
            else:
                messages += [
                    {"role": "user", "content": f"My prompt: Write the first paragraph of a {category} about {topic}\n"}
                ]
            max_tokens, temperature, presence_penalty = length_tokens, 1.1, 0
        
        elif data["category"]=="rewrite":
            extract = data["extract"] #piece of text to be rewritten
            length_tokens = round(len(extract.split())*4/3)+100 #number of tokens allowed in response

            margin = 400
            maxlength = 4097 - length_tokens*2 - len(text.split())*4/3 - margin #length_tokens appears twice, once in prompt and in completion

            messages, logit_bias = await construct_prompt(user_data, "rewrite", topic, maxlength, job)

            messages += [
                {"role": "user", "content": f"My prompt: write a {category} about {topic}\n"},
                {"role": "assistant", "content": f"{text}"},
                {"role": "user", "content": f"Rewrite the following extract from the above text. Remember to stay in character.\n'''\n{extract}\n'''\n"}
            ]
            max_tokens, temperature, presence_penalty = length_tokens, 1.1, 0

        n = 3
        completion = await streamAIResponse(websocket, messages, logit_bias, max_tokens, temperature, presence_penalty, n)

        score = await predict_text(completion)

        await websocket.send_json({"message": "[END MESSAGE]", "score": score}) #send score 

    except asyncio.CancelledError:
        print(f"Task cancelled")
    
    if id(websocket) in active_tasks:
        del active_tasks[id(websocket)]


cache = UserCache() #initialise cache
manager = ConnectionManager() #initialise connection manager

active_tasks = {}

async def check_connection(user_id: str):
    """
    Checks whether use connected after five seconds, and removes data from cache
    """
    await asyncio.sleep(5) #wait five seconds
    user_data = cache.get_user_data(user_id)
    if user_data and user_data["connection"] not in manager.active_connections:
        cache.remove_user(user_id)

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket)

    websocket_id = id(websocket)

    #check if user data is in cache
    if user_id in cache.active_users:
        user_data = cache.get_user_data(user_id)["data"]
        cache.update_user_connection(user_id, websocket)

    else:
        user_data = get_data(user_id)
        cache.new_user(user_id, user_data, websocket)

    await websocket.send_json(user_data)

    try:
        while True:
            data = await websocket.receive_json()

            if True:
                #start new task
                if "compose" not in data.keys():
                    task = asyncio.create_task(handleTask(user_id, websocket, data))

                else:
                    task = asyncio.create_task(handleCompose(user_id, websocket, data))

                active_tasks[websocket_id] = task

            else:
                #cancel task
                if websocket_id in active_tasks:
                    task = active_tasks[websocket_id]
                    task.cancel()
                    await task
                    websocket.send_json({"message": "[END MESSAGE]", "score": -1})
                else:
                    print("no active task")

    except WebSocketDisconnect as e:
        print(f"WebSocket connection closed with code {e.code}")

    except ConnectionClosedError as e:
        print(f"Connection closed with error: {e}")

    except Exception as e:
        print(e)
        await websocket.close() #force close connection
        
    if websocket_id in active_tasks:
        task = active_tasks[websocket_id]
        task.cancel()
        
    await manager.disconnect(websocket)
    
    asyncio.create_task(check_connection(user_id)) #creates background task to remove data from cache after five seconds


@app.on_event("startup")
async def startup():
    scheduler = BackgroundScheduler()

    #schedule sync tasks to run at 1AM at start of every day
    scheduler.add_job(sync_tasks, "interval", start_date='2023-04-16 01:00:00', days=1, timezone="Australia/Sydney")

    #schedule reset words function to execute at end of each month
    scheduler.add_job(reset_words, "cron", day="last", timezone="Australia/Sydney")

    scheduler.start()