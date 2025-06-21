from pydantic import BaseModel
from typing import Optional

class PromptInput(BaseModel):
    topic: str

class TweetContent(BaseModel):
    content: str

class TweetUpdate(BaseModel):
    topic: Optional[str] = None
    content: Optional[str] = None