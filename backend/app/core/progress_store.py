"""
인메모리 SSE progress store.
신문 생성 진행 상황을 실시간으로 구독자에게 전달합니다.
"""
import asyncio
from typing import Dict, List
import structlog

logger = structlog.get_logger()

_store: Dict[str, List[dict]] = {}
_listeners: Dict[str, List[asyncio.Queue]] = {}


async def emit(order_id: str, stage: str, message: str, **kwargs):
    """이벤트 발행 - 모든 구독자에게 전달"""
    event = {"stage": stage, "message": message, **kwargs}
    if order_id not in _store:
        _store[order_id] = []
    _store[order_id].append(event)
    listeners = _listeners.get(order_id, [])
    for q in listeners:
        await q.put(event)
    logger.info("progress_emit", order_id=order_id, stage=stage)


async def subscribe(order_id: str) -> asyncio.Queue:
    """구독 등록 - 기존 이벤트도 포함한 Queue 반환"""
    q: asyncio.Queue = asyncio.Queue()
    # 기존에 쌓인 이벤트 먼저 전달
    for event in _store.get(order_id, []):
        await q.put(event)
    if order_id not in _listeners:
        _listeners[order_id] = []
    _listeners[order_id].append(q)
    return q


def unsubscribe(order_id: str, q: asyncio.Queue):
    """구독 해제"""
    lst = _listeners.get(order_id, [])
    if q in lst:
        lst.remove(q)


def cleanup(order_id: str):
    """이벤트 및 구독자 목록 삭제"""
    _store.pop(order_id, None)
    _listeners.pop(order_id, None)
