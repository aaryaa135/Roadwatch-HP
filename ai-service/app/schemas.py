from pydantic import BaseModel, ConfigDict, Field


class AIInferenceRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_type: str
    image_url: str


class AIInferenceResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    model_type: str
    confidence: float = Field(ge=0.0, le=1.0)
    predictions: list = []
    message: str = ""
    model_loaded: bool = False
    bounding_box: dict | None = None
    mask_url: str | None = None
