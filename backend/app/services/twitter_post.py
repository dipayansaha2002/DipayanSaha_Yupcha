import requests
from fastapi import HTTPException
from sqlmodel import select, desc
from app.models.tweet import Tweet
from app.services.tweet_gen import generate_tweet
from app.core.config import settings

def generate_tweet_service(topic, db):
    tweet = generate_tweet(topic)
    tweet_entry = Tweet(content=tweet, topic=topic)
    db.add(tweet_entry)
    db.commit()
    db.refresh(tweet_entry)
    return {"tweet": tweet, "id": tweet_entry.id}

def post_tweet(id, db):
    tweet = db.get(Tweet, id)
    if not tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")

    if tweet.posted:
        return {"status": "already posted", "tweet": tweet.content}

    headers = {
        "api-key": settings.TWITTER_API_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "username": "dipayan",
        "text": tweet.content
    }
    response = requests.post(settings.TWITTER_URL, headers=headers, json=body)
    if response.status_code == 200:
        tweet.posted = True
        db.commit()
        return {"status": "posted", "tweet": tweet.content}
    raise HTTPException(status_code=response.status_code, detail=response.text)

def get_all_tweets(db):
    return db.exec(select(Tweet).order_by(desc(Tweet.id))).all()

def update_tweet(id, topic, content, db):
    tweet = db.exec(select(Tweet).where(Tweet.id == id)).first()
    if not tweet:
        raise HTTPException(status_code=404, detail="Tweet not found")
    if tweet.posted:
        raise HTTPException(status_code=400, detail="Tweet already posted and cannot be edited")
    if topic:
        tweet.topic = topic
    if content:
        tweet.content = content
    db.add(tweet)
    db.commit()
    db.refresh(tweet)
    return tweet