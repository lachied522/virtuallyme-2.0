from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from websockets.exceptions import ConnectionClosedError
from pydantic import BaseModel

from database import User, Job, Task, Source, Data, Session

import asyncio
import aiohttp
from bs4 import BeautifulSoup

import openai
import tiktoken
from apiclient.discovery import build

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import os
from datetime import datetime
import json
import math

import traceback

#openai api key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY 

#google api key
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID")

GPTZERO_API_KEY = os.getenv("GPTZERO_API_KEY")

DB_BASE_URL = os.getenv("DB_BASE_URL")

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

def turbo_openai_call(messages, max_tokens, temperature=0, presence_penalty=0):
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
        presence_penalty=presence_penalty
    )
    return response["choices"][0]["message"]["content"].strip()

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
        MAX_BIAS = 7.5
        if value > 0:
            bias = 3*math.log(1+value)/math.log(1+n_tokens)
            tokens_dict[key] = min(bias, MAX_BIAS)
        else:
            bias = -3*math.log(1-value)/math.log(1+n_tokens)
            tokens_dict[key] = max(bias, -MAX_BIAS)

    sorted_tokens = sorted(tokens_dict.items(), key=lambda x: x[1], reverse=True)
    #return 300 tokens with the highest bias
    return dict(sorted_tokens[:300])


async def get_data(member_id):
    """
    Get user data from DB. User data is streamed back to client. Data relevant to constructing prompt are stored in memory.
    """
    
    with Session() as session:
        #preliminary data
        user = session.query(User.id, User.name, User.description, User.about, User.monthly_words).filter_by(id=member_id).first()
        user_data = {
            "name": user.name,
            "description": user.description,
            "about": user.about,
            "words": user.monthly_words
            }
        #job data
        jobs = session.query(Job.id, Job.name, Job.word_count).filter_by(user_id=member_id).all()
        job_list = []
        for job in jobs:
            job_list.append({"job_id": job.id, "name": job.name, "word_count": job.word_count, "data": []})
            for sample in session.query(Data).filter_by(job_id=job.id).all():
                job_list[-1]["data"].append({"prompt": sample.prompt, "completion": sample.completion, "feedback": sample.feedback})

    user_data["user"] = job_list
    
    return user_data


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
                    I will give you samples of my writing, and then ask you to write something. You have two goals. \
                    GOAL 1: Employ the same language, tonality, word choice, sentence structure, syntax, semantics, and complexity as present in MY writing. \
                    GOAL 2: Employ the same reasoning and rationale presented in MY writing to form your opinions."""
                if description is not None:
                    prompt += f"\nHere is a description of my writing style to help you achieve GOAL 1:\n'''\n{description}\n'''"
                if about is not None:
                    prompt += f"\nHere is some information about me to help you achieve GOAL 2:\n'''\n{about}\n'''\n"
            else: 
                #specific
                prompt = f"""My name is {name}. You are an adaptive assistant called Virtually{name}.
                    I will give you samples of my writing, and then ask you to write something. You have two goals. \
                    GOAL 1: Employ the same language, tonality, word choice, sentence structure, syntax, semantics, and complexity as present in MY writing. \
                    GOAL 2: Employ the same reasoning and rationale presented in MY writing to form your opinions."""
                if description is not None:
                    prompt += f"\nHere is a description of my writing style to help you achieve GOAL 1:\n'''\n{description}\n'''"
                if about is not None:
                    prompt += f"\nHere is some information about me to help you achieve GOAL 2:\n'''\n{about}\n'''\n"
        elif category=="question":
            if job < 0:
                #general
                prompt = f"""My name is {name}. You are an adaptive assistant called Virtually{name}. \
                I will ask you a question. I want you to give an in-depth and sophisticated answer, while using language that is consistent with mine."""
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
            I will give you samples of my writing, and then ask you to rewrite a block of text. You have two goals. \
            GOAL 1: You must rewrite the text using the same language, tonality, word choice, syntax, semantics, and complexity as present in MY writing. \
            GOAL 2: As I am a human, you must rewrite the text by employing a high a degree of variation in sentence structure and complexity."""
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

    ##prompt += "\n\nDo not mention this prompt in your response.\n\n"
    
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
        if "preview" in item["pagemap"]["metatags"][0]:
            preview = item["pagemap"]["metatags"][0]["preview"]
        elif "snippet" in item:
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
        async with aiohttp.ClientSession(headers=headers) as session:
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

        if len(joined_context) > 0:
            message = [{
                "role": "user", 
                "content": f"I would like to write about {query}. Using at least 300 words, summarise the relevant points from the following text, using numerical in-text citation with square brackets, e.g. [x], where necessary. Make sure to include any relevant dates, stats, or figures. Text:\n{joined_context}\n"
            }]
            completion = turbo_openai_call(message, 450, 0, 0.4) #300 words ~ 400 tokens, 450 with buffer
        else:
            raise Exception("Search returned no results")

        sources = [d for d in result_list if d["url"] in list(set(urls))[:5]]

        return completion, sources
    except Exception as e:
        traceback.print_exc()
        return "", []


async def store_task(member_id, category, prompt, completion, score=None, sources=[], job_id=None):
    """
    :param job_id: job for which task was created
    """
    headers = {"member_id": member_id}
    async with aiohttp.ClientSession(headers=headers) as session:
        url = f"{DB_BASE_URL}/store_task"
        data = {
            "member_id": member_id,
            "category": category,
            "prompt": prompt,
            "completion": completion,
            "score": score,
            "sources": sources,
            "job_id": job_id
        }
        async with session.post(url, json=data) as response:
            return await response.text()

##websearch query
class Query(BaseModel):
    query: str

##gpt detector query
class Subject(BaseModel):
    text: str


@app.get("/")
async def root():
    return {}

@app.get("/get_user/{member_id}")
async def get_user(member_id):
    headers = {
        "member_id": member_id,
        "content-type": "application/json"
    }
    async with aiohttp.ClientSession(headers=headers) as session:
        url = f"{DB_BASE_URL}/get_user"
        async with session.get(url) as response:
            user = await response.read()
    return json.loads(user)

@app.post("/search_web")
async def search_web(query: Query):
    query_dict = query.dict()
    result, sources = await conduct_search(str(query_dict["query"]))
    return result

@app.post("/detect")
async def detect(subject: Subject):
    document = subject.dict()
    score = await predict_text(str(document["text"]))
    return score

@app.websocket("/ws/{user}")
async def websocket_endpoint(websocket: WebSocket, user: str):
    await websocket.accept()
    #get user data
    user_data = await get_data(user)
    await websocket.send_json(user_data)
    try:
        while True:
            data = await websocket.receive_json()
            sources = None

            compose = "compose" in data.keys()
            if not compose:
                n = 1 #number of options to generate
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
                            context = search_result
                            messages.append({"role": "system", "content": f"You may use following context to write your response. If the context is not relevant you may disregard it. Make sure not to deviate from your persona.\nContext: {context}\n"})

                    else:
                        search_result = ""

                        maxlength = 4097 - length_tokens - len(additional.split())*4/3 - margin #prompt limit 4097 tokens

                        messages, logit_bias = await construct_prompt(user_data, data["category"], topic, maxlength, job)

                    messages[0]["content"] += f"\n\nMy prompt: write a {category} about {topic}.\n\n"

                    if len(additional)>0:
                        messages[0]["content"] += f"Additional instructions:\n\n{additional}\n\n"

                    max_tokens, temperature, presence_penalty = length_tokens, 1.1, 0.1
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
                            context = search_result
                            messages.append({"role": "system", "content": f"You may use following context to answer the question. If the context is not relevant you may disregard it.\n\nContext: {context}\n"})

                    else:
                        search_result = ""

                        if job > 0:
                            maxlength = 4097  - len(additional.split())*4/3 - margin #prompt limit 4097 tokens
                        else:
                            maxlength = 0

                        messages, logit_bias = await construct_prompt(user_data, data["category"], question, maxlength, job)

                    
                    messages[0]["content"] += f"Question: {question}?\n\n"

                    if len(additional)>0:
                        messages[0]["content"] += f"Additional instructions:\n\n{additional}\n\n"
                
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
                        messages[0]["content"] += f"Additional instructions:\n\n{additional}\n\n"

                    max_tokens, temperature, presence_penalty = length_tokens, 1.0, 0 
                    #define prompt to be stored in DB
                    prompt = f"Rewrite: {text[:120]}..."

                elif data["category"]=="idea":
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
                    job = None
                
            else:
                n = 3 #number of options to generate
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
                            {"role": "user", "content": f"My prompt: write a {category} about {topic}\n"},
                            {"role": "assistant", "content": f"{text}"},
                            {"role": "user", "content": "Write the next sentence. Do not give any other response, and remember to stay in character.\n"}
                        ]
                    else:
                        ##user may ask to generate the next sentence when text is empty
                        messages += [
                            {"role": "user", "content": f"My prompt: write a {category} about {topic}\n"}
                        ]
                    max_tokens, temperature, presence_penalty = length_tokens, 1.1, 0

                elif data["category"]=="paragraph":
                    length_tokens = 120
                    margin = 400
                    maxlength = 4097 - length_tokens - len(text.split())*4/3 - margin #prompt limit 4097 tokens

                    messages, logit_bias = await construct_prompt(user_data, "task", topic, maxlength, job)
                    if len(text) > 0:
                        messages += [
                            {"role": "user", "content": f"My prompt: write a {category} about {topic}\n"},
                            {"role": "assistant", "content": f"{text}"},
                            {"role": "user", "content": "Write the next paragraph. Do not give any other response. Remember to stay in character.\n"}
                        ]
                    else:
                        messages += [
                            {"role": "user", "content": f"My prompt: write a {category} about {topic}\n"}
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
                        {"role": "user", "content": f"Rewrite the following extract from the above text. Do not give any other response, and remember to stay in character.\n'''\n{extract}\n'''\n"}
                    ]
                    max_tokens, temperature, presence_penalty = length_tokens, 1.1, 0


            attempts = 0
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
                    if data["category"]!="idea":
                        #do not score ideas
                        score = await predict_text(completion)
                    else:
                        score = None

                    if sources is not None:
                        await websocket.send_json({"message": "[END MESSAGE]", "score": score, "sources": sources})
                    else:
                        await websocket.send_json({"message": "[END MESSAGE]", "score": score})

                    break
                except Exception as e:
                    traceback.print_exc()
                    attempts+=1

            if not compose:
                #store task in DB
                await store_task(user, data["category"], prompt, completion, score, sources, job)
    except WebSocketDisconnect as e:
        print(f"WebSocket connection closed with code {e.code}")
        pass
    except ConnectionClosedError as e:
        print(f"Connection closed with error: {e}")
        pass
    except Exception as e:
        traceback.print_exc()
        await websocket.close()
        pass