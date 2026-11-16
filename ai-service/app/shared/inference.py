"""Shared inference utilities used by all AI pipeline modules."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

import numpy as np
from PIL import Image


class BasePipeline(ABC):
    """Base class for hazard inference pipelines.

    Each pipeline exposes `load_model()` and `predict(image_path)`.
    When trained weights are not present, `predict()` returns an empty
    result set with `model_loaded: False` so callers never receive
    fabricated predictions.
    """

    def __init__(self, weights_dir: str, input_size: tuple[int, int] = (640, 640)):
        self.weights_dir = weights_dir
        self.input_size = input_size
        self.model: Any = None
        self.classes: List[str] = []
        self._load_model()

    @abstractmethod
    def _load_model(self) -> None:
        """Load model weights if available; otherwise leave model unset."""

    @abstractmethod
    def _preprocess(self, image: Image.Image) -> Any:
        """Run model-specific preprocessing."""

    @abstractmethod
    def _postprocess(self, raw_output: Any, image_size: tuple[int, int]) -> Dict[str, Any]:
        """Convert raw model output into a normalised result dict."""

    def predict(self, image_path: str) -> Dict[str, Any]:
        """Run inference on an image file.

        Returns a dict with keys:
          - model_loaded: bool
          - model_type: str
          - confidence: float (0-1)
          - predictions: list of detection dicts
          - message: str
        """
        try:
            image = Image.open(image_path).convert("RGB")
        except Exception as exc:  # pragma: no cover - defensive
            return {
                "model_loaded": False,
                "model_type": self.model_type,
                "confidence": 0.0,
                "predictions": [],
                "message": f"Failed to load image: {exc}",
            }

        if self.model is None:
            return {
                "model_loaded": False,
                "model_type": self.model_type,
                "confidence": 0.0,
                "predictions": [],
                "message": (
                    "Model weights not found. Place trained weights in "
                    f"{self.weights_dir} and restart the AI service."
                ),
            }

        tensor = self._preprocess(image)
        raw_output = self.model(tensor)
        return self._postprocess(raw_output, image.size)

    @property
    @abstractmethod
    def model_type(self) -> str:
        pass


def load_image_from_url(url: str) -> Optional[Image.Image]:
    """Download an image from a URL. Used by the API layer when needed."""
    import urllib.request

    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            return Image.open(response).convert("RGB")
    except Exception:
        return None


def normalize_box(box: List[float], size: tuple[int, int]) -> List[float]:
    """Normalize [x1, y1, x2, y2] pixels to [0, 1] range."""
    width, height = size
    x1, y1, x2, y2 = box
    return [
        max(0.0, min(1.0, x1 / width)),
        max(0.0, min(1.0, y1 / height)),
        max(0.0, min(1.0, x2 / width)),
        max(0.0, min(1.0, y2 / height)),
    ]
