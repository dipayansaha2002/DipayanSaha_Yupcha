from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Tweet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    topic: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    posted: bool = False