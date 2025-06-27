from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from app.services.tweet_gen import generate_tweet
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Social Media Agent API", version="1.0.0")

# Mount static files (for favicon and others)
app.mount(
    "/static",
    StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")),
    name="static"
)

# CORS Configuration - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173, settings.FRONTEND_URL"],  # Replace for production
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Request model
class TweetRequest(BaseModel):
    prompt: str

# Response model
class TweetResponse(BaseModel):
    content: str
    hashtags: list[str]
    full_tweet: str = None

@app.get("/")
async def root():
    return {"message": "AI Social Media Agent API is running!"}

@app.head("/", include_in_schema=False)
async def root_head():
    return JSONResponse(content=None, status_code=200)

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    path = os.path.join(os.path.dirname(__file__), "static", "favicon.ico")
    if os.path.exists(path):
        return FileResponse(path)
    raise HTTPException(status_code=404, detail="Favicon not found")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI Social Media Agent"}

@app.post("/generate-tweet", response_model=TweetResponse)
async def generate_tweet_endpoint(request: TweetRequest):
    """
    Generate a tweet based on the provided prompt
    """
    prompt = request.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    try:
        logger.info(f"Received tweet generation request: {request.prompt}")
        result = generate_tweet(request.prompt)
        logger.info(f"Generated tweet: {result}")
        return result
    except Exception as e:
        logger.error(f"Error generating tweet: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating tweet: {str(e)}")

@app.post("/tweet")
async def create_tweet(request: TweetRequest):
    """
    Alternative endpoint for tweet generation
    """
    return await generate_tweet_endpoint(request)

@app.post("/test-tweet")
async def test_tweet_generation():
    """
    Test endpoint to verify tweet generation is working
    """
    test_prompt = "artificial intelligence and machine learning"
    result = generate_tweet(test_prompt)
    return {
        "test_prompt": test_prompt,
        "result": result
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from app.api.routes import router
# from app.db.session import init_db
# from app.core.config import settings

# app = FastAPI(title="Twitter Clone API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", settings.FRONTEND_URL],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.on_event("startup")
# def on_start():
#     init_db()

# @app.get("/")
# def read_root():
#     return {"message": "Welcome to Twitter Clone API"}

# app.include_router(router)

# # main.py or your FastAPI app file
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from app.services.tweet_gen import generate_tweet
# import logging

# # Set up logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = FastAPI(title="AI Social Media Agent API", version="1.0.0")

# # CORS Configuration - Allow all origins for development
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173, settings.FRONTEND_URL"],  # In production, replace with your frontend domain
#     allow_credentials=True,
#     allow_methods=["GET", "POST", "OPTIONS"],
#     allow_headers=["*"],
# )

# # Request model
# class TweetRequest(BaseModel):
#     prompt: str

# # Response model (optional, for documentation)
# class TweetResponse(BaseModel):
#     content: str
#     hashtags: list[str]
#     full_tweet: str = None

# @app.get("/")
# async def root():
#     return {"message": "AI Social Media Agent API is running!"}

# @app.get("/health")
# async def health_check():
#     return {"status": "healthy", "service": "AI Social Media Agent"}

# @app.post("/generate-tweet", response_model=TweetResponse)
# async def generate_tweet_endpoint(request: TweetRequest):
#     """
#     Generate a tweet based on the provided prompt
#     """
#     try:
#         logger.info(f"Received tweet generation request: {request.prompt}")
        
#         # Generate the tweet
#         result = generate_tweet(request.prompt)
        
#         logger.info(f"Generated tweet: {result}")
        
#         return result
        
#     except Exception as e:
#         logger.error(f"Error generating tweet: {str(e)}")
#         raise HTTPException(
#             status_code=500, 
#             detail=f"Error generating tweet: {str(e)}"
#         )

# # Alternative endpoint if you prefer different naming
# @app.post("/tweet")
# async def create_tweet(request: TweetRequest):
#     """
#     Alternative endpoint for tweet generation
#     """
#     return await generate_tweet_endpoint(request)

# # Test endpoint for debugging
# @app.post("/test-tweet")
# async def test_tweet_generation():
#     """
#     Test endpoint to verify tweet generation is working
#     """
#     test_prompt = "artificial intelligence and machine learning"
#     result = generate_tweet(test_prompt)
#     return {
#         "test_prompt": test_prompt,
#         "result": result
#     }
# @app.head("/", include_in_schema=False)
# async def root_head():
#     return {"content=None", "status_code=200"}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)
