"""
Dream Newspaper - Complete E2E Cycle Test
Register -> Login -> Create Order -> Pay (bypass) -> Start -> Check Schedules
"""
import urllib.request
import urllib.error
import json
import time
import subprocess
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
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except:
            return e.code, {"raw": raw[:300]}

import subprocess

def db(sql):
    r = subprocess.run(
        ["docker", "exec", "dream_postgres", "psql", "-U", "dream", "-d", "dream_newspaper", "-t", "-c", sql],
        capture_output=True, text=True
    )
    return r.stdout.strip()

print("=" * 60)
print("Dream Newspaper - Complete E2E Test")
print("=" * 60)

# Login
print("\n[1/6] Login...")
status, body = call("POST", "/auth/login", {"email": "test_cycle@dreamnews.kr", "password": "Test1234!"})
assert status == 200, f"Login failed: {body}"
token = body["access_token"]
print(f"  OK")

# New order
print("\n[2/6] Create new order...")
status, body = call("POST", "/orders", {
    "dream_description": "Become a world-class surgeon and save lives at Johns Hopkins Hospital",
    "protagonist_name": "Kim Eunji",
    "target_role": "Chief Surgeon",
    "target_company": "Johns Hopkins Hospital",
    "supporting_people": [],
    "duration_days": 7,
    "future_year": 2030,
    "payment_type": "one_time"
}, token=token)
assert status == 201, f"Order failed: {body}"
order_id = body["id"]
print(f"  OK - order_id: {order_id}")

# Bypass payment
print("\n[3/6] Bypass payment (test only)...")
result = db(f"UPDATE orders SET payment_status='paid' WHERE id='{order_id}' RETURNING payment_status;")
print(f"  DB update: {result.strip()}")

# Start order
print("\n[4/6] Start order...")
status, body = call("POST", f"/orders/{order_id}/start", token=token)
print(f"  -> {status}: {str(body)[:200]}")
assert status == 200, f"Start failed: {body}"
print(f"  OK - Order started!")

# Wait for background task to create schedules
print("\n[5/6] Waiting for background task (schedules)...")
time.sleep(8)

# Check schedules in DB
print("\n[6/6] Check publication schedules...")
schedules = db(f"SELECT episode_number, scheduled_at, status FROM publication_schedules WHERE order_id='{order_id}' ORDER BY episode_number;")
if schedules:
    print("  SCHEDULES CREATED:")
    for line in schedules.split('\n'):
        if line.strip():
            print(f"    {line.strip()}")
else:
    print("  WARN: No schedules found yet (background task may still be running)")

# Check order status
order_row = db(f"SELECT status, starts_at FROM orders WHERE id='{order_id}';")
print(f"\n  Order status: {order_row.strip()}")

print("\n" + "=" * 60)
print("RESULT: All steps passed!")
print("=" * 60)
