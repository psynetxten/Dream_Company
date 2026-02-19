from app.config import settings
import google.generativeai as genai
import numpy as np

if hasattr(settings, "GOOGLE_API_KEY") and settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)

try:
    result = genai.embed_content(
        model="models/gemini-embedding-001",
        content="Hello world",
        task_type="retrieval_document"
    )
    embedding = result['embedding']
    print(f"Model: gemini-embedding-001, Dimension: {len(embedding)}")
except Exception as e:
    print(f"Error checking gemini-embedding-001: {e}")

try:
    result = genai.embed_content(
        model="models/embedding-001",
        content="Hello world",
        task_type="retrieval_document"
    )
    embedding = result['embedding']
    print(f"Model: embedding-001, Dimension: {len(embedding)}")
except Exception as e:
    print(f"Error checking embedding-001: {e}")
