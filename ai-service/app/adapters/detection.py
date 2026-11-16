"""Shared adapter for RGB object-detection models.

Used by road damage, rockfall/debris, and flooding detection. Each concrete
adapter supplies its own class list, model type code, and weights directory.
Preprocessing (resize, normalize to [0,1]) and postprocessing (class + box
from model logits) are shared. The bounding box is read from the model's own
output logits rather than hardcoded, so real weights produce real boxes.
"""

from __future__ import annotations

from typing import Any, Dict, Tuple

import numpy as np
import torch
import torch.nn as nn
from PIL import Image

from app.adapters.base import BaseAdapter


class DetectionAdapter(BaseAdapter):
    """Base adapter for RGB object-detection hazard models."""

    def __init__(
        self,
        weights_dir: str,
        model_type: str,
        classes: list[str],
        input_size: tuple[int, int] = (640, 640),
        confidence_threshold: float = 0.3,
    ):
        self.classes = classes
        self.confidence_threshold = confidence_threshold
        super().__init__(
            weights_dir=weights_dir,
            model_type=model_type,
            input_size=input_size,
        )

    # ------------------------------------------------------------------
    # Weight loading
    # ------------------------------------------------------------------

    def _load_weights(self, weights_path: str) -> Any:
        state = torch.load(weights_path, map_location="cpu")

        class _Detector(nn.Module):
            def __init__(self, num_classes: int):
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

        model = _Detector(num_classes=len(self.classes))
        model.load_state_dict(state, strict=False)
        return model

    # ------------------------------------------------------------------
    # Input preparation (RGB)
    # ------------------------------------------------------------------

    def _prepare_input(self, image_path: str) -> Tuple[Any, Dict[str, Any]]:
        image = Image.open(image_path).convert("RGB")
        image = image.resize(self.input_size)
        tensor = (
            torch.tensor(np.array(image), dtype=torch.float32)
            .permute(2, 0, 1)
            .unsqueeze(0)
        )
        tensor = tensor / 255.0
        image_info = {"size": image.size, "classes": self.classes}
        return tensor, image_info

    # ------------------------------------------------------------------
    # Output postprocessing
    # ------------------------------------------------------------------

    def _postprocess(
        self, raw_output: Any, image_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        logits = raw_output.detach().flatten()
        class_logits = logits[: len(self.classes)]
        probs = torch.softmax(class_logits, dim=0)
        top_idx = int(torch.argmax(probs))
        confidence = float(probs[top_idx])

        if confidence < self.confidence_threshold:
            return {
                "model_loaded": True,
                "model_type": self.model_type,
                "confidence": confidence,
                "predictions": [],
                "message": (
                    f"No {self.model_type.replace('_', ' ')} detected "
                    "above confidence threshold."
                ),
            }

        # Bounding box read from the model's own output logits.
        box_logits = logits[len(self.classes) : len(self.classes) + 4]
        box = torch.sigmoid(box_logits).tolist()

        return {
            "model_loaded": True,
            "model_type": self.model_type,
            "confidence": confidence,
            "predictions": [
                {
                    "class": self.classes[top_idx],
                    "confidence": confidence,
                    "bounding_box": box,
                }
            ],
            "message": f"{self.model_type.replace('_', ' ').title()} detected.",
        }
