from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email: str
    phone: Optional[str] = None
    role: str = Field(default="citizen")
    district: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserRead(UserBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HazardReportBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    hazard_type: str
    severity: str = "medium"
    district: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class HazardReportCreate(HazardReportBase):
    image_urls: Optional[List[str]] = None


class AIDetectionRead(BaseModel):
    id: UUID
    model_type: str
    confidence: float
    bounding_box: Optional[dict] = None
    mask_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReportVerificationRead(BaseModel):
    id: UUID
    action: str
    remarks: Optional[str] = None
    reviewer_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HazardReportRead(HazardReportBase):
    id: UUID
    reporter_id: Optional[UUID]
    status: str
    resolution_status: str = "unresolved"
    image_urls: List[str]
    ai_confidence: Optional[float] = None
    ai_detections: List[AIDetectionRead] = []
    verification_history: List[ReportVerificationRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HazardReportUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    resolution_status: Optional[str] = None
    district: Optional[str] = None


class VerificationAction(BaseModel):
    remarks: Optional[str] = Field(default=None, max_length=2000)


class UploadResponse(BaseModel):
    url: str
    filename: str


class AIInferenceRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_type: str
    image_url: str


class AIInferenceResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_type: str
    confidence: float
    predictions: list = []
    message: str = ""
    model_loaded: bool = False
    bounding_box: dict | None = None
    mask_url: str | None = None
