
import requests
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
anon_key = os.getenv("SUPABASE_ANON_KEY")

print(f"Testing Auth API at {url}")
print(f"Using Anon Key: {anon_key}")

# 1. Test SignUp
signup_url = f"{url}/auth/v1/signup"
headers = {
    "apikey": anon_key,
    "Content-Type": "application/json"
}
payload = {
    "email": "cto_test_python@example.com",
    "password": "Password123!"
}

print("\n--- Testing SignUp ---")
try:
    response = requests.post(signup_url, headers=headers, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# 2. Test Kakao Authorize
kakao_url = f"{url}/auth/v1/authorize?provider=kakao"
print("\n--- Testing Kakao Authorize ---")
try:
    response = requests.get(kakao_url, headers=headers, allow_redirects=False)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {response.headers}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
