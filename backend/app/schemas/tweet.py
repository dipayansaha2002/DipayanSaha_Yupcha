from pydantic import BaseModel
from typing import Optional
from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSON
from typing import Dict

class PromptInput(BaseModel):
    topic: str

class TweetContent(BaseModel):
    # content: str
    content: Dict = Field(sa_column=Column(JSON))

class TweetUpdate(BaseModel):
    topic: Optional[str] = None
    content: Optional[str] = None