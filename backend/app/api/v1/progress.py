"""
SSE(Server-Sent Events) 진행 상황 스트리밍 엔드포인트.
신문 생성 중 실시간 진행 상황을 클라이언트에 전달합니다.
"""
import asyncio
import json
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from app.core.progress_store import subscribe, unsubscribe

router = APIRouter(prefix="/orders", tags=["progress"])


@router.get("/{order_id}/progress")
async def stream_progress(order_id: str, request: Request):
    """
    SSE 스트림: 신문 생성 진행 상황을 실시간으로 전달합니다.
    - 인증 불필요 (order_id로 접근 보호)
    - 30초마다 keepalive ping 전송
    - 'done' 이벤트 수신 시 스트림 종료
    """
    q = await subscribe(order_id)

    async def generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(q.get(), timeout=30.0)
                    yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                    if event.get("stage") == "done":
                        break
                except asyncio.TimeoutError:
                    yield 'data: {"stage":"ping"}\n\n'
        finally:
            unsubscribe(order_id, q)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/{order_id}/test-emit")
async def test_emit(order_id: str, stage: str = "starting", message: str = "테스트"):
    """개발용: 서버 프로세스 내부에서 SSE 이벤트 발행 테스트"""
    from app.core.progress_store import emit
    await emit(order_id, stage, message)
    return {"ok": True, "order_id": order_id, "stage": stage}
