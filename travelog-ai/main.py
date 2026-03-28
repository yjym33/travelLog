import os
import base64
import requests
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="Travelog AI Service")

# Initialize OpenAI Client
# Set your OPENAI_API_KEY in travelog-ai/.env
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ImageAnalysisRequest(BaseModel):
    image_url: str

class DescriptionRequest(BaseModel):
    image_urls: List[str]

class DiaryRequest(BaseModel):
    image_urls: List[str]
    place_name: str

def encode_image_from_url(url: str):
    """
    Fetch an image from a URL and encode it to base64.
    If the URL is a local path (starts with http://localhost:8080/uploads), 
    we need to ensure the AI server can reach it.
    """
    try:
        response = requests.get(url)
        response.raise_for_status()
        return base64.b64encode(response.content).decode('utf-8')
    except Exception as e:
        print(f"Error encoding image: {e}")
        return None

@app.get("/")
async def root():
    return {"status": "ok", "message": "Travelog AI FastAPI Server is running"}

@app.post("/analyze-image")
async def analyze_image(request: ImageAnalysisRequest):
    """
    Analyze an image and generate relevant hashtags.
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Analyze this travel photo and return up to 5 relevant hashtags in Korean, separated by commas. Focus on the mood, location type, and activities. Example: #제주도, #바다, #힐링, #카페, #여름"},
                        {
                            "type": "image_url",
                            "image_url": {"url": request.image_url},
                        },
                    ],
                }
            ],
            max_tokens=100,
        )
        
        content = response.choices[0].message.content
        # Extract hashtags
        tags = [tag.strip() for tag in content.split(",") if tag.strip().startswith("#")]
        return {"tags": tags}
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return {"tags": ["#여행", "#추억", "#기록"]}

@app.post("/generate-description")
async def generate_description(request: DescriptionRequest):
    """
    Generate a poetic one-line description for travel photos.
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    if not request.image_urls:
        return {"description": "아름다운 여행의 순간입니다."}

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Based on these travel photos, write one poetic and emotional sentence in Korean describing the scene. Keep it under 50 characters."},
                        *[{"type": "image_url", "image_url": {"url": url}} for url in request.image_urls[:3]],
                    ],
                }
            ],
            max_tokens=150,
        )
        
        description = response.choices[0].message.content.strip()
        return {"description": description}
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return {"description": "아름다운 여행의 기억이 담긴 소중한 사진입니다."}

@app.post("/generate-diary")
async def generate_diary(request: DiaryRequest):
    """
    Generate a full travel diary entry based on photos and place name.
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    try:
        prompt = f"Write a warm and reflective travel diary entry for a visit to '{request.place_name}' in Korean. " \
                 f"The diary should be about 3-4 paragraphs long. Use a personal, 'I' perspective. " \
                 f"Describe the atmosphere and emotions suggested by the photos provided."

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        *[{"type": "image_url", "image_url": {"url": url}} for url in request.image_urls[:3]],
                    ],
                }
            ],
            max_tokens=1000,
        )
        
        diary = response.choices[0].message.content.strip()
        return {"diary": diary}
    except Exception as e:
        print(f"OpenAI Error: {e}")
        return {"diary": f"{request.place_name}에서의 소중한 기록입니다. 아직 AI가 일기를 작성하는 중이에요."}

class RecommendationRequest(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    user_tags: List[str] = []
    is_global: bool = False

@app.post("/recommend-destinations")
async def recommend_destinations(request: RecommendationRequest):
    """
    Recommend travel destinations. 
    If is_global is True, recommends from anywhere in the world.
    Otherwise, recommends near the given lat/lng.
    """
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    try:
        tags_str = ", ".join(request.user_tags) if request.user_tags else "일반적인 여행 취향"
        
        if request.is_global:
            location_context = "anywhere in the world (Global Discovery mode)"
        else:
            location_context = f"near latitude {request.lat}, longitude {request.lng}"

        prompt = f"Recommend 3 specific travel destinations {location_context}. " \
                 f"Focus on the user's preferred vibes: {tags_str}. " \
                 f"For each destination, provide: name, approximate latitude, approximate longitude, " \
                 f"a short reason why (in Korean), and 2-3 tags (in Korean starting with #). " \
                 f"Return the response ONLY as a JSON list of objects: " \
                 f"[{{'name': '...', 'lat': ..., 'lng': ..., 'reason': '...', 'tags': ['#...', '#...']}}]"

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a travel recommendation expert. Return results in JSON format."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" if "gpt-4-turbo" in "gpt-4o-mini" else "text" }, # gpt-4o-mini supports json_object
            max_tokens=800,
        )
        
        import json
        content = response.choices[0].message.content.strip()
        
        # Clean markdown code blocks if present
        if content.startswith("```"):
            # Remove opening block
            content = content.split("\n", 1)[-1] if "\n" in content else content[3:]
            # Remove closing block
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

        # Ensure it's valid JSON list
        try:
            data = json.loads(content)
            # If the model wrapped it in a key like {"recommendations": [...]}
            if isinstance(data, dict) and "recommendations" in data:
                return data["recommendations"]
            return data
        except Exception as e:
            # Fallback if AI didn't return perfect JSON
            print(f"AI returned non-json or error parsing: {e}")
            print(f"Content was: {content}")
            return []

    except Exception as e:
        print(f"OpenAI Error: {e}")
        return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
