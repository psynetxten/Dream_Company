
import requests

url = "https://dream-newspaper-phi.vercel.app/register"
print(f"Checking headers for {url}...")

try:
    response = requests.get(url, allow_redirects=False)
    print(f"Status: {response.status_code}")
    print("\nHeaders:")
    for k, v in response.headers.items():
        print(f"{k}: {v}")
except Exception as e:
    print(f"Error: {e}")
