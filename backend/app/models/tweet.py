from typing import Dict
from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSON
from datetime import datetime
from typing import Optional

class Tweet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
   # content: Dict = Field(sa_column=Column(JSON)) 
    content : str
    topic: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    posted: bool = False

# This code defines a Tweet model using SQ       LModel with a JSON field for content.

# Old code
# from sqlmodel import SQLModel, Field
# from typing import Optional
# from datetime import datetime

# class Tweet(SQLModel, table=True):
#     id: Optional[int] = Field(default=None, primary_key=True)
#     # content: str
#     content: Dict = Field(sa_column=Column(JSON)) 
#     topic: str
#     created_at: datetime = Field(default_factory=datetime.utcnow)
#     posted: bool = False