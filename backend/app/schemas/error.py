from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class ErrorDetail(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    field: Optional[str] = None
    message: str


class ErrorResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    error: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error message")
    details: Dict[str, Any] = Field(default_factory=dict)
    path: Optional[str] = None
