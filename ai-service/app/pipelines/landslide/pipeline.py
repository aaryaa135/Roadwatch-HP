"""Landslide segmentation pipeline.

Segments landslide-affected areas from 14-channel multispectral satellite
imagery using a U-Net architecture. Ordinary RGB photographs cannot be
processed directly by this module.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image

from app.shared.inference import BasePipeline

NUM_BANDS = 14


class _DoubleConv(nn.Module):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, 3, padding=1),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class _UNet(nn.Module):
    """Minimal U-Net skeleton for binary landslide segmentation."""

    def __init__(self, in_channels: int = NUM_BANDS):
        super().__init__()
        self.enc1 = _DoubleConv(in_channels, 32)
        self.pool1 = nn.MaxPool2d(2)
        self.enc2 = _DoubleConv(32, 64)
        self.pool2 = nn.MaxPool2d(2)
        self.bottleneck = _DoubleConv(64, 128)
        self.up2 = nn.ConvTranspose2d(128, 64, 2, stride=2)
        self.dec2 = _DoubleConv(128, 64)
        self.up1 = nn.ConvTranspose2d(64, 32, 2, stride=2)
        self.dec1 = _DoubleConv(64, 32)
        self.head = nn.Conv2d(32, 1, 1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool1(e1))
        b = self.bottleneck(self.pool2(e2))
        d2 = self.dec2(torch.cat([self.up2(b), e2], dim=1))
        d1 = self.dec1(torch.cat([self.up1(d2), e1], dim=1))
        return self.head(d1)


def load_multispectral(image_path: str) -> np.ndarray:
    """Load a 14-band multispectral image as an HxWx14 float array.

    Reads successive bands from a multi-band TIFF using PIL. Falls back to
    tiling a single-band image into 14 channels only when the file carries
    one band (useful for smoke tests with ordinary rasters).
    """
    image = Image.open(image_path)
    bands = []
    index = 0
    while True:
        try:
            bands.append(np.array(image.getband(index)).astype(np.float32))
            index += 1
        except (IndexError, ValueError):
            break

    if len(bands) == NUM_BANDS:
        return np.stack(bands, axis=-1)

    if len(bands) == 1:
        # Development fallback: replicate/scale single band into 14 channels.
        single = bands[0]
        return np.stack([single * (i + 1) / NUM_BANDS for i in range(NUM_BANDS)], axis=-1)

    raise ValueError(f"Expected {NUM_BANDS} spectral bands, found {len(bands)}")


class LandslidePipeline(BasePipeline):
    def __init__(self, weights_dir: str = "/app/weights/landslide"):
        super().__init__(weights_dir=weights_dir, input_size=(256, 256))

    @property
    def model_type(self) -> str:
        return "landslide"

    def _load_model(self) -> None:
        weights_path = self._find_weights()
        if weights_path is None:
            self.model = None
            return
        try:
            state = torch.load(weights_path, map_location="cpu")
            model = _UNet(in_channels=NUM_BANDS)
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

    def predict(self, image_path: str) -> Dict[str, Any]:
        """Run landslide segmentation on a multispectral image file."""
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
        try:
            array = load_multispectral(image_path)
        except Exception as exc:  # pragma: no cover - defensive
            return {
                "model_loaded": False,
                "model_type": self.model_type,
                "confidence": 0.0,
                "predictions": [],
                "message": f"Failed to load multispectral image: {exc}",
            }

        tensor = self._preprocess_from_array(array)
        raw_output = self.model(tensor)
        return self._postprocess(raw_output, (array.shape[1], array.shape[0]))

    def _preprocess_from_array(self, array: np.ndarray) -> torch.Tensor:
        array = array[:, :, :NUM_BANDS].astype(np.float32)
        array = (array - array.mean()) / (array.std() + 1e-6)
        return torch.tensor(array).permute(2, 0, 1).unsqueeze(0)

    def _preprocess(self, image: Image.Image) -> torch.Tensor:  # unused for landslide
        array = np.array(image.convert("RGB")).astype(np.float32)
        return self._preprocess_from_array(np.stack([array] * NUM_BANDS, axis=-1))

    def _postprocess(self, raw_output: torch.Tensor, image_size: tuple[int, int]) -> Dict[str, Any]:
        probs = torch.sigmoid(raw_output.detach())
        mask = (probs > 0.5).float()
        coverage = float(mask.mean())

        return {
            "model_loaded": True,
            "model_type": self.model_type,
            "confidence": coverage,
            "predictions": [
                {
                    "class": "landslide",
                    "confidence": coverage,
                    "mask_coverage": coverage,
                }
            ],
            "message": (
                "Landslide-affected area detected."
                if coverage > 0.05
                else "No significant landslide area detected."
            ),
        }
