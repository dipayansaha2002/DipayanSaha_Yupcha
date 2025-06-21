from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.db.session import init_db
from app.core.config import settings

app = FastAPI(title="Twitter Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_start():
    init_db()

@app.get("/")
def read_root():
    return {"message": "Welcome to Twitter Clone API"}

app.include_router(router)
