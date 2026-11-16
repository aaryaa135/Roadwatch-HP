"""Flooding and waterlogging detection adapter.

Detects flooded and waterlogged road areas from RGB photographs.
Weights expected in ``/app/weights/flooding``.
"""

from __future__ import annotations

from app.adapters.detection import DetectionAdapter

CLASSES = ["flooding", "waterlogging"]


class FloodingAdapter(DetectionAdapter):
    def __init__(self, weights_dir: str = "/app/weights/flooding"):
        super().__init__(
            weights_dir=weights_dir,
            model_type="flooding_waterlogging",
            classes=CLASSES,
            input_size=(640, 640),
            confidence_threshold=0.3,
        )
