from app.config import settings
import google.generativeai as genai

if hasattr(settings, "GOOGLE_API_KEY") and settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)

try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"{m.name} - {m.display_name}")
except Exception as e:
    print(f"Error listing models: {e}")
