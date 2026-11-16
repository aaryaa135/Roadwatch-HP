import httpx

from app.core.config import settings


class AIServiceClient:
    def __init__(self, base_url: str | None = None, timeout: float = 30.0):
        self.base_url = base_url or settings.ai_service_url
        self.timeout = timeout

    async def infer(self, model_type: str, image_url: str) -> dict:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/infer",
                json={"model_type": model_type, "image_url": image_url},
            )
            response.raise_for_status()
            return response.json()

    async def health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/health")
                return response.status_code == 200
        except Exception:
            return False
