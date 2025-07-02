from fastapi import APIRouter, Depends, HTTPException, Query
from app.schemas.tweet import PromptInput, TweetUpdate
from app.services.twitter_post import (
    generate_tweet_service,
    post_tweet,
    update_tweet,
    get_all_tweets
)
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

@router.get("/tweets")
def get_paginated_tweets(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    posted: bool = None,
    session: Session = Depends(get_session)
):
    """
    Paginated list of tweets: ?limit=10&offset=0
    """
    all_tweets = get_all_tweets(session)

    #Paginate manually (if get_all_tweets doesn't support it natively)
    paginated = all_tweets[offset:offset + limit]
    
    return {
        "tweets": paginated,
        "limit": limit,
        "offset": offset,
        "total": len(all_tweets)
    }

@router.get("/health")
def health_check():
    return {"status": "ok"}
