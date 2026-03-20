from fastapi import HTTPException, status


class DreamNewsException(Exception):
    """꿈신문사 기본 예외"""
    pass


class NotFoundError(DreamNewsException):
    pass


class UnauthorizedError(DreamNewsException):
    pass


class ForbiddenError(DreamNewsException):
    pass


class ConflictError(DreamNewsException):
    pass


# ============================
# HTTP 예외 헬퍼
# ============================
def raise_not_found(resource: str = "리소스"):
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource}를 찾을 수 없습니다.",
    )


def raise_unauthorized(detail: str = "인증이 필요합니다."):
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def raise_forbidden():
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="접근 권한이 없습니다.",
    )


def raise_conflict(detail: str = "이미 존재합니다."):
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=detail,
    )
