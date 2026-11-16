"""Modular inference registry for RoadWatch HP AI models.

Manages the lifecycle of all model adapters: registration, lazy/warm-up
loading, lookup by model type, and inference dispatch. Adapters are
responsible for their own preprocessing and model requirements.

No predictions are ever fabricated: an adapter without weights reports
``model_loaded: False`` with an empty prediction set.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.adapters.base import BaseAdapter


class InferenceRegistry:
    """Registry of AI model adapters."""

    def __init__(self) -> None:
        self._adapters: Dict[str, BaseAdapter] = {}

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register(self, adapter: BaseAdapter) -> None:
        """Register an adapter under its model_type code."""
        self._adapters[adapter.model_type] = adapter

    # ------------------------------------------------------------------
    # Lookup
    # ------------------------------------------------------------------

    def get(self, model_type: str) -> Optional[BaseAdapter]:
        return self._adapters.get(model_type)

    def list_models(self) -> List[str]:
        return sorted(self._adapters.keys())

    def has(self, model_type: str) -> bool:
        return model_type in self._adapters

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def load(self, model_type: str) -> bool:
        """Load (or reload) weights for a single model. Returns success."""
        adapter = self.get(model_type)
        if adapter is None:
            return False
        return adapter.load()

    def load_all(self) -> Dict[str, bool]:
        """Load weights for every registered adapter."""
        return {mt: self.load(mt) for mt in self._adapters}

    def warm_up(self) -> None:
        """Alias for load_all, kept for backward compatibility."""
        self.load_all()

    def metadata(self) -> List[Dict[str, Any]]:
        return [adapter.metadata() for adapter in self._adapters.values()]

    # ------------------------------------------------------------------
    # Inference dispatch
    # ------------------------------------------------------------------

    def infer(self, model_type: str, image_path: str) -> Dict[str, Any]:
        """Run inference for the given model type on an image file."""
        adapter = self.get(model_type)
        if adapter is None:
            return {
                "model_loaded": False,
                "model_type": model_type,
                "confidence": 0.0,
                "predictions": [],
                "message": (
                    f"Unknown model type '{model_type}'. "
                    f"Available: {self.list_models()}"
                ),
            }
        return adapter.predict(image_path)
