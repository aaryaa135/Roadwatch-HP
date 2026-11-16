"""AI pipeline behaviour tests.

These require PyTorch and run in the CI/Docker environment where the
ai-service requirements are installed. Locally they are skipped when
torch is unavailable.
"""

import importlib.util

import pytest

torch = pytest.importorskip("torch")

from app.pipelines.flooding.pipeline import FloodingPipeline  # noqa: E402
from app.pipelines.landslide.pipeline import (  # noqa: E402
    LandslidePipeline,
    load_multispectral,
)
from app.pipelines.road_damage.pipeline import RoadDamagePipeline  # noqa: E402
from app.pipelines.rockfall.pipeline import RockfallDebrisPipeline  # noqa: E402
from app.shared.inference import normalize_box  # noqa: E402

PIPELINES = [
    RoadDamagePipeline,
    RockfallDebrisPipeline,
    FloodingPipeline,
    LandslidePipeline,
]


def _make_png(tmp_path, size=(10, 10)):
    from PIL import Image

    path = tmp_path / "image.png"
    Image.new("RGB", size).save(path)
    return str(path)


@pytest.mark.parametrize("pipeline_cls", PIPELINES)
def test_pipeline_reports_missing_weights(tmp_path, pipeline_cls):
    weights_dir = tmp_path / "weights"
    weights_dir.mkdir()
    pipeline = pipeline_cls(weights_dir=str(weights_dir))
    assert pipeline.model is None

    image_path = _make_png(tmp_path)
    result = pipeline.predict(image_path)

    assert result["model_loaded"] is False
    assert result["predictions"] == []
    assert result["confidence"] == 0.0
    assert "weights" in result["message"].lower()


def test_normalize_box_clamped():
    assert normalize_box([-10, -10, 110, 110], (100, 100)) == [
        0.0,
        0.0,
        1.0,
        1.0,
    ]
    assert normalize_box([10, 20, 90, 80], (100, 100)) == [0.1, 0.2, 0.9, 0.8]


def test_load_multispectral_single_band_fallback(tmp_path):
    from PIL import Image
    import numpy as np

    path = tmp_path / "single.tif"
    Image.new("L", (8, 8), color=128).save(path)
    array = load_multispectral(str(path))
    assert array.shape == (8, 8, 14)
