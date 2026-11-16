"""Rockfall and debris detection adapter.

Detects rockfall and debris hazards from RGB photographs.
Weights expected in ``/app/weights/rockfall``.
"""

from __future__ import annotations

from app.adapters.detection import DetectionAdapter

CLASSES = ["rockfall", "debris"]


class RockfallDebrisAdapter(DetectionAdapter):
    def __init__(self, weights_dir: str = "/app/weights/rockfall"):
        super().__init__(
            weights_dir=weights_dir,
            model_type="rockfall_debris",
            classes=CLASSES,
            input_size=(640, 640),
            confidence_threshold=0.3,
        )
