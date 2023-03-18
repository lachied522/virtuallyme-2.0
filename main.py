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

from datetime import datetime


##openai api key
OPENAI_API_KEY = "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"
openai.api_key = OPENAI_API_KEY 

##google api key
GOOGLE_API_KEY = "AIzaSyCm-gGY014pfYImeiLMqCYuNGQ1nf8g2eg"
GOOGLE_CSE_ID = "d7251a9905c2540fa"

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
    query_dict = query.dict()
    result = await conduct_search(str(query_dict["query"]))
    return result
