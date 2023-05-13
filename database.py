import os

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

#DATABASE_URL = "postgresql://virtuallyme_db_user:V3qyWKGBmuwpH0To2o5eVkqa1X4nqMhR@dpg-cfskiiarrk00vm1bp320-a.singapore-postgres.render.com/virtuallyme_db" #external
DATABASE_URL = os.getenv("DATABASE_URL") #internal

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()
