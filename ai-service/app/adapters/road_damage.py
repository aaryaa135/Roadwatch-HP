"""Road damage detection adapter.

Detects road surface hazards (pothole, crack, rutting) from RGB photographs.
Weights expected in ``/app/weights/road_damage``.
"""

from __future__ import annotations

from app.adapters.detection import DetectionAdapter

CLASSES = ["pothole", "crack", "rutting"]


class RoadDamageAdapter(DetectionAdapter):
    def __init__(self, weights_dir: str = "/app/weights/road_damage"):
        super().__init__(
            weights_dir=weights_dir,
            model_type="road_damage",
            classes=CLASSES,
            input_size=(640, 640),
            confidence_threshold=0.3,
        )
