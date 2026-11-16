from fastapi import APIRouter, HTTPException, status

from app.schemas.hazard import AIInferenceRequest, AIInferenceResponse
from app.services.ai_client import AIServiceClient

router = APIRouter(prefix="/ai", tags=["ai"])
ai_client = AIServiceClient()


@router.post("/infer", response_model=AIInferenceResponse)
async def run_inference(request: AIInferenceRequest):
    try:
        result = await ai_client.infer(request.model_type, request.image_url)
        return AIInferenceResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI inference failed: {exc}",
        )


@router.get("/health")
async def ai_health():
    healthy = await ai_client.health()
    return {"ai_service_ok": healthy}
