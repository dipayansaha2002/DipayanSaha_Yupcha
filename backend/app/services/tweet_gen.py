# tweet_gen.py - Updated version
from app.core.config import settings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
import os
import re

os.environ["GOOGLE_API_KEY"] = settings.GEMINI_API_KEY

llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.7)

prompt = PromptTemplate(
    input_variables=["topic"],
    template="""Write a short, interesting & factual tweet about {topic} in under 250 characters. 
    Include relevant hashtags at the end. 
    Format: Tweet content followed by hashtags separated by spaces.
    Example: "This is my tweet content #hashtag1 #hashtag2 #hashtag3"
    """
)

tweet_chain = prompt | llm

def generate_tweet(topic: str) -> dict:
    """
    Generate a tweet and return it in the format expected by the frontend
    """
    try:
        # Generate the tweet
        response = tweet_chain.invoke({"topic": topic}).content
        
        # Extract hashtags using regex
        hashtags = re.findall(r'#(\w+)', response)
        
        # Remove hashtags from the main content to separate them
        tweet_content = re.sub(r'#\w+', '', response).strip()
        
        # Clean up extra spaces
        tweet_content = ' '.join(tweet_content.split())
        
        return {
            "content": tweet_content,
            "hashtags": hashtags,
            "full_tweet": response  # Keep the original for reference
        }
    except Exception as e:
        return {
            "content": f"Error generating tweet: {str(e)}",
            "hashtags": [],
            "full_tweet": ""
        }

# Alternative function if you want to keep hashtags in the main content
def generate_tweet_alternative(topic: str) -> dict:
    """
    Alternative version that keeps hashtags in the main tweet content
    """
    try:
        response = tweet_chain.invoke({"topic": topic}).content
        hashtags = re.findall(r'#(\w+)', response)
        
        return {
            "tweet": response,  # Full tweet with hashtags
            "hashtags": hashtags,
            "content": response  # Fallback for frontend compatibility
        }
    except Exception as e:
        return {
            "tweet": f"Error generating tweet: {str(e)}",
            "hashtags": [],
            "content": f"Error generating tweet: {str(e)}"
        }