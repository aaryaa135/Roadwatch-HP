from typing import Any, Dict, Optional

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError

from app.schemas.error import ErrorDetail, ErrorResponse


class AppError(Exception):
    """Base application error with an HTTP status code and optional error code."""

    def __init__(
        self,
        status_code: int,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.status_code = status_code
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(AppError):
    def __init__(self, resource: str = "Resource", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=f"{resource} not found",
            error_code="not_found",
            details=details or {},
        )


class AlreadyExistsError(AppError):
    def __init__(self, resource: str = "Resource", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            message=f"{resource} already exists",
            error_code="already_exists",
            details=details or {},
        )


class ValidationFailureError(AppError):
    def __init__(
        self,
        message: str = "Validation failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            message=message,
            error_code="validation_failure",
            details=details or {},
        )


class ExternalServiceError(AppError):
    def __init__(
        self,
        service: str,
        message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            message=message or f"External service '{service}' is unavailable",
            error_code="external_service_error",
            details=details or {},
        )


def _validation_error_detail(errors: list) -> Dict[str, Any]:
    """Normalize Pydantic validation errors into a flat dict of field -> messages."""
    field_errors: Dict[str, list] = {}
    for err in errors:
        loc = err.get("loc", [])
        field = loc[-1] if loc else "body"
        msg = err.get("msg", "Invalid value")
        field_errors.setdefault(str(field), []).append(msg)
    return field_errors


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.error_code,
            message=exc.message,
            details=exc.details,
            path=request.url.path,
        ).model_dump(),
    )


async def http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    from fastapi import HTTPException

    if not isinstance(exc, HTTPException):
        return await unhandled_exception_handler(request, exc)
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error="http_error",
            message=str(exc.detail) if isinstance(exc.detail, str) else "Request failed",
            details={},
            path=request.url.path,
        ).model_dump(),
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error="validation_failure",
            message="Request validation failed",
            details=_validation_error_detail(exc.errors()),
            path=request.url.path,
        ).model_dump(),
    )


async def pydantic_validation_exception_handler(
    request: Request, exc: PydanticValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error="validation_failure",
            message="Data validation failed",
            details=_validation_error_detail(exc.errors()),
            path=request.url.path,
        ).model_dump(),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="internal_server_error",
            message="An unexpected error occurred",
            details={},
            path=request.url.path,
        ).model_dump(),
    )
