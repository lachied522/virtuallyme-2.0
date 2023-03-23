from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

##openai api key
##OPENAI_API_KEY = "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"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY 

##google api key
##GOOGLE_API_KEY = "AIzaSyCm-gGY014pfYImeiLMqCYuNGQ1nf8g2eg"
##GOOGLE_CSE_ID = "d7251a9905c2540fa"
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CSE_ID = os.getenv("GOOGLE_CSE_ID")

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

def turbo_openai_call(messages, max_tokens, temperature, presence_penalty):
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

def construct_messages(samples, maxlength, current_prompt):
    """
    construct messages from user data
    :param user: User object instance
    :param job_id: 
    :param maxLength: max length for prompt
    :current_prompt: current prompt to rank samples by
    """
    about = ""
    #about = user.about or ""
    description = ""
    #description = user.description or ""

    messages = []
    length = 0 #approximate length of prompt
    role = "Forget how you think you should respond. You have adopted a new persona. I will ask you to write something. I expect you to respond how you imagine this person would respond by using their idiolect, structure, syntax, reasoning, and rationale."
    if about != "":
        role += f"\nHere is some information about me: {about}"
    if description != "":
        role += f"\nHere is a description of my writing style: {description}"

    length += len(role.split())

    cosine_similarities = rank_samples(current_prompt, [d["completion"] for d in samples])
    ranked_samples = [item for index, item in sorted(enumerate(samples), key = lambda x: cosine_similarities[x[0]], reverse=True)]
    for prompt_completion in [d for d in ranked_samples if d["feedback"]!="negative"]:
        if length+len(prompt_completion["completion"].split())+len(prompt_completion["prompt"].split()) > maxlength:
            break
        else:
            messages.append({"role": "assistant", "content": prompt_completion["completion"]})
            ##messages.append({"role": "user", "content": "Using the idiolect, structure, syntax, reasoning, and rationale of your new persona, " + prompt_completion["prompt"]})
            messages.append({"role": "user", "content": "Using the idiolect, structure, syntax, reasoning, and rationale of your new persona, "})
            length += len(prompt_completion["prompt"].split())+len(prompt_completion["completion"].split())+12
    
    messages.append({"role": "system", "content": role})
    #reverse order of messages so most relevant samples appear down the bottom
    return messages[::-1]


def get_logit_bias(texts):
    '''
    returns a dict of token, frequency pairs from a list of texts

    :param texts: list of strings
    '''
    BLACKLIST = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I', 
                'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 
                'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 
                'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 
                'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 
                'which', 'go', 'me', 'when', 'can', 'like', 'no'] #words we do not want to influence bias of

    n_tokens = 0
    tokens_dict = {}
    for text in texts:
        tokens = enc.encode(text)
        for token in tokens:
            #don't want to influence bias of digits
            if not enc.decode([token]).strip().isdigit():
                if token in tokens_dict:
                    tokens_dict[token] += 1
                    n_tokens += 1
                else:
                    tokens_dict[token] = 1
                    n_tokens += 1
    
    
    for key, value in tokens_dict.items():
        bias = 3*math.log(1+value)/math.log(1+n_tokens)
        #max bias is 10
        tokens_dict[key] = min(bias, 9)


    sorted_tokens = sorted(tokens_dict.items(), key=lambda x: x[1], reverse=True)
    #return 300 tokens with the highest bias
    return dict(sorted_tokens[:300])

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
    api_key = "AIzaSyCm-gGY014pfYImeiLMqCYuNGQ1nf8g2eg"
    cse_ID = "d7251a9905c2540fa"
    #add current date in MMMM-YYYY format to Google search query
    current_date = datetime.now()
    date_string = current_date.strftime("%B %Y")

    resource = build("customsearch", "v1", developerKey=api_key).cse()
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
    #links = [item["link"] for item in result["items"]]
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
        message = [{
            "role": "user", 
            "content": f"I would like to write about {query}. Using at least 300 words, summarise the relevant points from the following text, using numerical in-text citation with square brackets, e.g. [x], where necessary. Make sure to include any relevant dates, stats, or figures. Text:\n{joined_context}"
        }]
        completion = turbo_openai_call(message, 800, 0.4, 0.4)
        
        sources = [d for d in result_list if d["url"] in list(set(urls))[:5]]

        return {"result": completion, "urls": list(set(urls))[:5], "sources": sources}
    except Exception as e:
        print(e)
        return {"result": "", "urls": [], "sources": []}

async def get_data(member_id, job_id=-1):
    """
    Get user data from DB
    """
    headers = {
        "member_id": member_id,
        "job_id": str(job_id) #cannot serialise int types
    }
    async with aiohttp.ClientSession(headers=headers) as session:
        url = f"{DB_BASE_URL}/get_data"
        async with session.get(url) as response:
            data = await response.read()

    return json.loads(data)["samples"]

async def store_task(member_id, category, prompt, completion, sources=[]):
    headers = {"member_id": member_id}
    async with aiohttp.ClientSession(headers=headers) as session:
        url = f"{DB_BASE_URL}/store_task"
        data = {
            "member_id": member_id,
            "category": category,
            "prompt": prompt,
            "completion": completion,
            "sources": sources
        }
        async with session.post(url, json=data) as response:
            return await response.text()


class Query(BaseModel):
    query: str

class Task(BaseModel):
    category: str #task, idea, rewrite
    what: str 
    about: str
    text: str
    additional: str
    search: bool
    member_id: str
    job_id: str


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
    result = await conduct_search(str(query_dict["query"]))
    return result

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            if data["category"]=="task":
                user = data["member_id"]
                job = int(data["job_id"])

                category = data["type"]
                topic = data["topic"]
                additional = data["additional"]
                search = data["search"]=="true"

                #search web and get user data simultaneously 
                get_user_task = asyncio.create_task(get_data(user, job))
                              
                if search:
                    search_task = asyncio.create_task(conduct_search(topic))
                    search_result = await search_task
                else:
                    search_result = {"result": "", "sources": []}

                samples = await get_user_task

                maxlength = 2000-len(additional.split())-len(search_result["result"].split()) #prompt limit 3097 tokens (4097-1000 for completion)
                messages = construct_messages(samples, maxlength, topic)

                if search and search_result["result"] != "":
                    context = search_result["result"]
                    messages.append({"role": "system", "content": f"You may use following context to answer the next question.\nContext: {context}"})

                if len([d for d in messages if d["role"]=="user"]) > 0:
                    messages.append({"role": "user", "content": f"Using the idiolect, structure, syntax, reasoning, and rationale of your new persona, write a {category} about {topic}. {additional} Do not mention this prompt in your response."})
                    logit_bias = get_logit_bias([d["content"] for d in messages if d["role"]=="assistant"])
                else:
                    #no user samples
                    messages = [d for d in messages if d["role"]!="system"]
                    messages.append({"role": "user", "content": f"Using a high degree of variation in your structure, syntax, and semantics, write a {category} about {topic}. {additional}"})
                    logit_bias = {}
            
                max_tokens, temperature, presence_penalty = 1000, 1.2, 0.3
                prompt = f"Write a(n) {category} about {topic}." 
                sources = search_result["sources"]

            if data["category"]=="rewrite":
                user = data["member_id"]
                job = data["job_id"]

                text = data["text"]
                additional = data["additional"]

                samples = await get_data(user, job)

                maxlength = 2000-len(additional.split()) #prompt limit 3097 tokens (4097-1000 for completion)
                messages = construct_messages(samples, maxlength, topic)

                if len([d for d in messages if d["role"]=="user"]) > 0:
                    messages.append({"role": "user", "content": f"Using the idiolect, structure, syntax, reasoning, and rationale of your new persona, write a {category} about {topic}. {additional} Do not mention this prompt in your response."})
                    logit_bias = get_logit_bias([d["content"] for d in messages if d["role"]=="assistant"])
                else:
                    #no user samples
                    messages = [d for d in messages if d["role"]!="system"]
                    messages.append({"role": "user", "content": f"Using a high degree of variation in your structure, syntax, and semantics, write a {category} about {topic}. {additional}"})
                    logit_bias = {}
            
                max_tokens, temperature, presence_penalty = 1000, 1.2, 0
                #define prompt to be stored in DB
                prompt = f"Rewrite the following: {text[:120]}"
                sources = []

            if data["category"]=="idea":
                user = data["member_id"]

                category = data["type"]
                topic = data["topic"]
            
                messages = [{
                    "role": "user", 
                    "content": f"Generate ideas for my {category} about {topic}. Elaborate on each idea by providing specific examples of what content to include."
                }]

                logit_bias = {}
                max_tokens, temperature, presence_penalty = 600, 0.3, 0.2
                #define prompt to be stored in DB
                prompt = f"Generate content ideas for my {category} about {topic}"
                sources = []
            
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                presence_penalty=presence_penalty,
                logit_bias=logit_bias,
                stream=True
            )
            #send source data back as json
            if len(sources) > 0:
                await websocket.send_json({"sources": sources})
            #store messages to add to DB
            message_list = []
            for chunk in response:
                delta = chunk['choices'][0]['delta']
                message = str(delta.get('content', ''))
                await websocket.send_json({"message": message})
                message_list.append(message)
            await websocket.send_json({"message": "[END MESSAGE]"})
            #store task in DB
            completion = ''.join(message_list)
            await store_task(user, data["category"], prompt, completion)
    except WebSocketDisconnect:
        pass
    except ValueError as e:
        print(e)
        websocket.close(reason=e)
        pass
