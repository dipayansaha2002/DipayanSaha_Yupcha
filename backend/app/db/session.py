from sqlmodel import create_engine, Session, SQLModel
from app.core.config import settings
import traceback #Import traceback for error handling(Code Review Suggestion)

engine = create_engine(settings.DB_URL)

def get_session():
    try:
        with Session(engine) as session:
            yield session
#Suggestion from Code Review: Use traceback to print the error stack trace
    except Exception:
        traceback.print_exc()
    return None

def init_db():
    SQLModel.metadata.create_all(engine)