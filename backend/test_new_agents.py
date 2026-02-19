import asyncio
from app.agents.orchestrator.orchestrator_agent import OrchestratorAgent
from datetime import datetime

async def test_agent_integration():
    print("Testing Agent Integration (마케팅 팀장 & 콘텐츠 디렉터)...")
    orchestrator = OrchestratorAgent()
    
    mock_order = {
        "id": "test-order-id",
        "protagonist_name": "홍길동",
        "dream_description": "세계 최고의 AI 개발자가 되어 실리콘밸리에서 활약하는 꿈",
        "target_role": "AI Chief Architect",
        "target_company": "Google",
        "duration_days": 7,
        "future_year": 2030,
        "timezone": "Asia/Seoul"
    }
    
    # Generate a single newspaper
    print("Generating newspaper with marketing and visual assets...")
    newspaper = await orchestrator.generate_single_newspaper(
        order=mock_order,
        episode=1,
        scheduled_date=datetime.now(),
        sponsor_company="SAMSUNG"
    )
    
    print("\n[마케팅 팀장 보고서 - SNS Copy]")
    print(newspaper.get("sns_copy"))
    
    print("\n[콘텐츠 디렉터 보고서 - Visual Prompt]")
    print(newspaper.get("visual_prompt"))
    
    if newspaper.get("sns_copy") and newspaper.get("visual_prompt"):
        print("\nSUCCESS: All agents report for duty!")
    else:
        print("\nFAILURE: Some agents failed to respond.")

if __name__ == "__main__":
    asyncio.run(test_agent_integration())
