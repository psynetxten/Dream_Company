from app.config import settings
from google import genai

try:
    client = genai.Client(api_key=settings.GOOGLE_API_KEY)
    for m in client.models.list():
        print(f"{m.name} - {m.display_name}")
except Exception as e:
    print(f"Error listing models: {e}")
