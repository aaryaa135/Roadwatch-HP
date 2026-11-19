import uuid

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
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
    ExternalServiceError,
    app_error_handler,
    http_exception_handler,
    pydantic_validation_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.db.session import SessionLocal
from app.services.seed import try_seed_defaults
from app.services.upload import get_uploaded_file

app = FastAPI(title=settings.app_name, debug=settings.debug)


@app.on_event("startup")
def seed_lookups() -> None:
    db = SessionLocal()
    try:
        try_seed_defaults(db)
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://127.0.0.1:5173"],
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
app.add_exception_handler(ExternalServiceError, app_error_handler)
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

# Serve uploaded photographs statically.
upload_dir = settings.upload_dir
import os

os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")


@app.get("/uploads/{object_name}")
async def get_upload(object_name: str):
    path = get_uploaded_file(object_name)
    if path is None:
        raise HTTPException(status_code=404, detail="Uploaded file not found")
    return FileResponse(path)


@app.get("/health")
def health():
    return {"status": "ok", "service": settings.app_name}
