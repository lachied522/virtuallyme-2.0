"""
Pydantic models determine structure of data received by API
"""
import datetime
from typing import List, Optional

from pydantic import BaseModel


class Data(BaseModel):
    id: Optional[int]
    completion: str
    feedback: Optional[str] = None #user-upload, positive, or negative
    job_id: Optional[str]

    class Config:
        orm_mode = True

class Source(BaseModel):
    id: Optional[int]
    url: str
    display: str
    title: str
    preview: str
    task_id: Optional[int]

    class Config:
        orm_mode = True
    
class JobBase(BaseModel):
    user_id: str
    

class Job(JobBase):
    id: Optional[str]
    name: Optional[str]
    word_count: Optional[int]
    user_id: Optional[str]
    data: Optional[List[Data]] = []

    class Config:
        orm_mode = True

class Task(BaseModel):
    id: Optional[int]
    prompt: str
    completion: str
    category: str #task, question, idea, rewrite, or composition
    created_at: Optional[datetime.date] 
    score: Optional[int]
    feedback: Optional[str]
    job_id: Optional[str] #not a strict relationship
    user_id: Optional[str]
    sources: Optional[List[Source]] = []

    class Config:
        orm_mode = True

class UserBase(BaseModel):
    id: str
    name: str

class User(UserBase):
    id: str
    name: str
    about: Optional[str]
    description: Optional[str]
    monthly_words: Optional[int]
    jobs: Optional[List[Job]] = []
    tasks: Optional[List[Task]] = []

    class Config:
        orm_mode = True


class SearchRequestBody(BaseModel):
    query: str

class DetectRequestBody(BaseModel):
    text: str

class RemoveTaskRequest(BaseModel):
    text: str

class RemoveJobRequest(BaseModel):
    job_id: str

class FeedbackRequestBody(BaseModel):
    completion: str
    feedback: str

class ShareRequestBody(BaseModel):
    member_id: str
    job_id: str
    description: str
    instructions: Optional[str]
    access: str

class UserWordUpdate(BaseModel):
    value: int