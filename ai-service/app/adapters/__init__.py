"""Package exports for AI inference adapters."""

from app.adapters.base import BaseAdapter
from app.adapters.detection import DetectionAdapter
from app.adapters.flooding import FloodingAdapter
from app.adapters.landslide import LandslideAdapter
from app.adapters.registry import InferenceRegistry
from app.adapters.rockfall import RockfallDebrisAdapter
from app.adapters.road_damage import RoadDamageAdapter

__all__ = [
    "BaseAdapter",
    "DetectionAdapter",
    "FloodingAdapter",
    "LandslideAdapter",
    "InferenceRegistry",
    "RockfallDebrisAdapter",
    "RoadDamageAdapter",
]
