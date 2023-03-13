from fastapi import FastAPI
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import asyncio
import aiohttp

from apiclient.discovery import build

import openai
from bs4 import BeautifulSoup

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


##openai api key
OPENAI_API_KEY = "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"
openai.api_key = OPENAI_API_KEY 

##google api key
GOOGLE_API_KEY = "AIzaSyCm-gGY014pfYImeiLMqCYuNGQ1nf8g2eg"
GOOGLE_CSE_ID = "d7251a9905c2540fa"

def turbo_openai_call(messages, max_tokens, temperature, presence_penalty):
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages
    )
    return response["choices"][0]["message"]["content"]


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

async def fetch_page(url, session):
    print(f"fetching {url}")
    try:
        async with session.get(url) as response:
                return await response.text()
    except:
        return ""

async def scrape(url, session):
    html = await fetch_page(url, session)
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

async def conduct_search(query):    
    api_key = "AIzaSyCm-gGY014pfYImeiLMqCYuNGQ1nf8g2eg"
    cse_ID = "d7251a9905c2540fa"

    query += " -headlines -video -pdf"

    resource = build("customsearch", "v1", developerKey=api_key).cse()
    result = resource.list(q=query, cx=cse_ID).execute()

    links = [item["link"] for item in result["items"]][:5]
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9", 
        "Referer": "http://www.google.com/"
    }
    try:
        async with aiohttp.ClientSession(headers=headers) as session:
            tasks = []
            for url in links:
                tasks.append(asyncio.ensure_future(scrape(url, session)))
            results = await asyncio.gather(*tasks)
        
        results = [{"text": d["text"], "url": d["url"]} for sublist in results for d in sublist]
        cosine_similarities = rank_samples(query, [d["text"] for d in results])
        ranked_context = [item for index, item in sorted(enumerate(results), key = lambda x: cosine_similarities[x[0]], reverse=True)]
        #get a a bit of context from each url
        joined_context = ""
        urls = []
        for d in ranked_context:
            url = d["url"]
            if urls.count(url) < 10:
                if len(joined_context.split())+len(d["text"].split()) > 2250:
                    ##prompt limit 3097 tokens (4097-1000 for completion)
                    ##1000 tokens ~ 750 words
                    break
                else:
                    joined_context += d["text"]
                    urls.append(url)
        message = [{
            "role": "user", 
            "content": f"I would like to write about {query}. Summarise the relevant points from the following text, including any relevant dates or figures. Use a minimum of 300 words. Text:\n{joined_context}"
        }]
        completion = turbo_openai_call(message, 800, 0.4, 0.4)
        return {"result": completion, "urls": list(set(urls))[:5]}
    except:
        return {"result": "", "urls": []}

app = FastAPI()

# Set up allowed origins for CORS
origins = [
    "*"
]

# Add middleware to app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    query: str

@app.post("/")
async def root(query: Query):
    print("hi")
    query_dict = query.dict()
    result = await conduct_search(str(query_dict["query"]))
    return result
