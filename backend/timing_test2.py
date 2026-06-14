"""
SSE 타이밍 테스트 — auth 없이 기존 order SSE 구독 + daily job 내부 트리거
"""
import asyncio, time, json, httpx

ORDER_ID = "f4a03134-217d-47a4-9471-ec7727ddf334"
BASE = "http://localhost:8000"

async def listen_sse(t0: float):
    """SSE 이벤트를 수신하며 타이밍 출력"""
    prev = t0
    async with httpx.AsyncClient(timeout=300) as client:
        async with client.stream("GET", f"{BASE}/api/v1/orders/{ORDER_ID}/progress") as resp:
            async for line in resp.aiter_lines():
                if not line.startswith("data:"):
                    continue
                data = json.loads(line[5:].strip())
                stage = data.get("stage", "")
                if stage == "ping":
                    continue
                now = time.time()
                elapsed = now - t0
                delta = now - prev
                prev = now
                extra = ""
                if data.get("sponsor_company"):
                    extra += f"  sponsor={data['sponsor_company']}"
                if stage == "done":
                    hl = str(data.get("headline", ""))[:30]
                    extra += f"  headline={hl}"
                print(f"  [{stage:<20}]  누적={elapsed:5.1f}s  이전대비=+{delta:5.1f}s{extra}")
                if stage in ("done", "failed"):
                    print(f"\n>>> 총 소요: {elapsed:.1f}s")
                    break

async def trigger_daily_job():
    """daily_publication_job을 내부에서 직접 실행"""
    from app.tasks.daily_publish import daily_publication_job
    await daily_publication_job()

async def main():
    t0 = time.time()
    print(f"order_id: {ORDER_ID}")
    print(f"SSE 구독 시작 + daily job 트리거 동시 실행\n")

    # SSE 리스너와 daily job을 동시 실행
    sse_task = asyncio.create_task(listen_sse(t0))

    # 0.5초 후 daily job 트리거 (SSE 구독이 먼저 준비되도록)
    await asyncio.sleep(0.5)
    print(f"[+{time.time()-t0:.1f}s] daily_publication_job 트리거")
    job_task = asyncio.create_task(trigger_daily_job())

    await asyncio.gather(sse_task, job_task, return_exceptions=True)

asyncio.run(main())
