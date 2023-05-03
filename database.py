from datetime import datetime
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship, backref, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

DATABASE_URL = os.getenv("DATABASE_URL") #internal

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
Session = sessionmaker(bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = 'user'
    id = Column(String(100), primary_key=True) #get from Memberstack
    name = Column(String(100))
    about = Column(Text)
    description = Column(Text)
    monthly_words = Column(Integer, default=0)
    jobs = relationship('Job', backref=backref('user'), lazy='joined')
    tasks = relationship('Task', backref=backref('user'), lazy='joined')

class Job(Base):
    __tablename__ = 'job'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    word_count = Column(Integer)
    data = relationship('Data', backref=backref('job'), lazy='joined')
    user_id = Column(String(100), ForeignKey('user.id'))
    
class Task(Base):
    __tablename__ = 'task'
    id = Column(Integer, primary_key=True)
    prompt = Column(Text)
    completion = Column(Text)
    category = Column(String(100)) #task, question, idea, rewrite, or composition
    created_at = Column(DateTime(timezone=True), default=datetime.now())
    score = Column(Integer)
    sources = relationship('Source', backref=backref('sources'), lazy='joined')
    feedback = Column(String(10)) #positive or negative
    user_id = Column(String(100), ForeignKey('user.id'))
    job_id = Column(String(100), ForeignKey('job.id'))

class Source(Base):
    __tablename__ = 'source'
    id = Column(Integer, primary_key=True)
    url = Column(String())
    display = Column(String())
    title = Column(String())
    preview = Column(Text())
    task_id = Column(Integer, ForeignKey("task.id"))
    
class Data(Base):
    __tablename__ = 'data'
    id = Column(Integer, primary_key=True)
    prompt = Column(Text)
    completion = Column(Text)
    feedback = Column(String(100)) #user-upload, positive, or negative
    job_id = Column(Integer, ForeignKey('job.id'))
