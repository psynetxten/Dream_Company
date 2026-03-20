"""
Dream Newspaper - Full Cycle Test Part 2
Start Order -> Generate Newspaper -> Check Result
"""
import urllib.request
import urllib.error
import json
import sys

BASE = "http://localhost:8000/api/v1"
ORDER_ID = "a64eb5ec-3904-43aa-bc25-1112c68280cb"

def call(method, path, data=None, token=None):
    url = BASE + path
    body = json.dumps(data, ensure_ascii=False).encode("utf-8") if data else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except:
            return e.code, {"raw": raw[:300]}

# Login first
print("[Login]")
status, body = call("POST", "/auth/login", {
    "email": "test_cycle@dreamnews.kr",
    "password": "Test1234!"
})
if status != 200:
    print("Login failed:", body)
    sys.exit(1)
token = body["access_token"]
print(f"  OK - Token acquired")

# STEP 5: Start Order (now payment is paid)
print(f"\n[STEP 5] Start Order (payment=paid)...")
status, body = call("POST", f"/orders/{ORDER_ID}/start", token=token)
print(f"  -> {status}: {str(body)[:300]}")
if status == 200:
    print("  OK - Order started!")
elif status == 400 and "active" in str(body):
    print("  -> Order already active, continuing...")
else:
    print("  FAIL:", body)
    sys.exit(1)

# STEP 6: Trigger newspaper generation directly (simulating scheduler)
print(f"\n[STEP 6] Direct newspaper generation test...")
print("  Loading orchestrator via test script...")

# Use the existing capture_results.py style test
import subprocess
result = subprocess.run(
    ["python", "test_new_agents.py"],
    cwd="C:\\Users\\default.DESKTOP-BKS2NBV\\OneDrive\\Desktop\\꿈신문사 CTO\\dream-newspaper\\backend",
    capture_output=True,
    text=True,
    timeout=120,
    env={**__import__('os').environ, 'PYTHONPATH': 'C:\\Users\\default.DESKTOP-BKS2NBV\\OneDrive\\Desktop\\꿈신문사 CTO\\dream-newspaper\\backend'}
)
print("STDOUT:", result.stdout[:1000] if result.stdout else "(none)")
if result.stderr:
    print("STDERR:", result.stderr[:500])
print("Return code:", result.returncode)
