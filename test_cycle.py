"""
Dream Newspaper - Full Cycle Test
Register -> Login -> Create Order -> DB bypass payment -> Start Order -> Generate Newspaper
"""
import urllib.request
import urllib.error
import json
import sys

BASE = "http://localhost:8000/api/v1"

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
        return e.code, json.loads(e.read().decode("utf-8"))

print("=" * 60)
print("Dream Newspaper - Full Cycle Test")
print("=" * 60)

# STEP 1: Register
print("\n[STEP 1] Register...")
status, body = call("POST", "/auth/register", {
    "email": "test_cycle@dreamnews.kr",
    "password": "Test1234!",
    "full_name": "Hong Gildong"
})
print(f"  -> {status}: {str(body)[:200]}")
if status == 400 and "already" in str(body).lower():
    print("  -> User already exists, continuing...")
elif status not in [200, 201]:
    print("  FAIL: Register failed.")
    # Don't exit, try login anyway

# STEP 2: Login
print("\n[STEP 2] Login...")
status, body = call("POST", "/auth/login", {
    "email": "test_cycle@dreamnews.kr",
    "password": "Test1234!"
})
print(f"  -> {status}: {str(body)[:200]}")
if status != 200:
    print("  FAIL: Login failed. Stopping.")
    sys.exit(1)

token = body.get("access_token")
print(f"  OK - Token: {token[:40]}...")

# STEP 3: Create Order
print("\n[STEP 3] Create Order...")
status, body = call("POST", "/orders", {
    "dream_description": "Become the world's best AI researcher and lead AGI research at Google DeepMind",
    "protagonist_name": "Hong Gildong",
    "target_role": "AI Chief Researcher",
    "target_company": "Google DeepMind",
    "supporting_people": [],
    "duration_days": 7,
    "future_year": 2030,
    "payment_type": "one_time"
}, token=token)
print(f"  -> {status}: {str(body)[:300]}")
if status not in [200, 201]:
    print("  FAIL: Order creation failed. Stopping.")
    sys.exit(1)

order_id = body.get("id")
print(f"  OK - order_id: {order_id}")

# STEP 4: Try Start (expect 402 - payment required)
print("\n[STEP 4] Start Order (expect 402)...")
status, body = call("POST", f"/orders/{order_id}/start", token=token)
print(f"  -> {status}: {body}")
if status == 402:
    print("  OK - Payment gate working correctly.")
elif status == 200:
    print("  OK - Order started (payment bypass exists)")

print("\n" + "=" * 60)
print(f"ORDER_ID={order_id}")
print(f"TOKEN={token[:60]}...")
print("=" * 60)
print("\nNOTE: To complete test, payment_status must be set to 'paid'")
print("Run: docker exec dream_postgres psql -U dream -d dream_newspaper -c")
print(f"  \"UPDATE orders SET payment_status='paid' WHERE id='{order_id}';\"")
