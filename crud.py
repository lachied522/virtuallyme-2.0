import datetime
import uuid

from sqlalchemy.orm import Session

import models, schemas


def create_user(db: Session, new_user: schemas.User):
    """
    Called when a user signs up. Creates empty user object in DB. 
    """
    user = models.User(id = new_user.id, name = new_user.name, monthly_words = 0)

    db.add(user)
    db.commit()
    db.refresh(user)

    return user

def get_user(db: Session, member_id: str):
    """
    Called when the page loads. Retrieves preliminary information to enable page load.

    :param member_id: user's Memberstack ID
    """
    try:
        user = db.query(models.User.name, models.User.description, models.User.monthly_words).filter_by(id=member_id).first()
        user_jobs = []
        
        all_tasks = db.query(models.Task).filter(models.Task.user_id == member_id).order_by(models.Task.created_at).all()
        user_tasks = []
        for task in [d for d in all_tasks if d.category=="task"]:
            sources = [{"url": d.url, "display": d.display, "title": d.title, "preview": d.preview} for d in task.sources]
            user_tasks.append({"prompt": task.prompt, "completion": task.completion, "feedback": task.feedback, "score": task.score, "created": str(task.created_at), "sources": sources})
        
        user_questions = []
        for question in [d for d in all_tasks if d.category=="question"]:
            sources = [{"url": d.url, "display": d.display, "title": d.title, "preview": d.preview} for d in question.sources]
            user_questions.append({"prompt": question.prompt, "completion": question.completion, "feedback": question.feedback, "score": question.score, "created": str(question.created_at), "sources": sources})

        user_ideas = [{"prompt": d.prompt, "completion": d.completion, "feedback": d.feedback, "score": d.score, "created": str(d.created_at)} for d in all_tasks if d.category=="idea"]
        user_rewrites = [{"prompt": d.prompt, "completion": d.completion, "feedback": d.feedback, "score": d.score, "created": str(d.created_at)} for d in all_tasks if d.category=="rewrite"]
        user_compositions = [{"prompt": d.prompt, "completion": d.completion, "score": d.score, "created": str(d.created_at)} for d in all_tasks if d.category=="composition"]

        response_dict = {
            "name": user.name,
            "description": user.description or "",
            "words": user.monthly_words or 0,
            "user": user_jobs,
            "tasks": user_tasks,
            "questions": user_questions,
            "ideas": user_ideas,
            "rewrites": user_rewrites,
            "compositions": user_compositions
        }

        return response_dict
    except Exception as e:
        print(e)
        return None
    
def get_data(db: Session, member_id: str):
    """
    Get user data from DB. User data is streamed back to client.
    """
    #preliminary data
    user = db.query(models.User.id, models.User.name, models.User.description, models.User.about, models.User.monthly_words).filter_by(id=member_id).first()
    user_data = {
        "name": user.name,
        "description": user.description,
        "about": user.about,
        "words": user.monthly_words
        }
    #job data
    jobs = db.query(models.Job.id, models.Job.name, models.Job.word_count).filter_by(user_id=member_id).all()
    job_list = []
    for job in jobs:
        job_list.append({"job_id": job.id, "name": job.name, "word_count": job.word_count, "data": []})
        for sample in db.query(models.Data).filter_by(job_id=job.id).all():
            job_list[-1]["data"].append({"prompt": sample.prompt, "completion": sample.completion, "feedback": sample.feedback})

    user_data["user"] = job_list
    
    return user_data


def create_job(db: Session, new_job: schemas.Job, member_id: str):
    """
    Called when a new job is created. Creates Job object in DB.

    :param member_id: user's Memberstack ID
    :param job_name: job name
    """

    job = models.Job(name=new_job.name, word_count=0, user_id=member_id)
    db.add(job)
    db.commit()
    db.refresh(job)

    return job


def remove_job(db: Session, job_id: str):
    """
    Removes shared job from database.

    :param job_id: job to be removed
    """
    try:
        job = db.query(models.Job).filter_by(id=job_id).first()
        
        for d in job.data:
            db.delete(d)
        
        db.delete(job)

        db.commit()

    except Exception as e:
        print(e)


def sync_job(db: Session, new_job: schemas.Job, member_id: str):
    """
    Called when user has made changes to job data.

    :param member_id: user's Memberstack ID
    :param job_id: job that the changes have been made for
    :param job_name: job name
    :param data: list of dicts containing prompt, completion pairs
    """
    
    try:
        job = db.query(models.Job).filter_by(id=new_job.id).first()
        #delete existing data belonging to job
        for data in [d for d in job.data if d.feedback=="user-upload"]:
            db.delete(data)

        #update user record
        if job.name != new_job.name:
            job.name = new_job.name

        word_count = 0
        for data in new_job.data:
            prompt = data.prompt
            completion = data.completion
            db.add(models.Data(prompt=prompt, completion=completion, feedback="user-upload", job_id=job.id))
            word_count += len(completion.split())

        job.word_count = word_count

    except Exception as e:
        print(e)
    
    db.commit()
    db.refresh(job)
    return job

def store_task(db: Session, new_task: schemas.Task, member_id: str):
    """
    :param member_id:
    :param category:
    :param prompt:
    :param completion:
    :param score:
    :param job_id:
    """
    user = db.query(models.User).filter_by(id=member_id).first()
    category = new_task.category
    prompt = new_task.prompt
    completion = new_task.completion
    score = new_task.score
    job_id = new_task.job_id

    task = models.Task(prompt=prompt, completion=completion, category=category, score=score, job_id=job_id, user_id=member_id)
    db.add(task)

    if category in ["task", "question"]:
        if "sources" in new_task.dict():
            db.flush() #flush session to obtain task id
            for source in new_task.sources:
                db.add(models.Source(url=source.url, display=source.display, title=source.title, preview=source.preview, task_id=task.id))

    #update user word count
    user.monthly_words += len(completion.split())
    db.commit()
    db.refresh(task)
    return task

def remove_task(db: Session, completion: str, member_id: str):
    """
    Remove a task from DB based on completion
    :param member_id:
    :param completion:
    """
    try:
        task = db.query(models.Task).filter(models.Task.user_id==member_id, models.Task.completion==completion).first()
        if task:
            db.delete(task)
            db.commit() 

    except Exception as e:
        print(e) 

def store_feedback(db: Session, completion: str, feedback: str, member_id: str):
    """
    Set task feedback and update user data.

    :param member_id: user's Memberstack ID
    :param feedback: 'positive' or 'negative'
    :param completion: identify task by completion
    """
    try:
        task = db.query(models.Task).filter(models.Task.user_id==member_id, models.Task.completion==completion).first()
        if task:
            #add feedback to task record
            task.feedback = feedback
            if feedback in ["positive", "negative"]:
                #positive or negative feedback is user to improve model by adding a completion to the Data table under the corresponding Job
                #only if the task related to a specific job and not a general task
                job_id = task.job_id #job for which task was generated
                
                if job_id is not None and isinstance(job_id, int):
                    if job_id>0:
                        #create new data record in DB
                        prompt = task.prompt
                        db.add(models.Data(prompt=prompt, completion=completion, feedback=feedback, job_id=job_id))

            db.commit()
            db.refresh(task)  
            return task
    except Exception as e:
        print(e)

def share_job(db: Session, job: schemas.Job, member_id: str):
    """
    Creates dummy user and job for others to use.
    """
    #create a dummy user to store job data
    user = db.query(models.User).get(member_id)
    cloned_job = db.query(models.Job).get(job.id) #get job to be cloned

    #create unique id
    u = uuid.uuid4()

    dummy_user = models.User(id=u.hex, name=user.name, monthly_words=0, about=user.about, description=user.description)
    db.add(dummy_user)
    
    dummy_job = models.Job(name=cloned_job.name, word_count=0, user_id=dummy_user.id)
    db.add(dummy_job)

    db.flush()

    for d in job.data:
        db.add(models.Data(prompt=d.prompt, completion=d.completion, feedback="user-upload", job_id=dummy_job.id))

    db.commit()
    db.refresh(dummy_job)
    return dummy_job

def remove_shared_job(db: Session, job_id: str):
    try:
        dummy_job = db.query(models.Job).filter(models.Job.user_id == job_id).first()
        dummy_user = db.query(models.User).filter(models.User.id == dummy_job.user_id).first()

        for d in dummy_job.data:
            db.delete(d)

        db.delete(dummy_job)
        db.delete(dummy_user)

        db.commit()
    except Exception as e:
        print(e)

def update_user_words(db: Session, member_id: str, increment: int):
    """
    increment user monthly word by value
    :param member_id: user's Memberstack ID
    :param value: number of words to increment by
    """
    user = db.query(models.User).get(member_id)

    user.monthly_words += increment
    db.commit()
    db.refresh(user)
    return user

def update_user_description(db: Session, description: str, member_id: str):
    user = db.query(models.User).get(member_id)
    user.description = description
    db.commit()
    db.refresh(user)
    return user

def update_user_about(db: Session, about: str, member_id: str):
    user = db.query(models.User).get(member_id)
    user.about = about
    db.commit()
    db.refresh(user)
    return user

def sync_tasks(db: Session):
    """
    Called at end of each day to purge unnecessary tasks
    """
    print("Syncing tasks")
    for user in db.query(models.User).all():
        try:
            for category in list(set([str(d.category) for d in user.tasks])):
                tasks = [d for d in user.tasks if d.category==category]
                for task in tasks[5:]:
                    if task.feedback is None:
                        #purge task
                        if category in["task", "question"]:
                            #purge sources first
                            for source in task.sources:
                                db.delete(source)
                        
                    db.delete(task)
            
        except Exception as e:
            print(f"Failed syncing tasks for {user.name}", e)

    db.commit()


def reset_words(db: Session):
    """
    Called at start of new month to reset user word counts.
    """

    for user in db.query(models.User).all():
        try:
            user.monthly_words = 0

        except Exception as e:
            print("Error reseting words:", e)

    db.commit()

