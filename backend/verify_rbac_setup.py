import asyncio
import uuid
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
from sqlalchemy import select
from app.database import engine, get_db
from app.models.user import User
from app.api.v1.auth import require_role
from fastapi import HTTPException

async def verify_rbac():
    print("--- Verifying RBAC and API Registration ---")
    
    # 1. Check Router Registration
    from app.api.v1.router import router as v1_router
    routes = [route.path for route in v1_router.routes]
    print(f"Registered routes: {routes}")
    # The routes in the sub-router might not have the /api/v1 prefix yet if inspected directly
    assert any("auth/register" in r for r in routes)
    assert any("writer/me" in r for r in routes)
    assert any("sponsor/me" in r for r in routes)
    print("SUCCESS: All routers (auth, writer, sponsor) registered.")

    # 2. Test require_role logic
    async def mock_role_check(user_role, allowed_roles):
        mock_user = User(id=uuid.uuid4(), email="test@test.com", role=user_role)
        checker = require_role(*allowed_roles)
        try:
            await checker(current_user=mock_user)
            return True
        except HTTPException as e:
            return False

    print("Testing role checker...")
    assert await mock_role_check("admin", ["admin", "writer"]) == True
    assert await mock_role_check("writer", ["writer"]) == True
    assert await mock_role_check("user", ["writer"]) == False
    print("SUCCESS: Role checker working as expected (RBAC verified).")

if __name__ == "__main__":
    asyncio.run(verify_rbac())
