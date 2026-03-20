from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta, datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_jwt
from app.core.exceptions import raise_conflict, raise_unauthorized
from app.config import settings
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.supabase_client import supabase, get_supabase_admin
import structlog

log = structlog.get_logger()

security = HTTPBearer()

# Supabase Auth Integration
# Legacy Authlib registrations removed. Using Supabase OAuth via Frontend.


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Supabase JWT 토큰을 검증하여 현재 사용자 추출 및 로컬 Role 확인"""
    token = credentials.credentials
    
    try:
        # JWT 토큰 직접 검증
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
             log.error("auth_failed", token_preview=token[:10] + "...")
             raise_unauthorized("Invalid session or user not found")
    except Exception as e:
        log.error("auth_exception", error=str(e), token_preview=token[:10] + "...")
        raise_unauthorized(f"Auth error: {str(e)}")

    supabase_user = user_res.user
    email = supabase_user.email
    
    # DB에 해당 유저가 있는지 확인
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # 이름 추출
        metadata = supabase_user.user_metadata or {}
        full_name = metadata.get("full_name") or metadata.get("name") or metadata.get("nickname") or "꿈 참여자"

        # 신규 유저라면 로컬 DB에 생성
        user = User(
            id=uuid.UUID(supabase_user.id),
            email=email,
            full_name=full_name,
            role="user", # 기본값 명시
            is_active=True,
            is_verified=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if not user.is_active:
        raise_unauthorized("User is inactive")

    return user


def require_role(*allowed_roles: str):
    """특정 role만 접근 허용하는 FastAPI Depends"""
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            log.warning("role_access_denied", user_id=str(current_user.id), role=current_user.role, allowed=allowed_roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for this role"
            )
        return current_user
    return role_checker

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Backend Proxy Register: Supabase Admin SDK를 사용하여 유저 생성"""
    try:
        # 1. Supabase Admin API로 유저 생성 (Confirm Email 우회)
        # Note: email_confirm=True로 설정하여 즉시 활성화
        admin_client = get_supabase_admin()
        res = admin_client.auth.admin.create_user({
            "email": str(user_data.email),
            "password": user_data.password,
            "email_confirm": True,
            "user_metadata": {"full_name": user_data.full_name}
        })
        
        if not res or not res.user:
            raise HTTPException(status_code=400, detail="Supabase user creation failed")
            
        supabase_user = res.user
        
        # 2. 로컬 DB에 유저 정보 저장 (이미 존재하는지 체크)
        result = await db.execute(select(User).where(User.email == str(user_data.email)))
        user = result.scalar_one_or_none()
        
        if not user:
            allowed_roles = {"user", "writer", "sponsor"}
            role = user_data.role if user_data.role in allowed_roles else "user"
            user = User(
                id=uuid.UUID(supabase_user.id),
                email=str(user_data.email),
                full_name=user_data.full_name,
                role=role,
                is_active=True,
                is_verified=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
        return user
    except Exception as e:
        import structlog
        log = structlog.get_logger()
        log.error("register_proxy_failed", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=dict)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Backend Proxy Login: Supabase Auth를 통해 세션 획득"""
    try:
        # Supabase API를 직접 호출하여 로그인
        res = supabase.auth.sign_in_with_password({
            "email": str(login_data.email),
            "password": login_data.password
        })
        
        if not res or not res.session:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        # 세션 정보 반환 (프론트엔드에서 수동 저장용)
        return {
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "expires_in": res.session.expires_in,
            "user": {
                "id": res.user.id,
                "email": res.user.email,
                "full_name": res.user.user_metadata.get("full_name", "꿈 참여자")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """내 정보 조회 (Supabase 토큰 필요)"""
    return current_user
