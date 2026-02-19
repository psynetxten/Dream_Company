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
from authlib.integrations.fastapi_client import OAuth
from app.core.supabase_client import supabase

security = HTTPBearer()

# OAuth 설정
oauth = OAuth()
oauth.register(
    name="kakao",
    client_id=settings.KAKAO_CLIENT_ID,
    client_secret=settings.KAKAO_CLIENT_SECRET,
    authorize_url="https://kauth.kakao.com/oauth/authorize",
    access_token_url="https://kauth.kakao.com/oauth/token",
    userinfo_endpoint="https://kapi.kakao.com/v2/user/me",
    client_kwargs={"scope": "account_email profile_nickname"},
)

oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Supabase JWT 토큰을 검증하여 현재 사용자 추출"""
    token = credentials.credentials
    
    # Supabase SDK를 사용하여 토큰 검증 및 유저 정보 획득
    try:
        user_res = supabase.auth.get_user(token)
        if not user_res:
             raise_unauthorized("Invalid session")
    except Exception as e:
        raise_unauthorized(f"Auth error: {str(e)}")

    supabase_user = user_res.user
    email = supabase_user.email
    
    # DB에 해당 유저가 있는지 확인 (Local DB와 Supabase Auth 연동)
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # 이름 추출 (여러 메타데이터 필드 시도)
        metadata = supabase_user.user_metadata or {}
        full_name = metadata.get("full_name") or metadata.get("name") or metadata.get("nickname") or "꿈 참여자"

        # 신규 유저라면 로컬 DB에 생성 (Lazy registration)
        user = User(
            id=uuid.UUID(supabase_user.id),
            email=email,
            full_name=full_name,
            is_active=True,
            is_verified=True
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if not user.is_active:
        raise_unauthorized("User is inactive")

    return user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """내 정보 조회 (Supabase 토큰 필요)"""
    return current_user
