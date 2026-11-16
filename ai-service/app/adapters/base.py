"""Base adapter for AI inference pipelines.

Provides centralized weight discovery, model loading lifecycle, and a
standardized predict contract. Concrete adapters implement model-specific
weight loading, input preparation, and output postprocessing.

No predictions are ever fabricated: when weights are absent,
``predict()`` returns ``model_loaded: False`` with an empty prediction set.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import torch


class BaseAdapter(ABC):
    """Abstract base adapter for a single AI model."""

    def __init__(
        self,
        weights_dir: str,
        model_type: str,
        input_size: tuple[int, int],
    ):
        self.weights_dir = weights_dir
        self.model_type = model_type
        self.input_size = input_size
        self.model: Any = None
        self.classes: list[str] = []
        self._loaded = False
        self.load()

    # ------------------------------------------------------------------
    # Abstract interface — implemented by each concrete adapter
    # ------------------------------------------------------------------

    @abstractmethod
    def _load_weights(self, weights_path: str) -> Any:
        """Load model from a weights file and return the model object."""

    @abstractmethod
    def _prepare_input(self, image_path: str) -> Tuple[Any, Dict[str, Any]]:
        """Load and preprocess an image file.

        Returns ``(tensor, image_info)`` where ``image_info`` is an
        adapter-specific dict passed through to postprocessing.
        """

    @abstractmethod
    def _postprocess(
        self, raw_output: Any, image_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Convert raw model output into the standard result dict."""

    # ------------------------------------------------------------------
    # Shared lifecycle helpers
    # ------------------------------------------------------------------

    def find_weights(self) -> Optional[str]:
        """Return the path to the first available weights file, or None."""
        directory = Path(self.weights_dir)
        if not directory.exists():
            return None
        for pattern in ("*.pt", "*.pth"):
            matches = list(directory.glob(pattern))
            if matches:
                return str(matches[0])
        return None

    def load(self) -> bool:
        """Attempt to load model weights. Returns True on success."""
        weights_path = self.find_weights()
        if weights_path is None:
            self._loaded = False
            self.model = None
            return False
        try:
            self.model = self._load_weights(weights_path)
            self.model.eval()
            self._loaded = True
            return True
        except Exception:  # weight loading is best-effort
            self._loaded = False
            self.model = None
            return False

    def is_loaded(self) -> bool:
        return self._loaded and self.model is not None

    def metadata(self) -> Dict[str, Any]:
        return {
            "model_type": self.model_type,
            "loaded": self.is_loaded(),
            "input_size": self.input_size,
            "classes": list(self.classes),
            "weights_dir": self.weights_dir,
        }

    # ------------------------------------------------------------------
    # Public inference entry point
    # ------------------------------------------------------------------

    def predict(self, image_path: str) -> Dict[str, Any]:
        """Run inference on an image file.

        Returns a dict with keys:
          - model_loaded: bool
          - model_type: str
          - confidence: float (0-1)
          - predictions: list of detection dicts
          - message: str
        """
        if not self.is_loaded():
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

        try:
            tensor, image_info = self._prepare_input(image_path)
        except Exception as exc:  # pragma: no cover - defensive
            return {
                "model_loaded": False,
                "model_type": self.model_type,
                "confidence": 0.0,
                "predictions": [],
                "message": f"Failed to prepare input: {exc}",
            }

        with torch.no_grad():
            raw_output = self.model(tensor)

        return self._postprocess(raw_output, image_info)
