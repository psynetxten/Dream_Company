import asyncio, time, json, httpx

async def test():
    base = "http://localhost:8000"
    t0 = time.time()

    r = await httpx.AsyncClient().post(f"{base}/api/v1/auth/login",
        json={"email": "timing_test@test.com", "password": "test1234"})
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"[+{time.time()-t0:.1f}s] 로그인 완료")

    r = await httpx.AsyncClient().post(f"{base}/api/v1/orders", headers=headers, json={
        "dream_description": "AI 연구소장이 되어 세계적인 논문을 발표하고 싶습니다",
        "protagonist_name": "테스트",
        "target_role": "AI 연구소장",
        "target_company": "삼성전자",
        "duration_days": 7,
        "future_year": 2030,
        "payment_type": "free"
    })
    order_id = r.json()["id"]
    print(f"[+{time.time()-t0:.1f}s] 의뢰 생성: {order_id}")

    await httpx.AsyncClient().post(f"{base}/api/v1/orders/{order_id}/start", headers=headers)
    start_ts = time.time()
    print(f"[+{start_ts-t0:.1f}s] start 호출 완료 — 이 시점부터 타이머")

    prev = start_ts
    async with httpx.AsyncClient(timeout=300) as client:
        async with client.stream("GET", f"{base}/api/v1/orders/{order_id}/progress") as resp:
            async for line in resp.aiter_lines():
                if not line.startswith("data:"):
                    continue
                data = json.loads(line[5:].strip())
                stage = data.get("stage", "")
                if stage == "ping":
                    continue
                now = time.time()
                elapsed = now - start_ts
                delta = now - prev
                prev = now
                extra = ""
                sponsor = data.get("sponsor_company")
                if sponsor:
                    extra += f" | 스폰서={sponsor}"
                if stage == "done":
                    hl = data.get("headline", "")[:30]
                    extra += f" | 헤드라인={hl}"
                print(f"  stage={stage:<20} 누적={elapsed:5.1f}s  이전단계후={delta:5.1f}s{extra}")
                if stage == "done":
                    print(f"\n총 소요: {elapsed:.1f}s")
                    break

asyncio.run(test())
