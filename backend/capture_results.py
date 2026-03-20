import asyncio
import json
from app.agents.editor_in_chief.agent import EditorInChief
from datetime import datetime

async def capture_output():
    orchestrator = EditorInChief()
    mock_order = {
        "id": "test-order-id",
        "protagonist_name": "홍길동",
        "dream_description": "세계 최고의 AI 개발자가 되어 실리콘밸리에서 활약하는 꿈",
        "target_role": "AI Chief Architect",
        "target_company": "Google",
        "duration_days": 1,
        "future_year": 2030,
        "timezone": "Asia/Seoul"
    }
    
    newspaper = await orchestrator.generate_single_newspaper(
        order=mock_order,
        episode=1,
        scheduled_date=datetime.now(),
        sponsor_company="SAMSUNG"
    )
    
    # Convert date to string for JSON serialization
    newspaper["future_date"] = str(newspaper["future_date"])
    
    with open("agent_results.json", "w", encoding="utf-8") as f:
        json.dump(newspaper, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    asyncio.run(capture_output())
