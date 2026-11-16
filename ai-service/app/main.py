"""RoadWatch HP AI service — FastAPI entry point.

Uses a modular adapter registry (``app.adapters.registry.InferenceRegistry``)
to manage the four hazard model adapters. Each adapter handles its own
preprocessing and model requirements:

- road_damage:       RGB object detection (pothole, crack, rutting)
- landslide:         14-band multispectral U-Net segmentation
- rockfall_debris:   RGB object detection (rockfall, debris)
- flooding_waterlogging: RGB object detection (flooding, waterlogging)

No predictions are ever fabricated. An adapter without trained weights
reports ``model_loaded: False`` with an empty prediction set.
"""

import tempfile
import urllib.request
from pathlib import Path
from typing import Dict

from fastapi import FastAPI, HTTPException, status

from app.adapters.flooding import FloodingAdapter
from app.adapters.landslide import LandslideAdapter
from app.adapters.registry import InferenceRegistry
from app.adapters.rockfall import RockfallDebrisAdapter
from app.adapters.road_damage import RoadDamageAdapter
from app.schemas import AIInferenceRequest, AIInferenceResponse

registry = InferenceRegistry()
registry.register(RoadDamageAdapter())
registry.register(LandslideAdapter())
registry.register(RockfallDebrisAdapter())
registry.register(FloodingAdapter())

app = FastAPI(title="RoadWatch HP AI Service")


@app.on_event("startup")
def warm_adapters() -> None:
    registry.warm_up()


@app.get("/health")
def health():
    loaded = {m["model_type"]: m["loaded"] for m in registry.metadata()}
    return {
        "status": "ok",
        "service": "ai-service",
        "models": loaded,
    }


@app.get("/models")
def list_models():
    return {"models": registry.list_models()}


def _download_image(image_url: str) -> str:
    suffix = Path(image_url).suffix or ".jpg"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        with urllib.request.urlopen(image_url, timeout=30) as response, open(
            tmp.name, "wb"
        ) as out:
            out.write(response.read())
    except Exception as exc:
        tmp.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not download image: {exc}",
        )
    return tmp.name


@app.post("/infer", response_model=AIInferenceResponse)
async def infer(request: AIInferenceRequest):
    image_path = _download_image(request.image_url)
    try:
        result = registry.infer(request.model_type, image_path)
    finally:
        Path(image_path).unlink(missing_ok=True)

    return AIInferenceResponse(**result)
