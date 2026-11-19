import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError as PydanticValidationError

from app.api.routes import (
    ai as ai_router,
    analytics as analytics_router,
    auth as auth_router,
    hazards as hazards_router,
    reports as reports_router,
    uploads as uploads_router,
)
from app.core.config import settings
from app.core.exceptions import (
    AppError,
    app_error_handler,
    http_exception_handler,
    pydantic_validation_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.db.session import SessionLocal
from app.services.seed import try_seed_defaults


@asynccontextmanager
async def lifespan(_app: FastAPI):
    db = SessionLocal()
    try:
        try_seed_defaults(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["x-request-id"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response


app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(PydanticValidationError, pydantic_validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.include_router(auth_router.router)
app.include_router(reports_router.router)
app.include_router(hazards_router.router)
app.include_router(analytics_router.router)
app.include_router(ai_router.router)
app.include_router(uploads_router.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.app_name}
