from app.config import settings
from google import genai
from google.genai import types
import numpy as np

client = genai.Client(api_key=settings.GOOGLE_API_KEY)

for model_name in ["models/gemini-embedding-001", "models/embedding-001"]:
    try:
        result = client.models.embed_content(
            model=model_name,
            contents="Hello world",
            config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
        )
        embedding = result.embeddings[0].values
        print(f"Model: {model_name}, Dimension: {len(embedding)}")
    except Exception as e:
        print(f"Error checking {model_name}: {e}")
