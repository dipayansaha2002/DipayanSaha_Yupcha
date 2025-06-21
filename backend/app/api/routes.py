from fastapi import APIRouter, Depends, HTTPException
from app.schemas.tweet import PromptInput, TweetUpdate
from app.services.twitter_post import generate_tweet_service, post_tweet, update_tweet, get_all_tweets
from app.db.session import get_session
from sqlmodel import Session

router = APIRouter(prefix="/tweet", tags=["Tweets"])

@router.post("/generate")
def generate(data: PromptInput, session: Session = Depends(get_session)):
    return generate_tweet_service(data.topic, session)

@router.post("/post/{tweet_id}")
def post(tweet_id: int, session: Session = Depends(get_session)):
    return post_tweet(tweet_id, session)

@router.put("/edit/{tweet_id}")
def edit(tweet_id: int, tweet: TweetUpdate, session: Session = Depends(get_session)):
    return {"message": "Updated", "tweet": update_tweet(tweet_id, tweet.topic, tweet.content, session)}

@router.get("/all")
def list_all(session: Session = Depends(get_session)):
    return get_all_tweets(session)

@router.get("/health")
def health_check():
    return {"status": "ok"}