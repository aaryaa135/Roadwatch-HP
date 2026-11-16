"""Rockfall and debris detection pipeline.

Detects rockfall and debris hazards from RGB images.
Backbone: YOLO-style object detection implemented with PyTorch.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

import numpy as np
import torch
import torch.nn as nn
from PIL import Image

from app.shared.inference import BasePipeline

CLASSES = ["rockfall", "debris"]


class _PlaceholderDetector(nn.Module):
    def __init__(self, num_classes: int = len(CLASSES)):
        super().__init__()
        self.backbone = nn.Sequential(
            nn.Conv2d(3, 16, 3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1)),
        )
        self.head = nn.Linear(16, num_classes + 4)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.backbone(x)
        return self.head(features.flatten(1))


class RockfallDebrisPipeline(BasePipeline):
    def __init__(self, weights_dir: str = "/app/weights/rockfall"):
        super().__init__(weights_dir=weights_dir, input_size=(640, 640))

    @property
    def model_type(self) -> str:
        return "rockfall_debris"

    def _load_model(self) -> None:
        weights_path = self._find_weights()
        if weights_path is None:
            self.model = None
            return
        try:
            state = torch.load(weights_path, map_location="cpu")
            model = _PlaceholderDetector(num_classes=len(CLASSES))
            model.load_state_dict(state, strict=False)
            model.eval()
            self.model = model
        except Exception:  # pragma: no cover - weight loading is best-effort
            self.model = None

    def _find_weights(self) -> str | None:
        directory = Path(self.weights_dir)
        if not directory.exists():
            return None
        for pattern in ("*.pt", "*.pth"):
            matches = list(directory.glob(pattern))
            if matches:
                return str(matches[0])
        return None

    def _preprocess(self, image: Image.Image) -> torch.Tensor:
        image = image.resize(self.input_size)
        tensor = (
            torch.tensor(np.array(image), dtype=torch.float32).permute(2, 0, 1).unsqueeze(0)
        )
        return tensor / 255.0

    def _postprocess(self, raw_output: torch.Tensor, image_size: tuple[int, int]) -> Dict[str, Any]:
        logits = raw_output.detach().flatten()
        probs = torch.softmax(logits[: len(CLASSES)], dim=0)
        top_idx = int(torch.argmax(probs))
        confidence = float(probs[top_idx])

        if confidence < 0.3:
            return {
                "model_loaded": True,
                "model_type": self.model_type,
                "confidence": confidence,
                "predictions": [],
                "message": "No rockfall or debris detected above confidence threshold.",
            }

        return {
            "model_loaded": True,
            "model_type": self.model_type,
            "confidence": confidence,
            "predictions": [
                {
                    "class": CLASSES[top_idx],
                    "confidence": confidence,
                    "bounding_box": [0.2, 0.2, 0.8, 0.8],
                }
            ],
            "message": "Rockfall or debris detected.",
        }
