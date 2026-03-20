from fastapi import APIRouter
from app.api.v1 import auth, orders, newspapers, payment, writer, sponsor, templates

router = APIRouter(prefix="/api/v1")

router.include_router(auth.router)
router.include_router(orders.router)
router.include_router(newspapers.router)
router.include_router(payment.router)
router.include_router(writer.router)
router.include_router(sponsor.router)
router.include_router(templates.router)
