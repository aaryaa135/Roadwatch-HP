"""Landslide segmentation adapter.

Segments landslide-affected areas from 14-channel multispectral satellite
imagery using a U-Net architecture. Ordinary RGB photographs cannot be
processed directly by this module — the input must be a 14-band multispectral
TIFF. Weights expected in ``/app/weights/landslide``.
"""

from __future__ import annotations

from typing import Any, Dict, Tuple

import numpy as np
import torch
import torch.nn as nn
from PIL import Image

from app.adapters.base import BaseAdapter

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
        return np.stack(
            [single * (i + 1) / NUM_BANDS for i in range(NUM_BANDS)], axis=-1
        )

    raise ValueError(f"Expected {NUM_BANDS} spectral bands, found {len(bands)}")


class LandslideAdapter(BaseAdapter):
    def __init__(self, weights_dir: str = "/app/weights/landslide"):
        super().__init__(
            weights_dir=weights_dir,
            model_type="landslide",
            input_size=(256, 256),
        )
        self.classes = ["landslide"]

    # ------------------------------------------------------------------
    # Weight loading (U-Net with 14 input channels)
    # ------------------------------------------------------------------

    def _load_weights(self, weights_path: str) -> Any:
        state = torch.load(weights_path, map_location="cpu")
        model = _UNet(in_channels=NUM_BANDS)
        model.load_state_dict(state, strict=False)
        return model

    # ------------------------------------------------------------------
    # Input preparation (multispectral, not RGB)
    # ------------------------------------------------------------------

    def _prepare_input(self, image_path: str) -> Tuple[Any, Dict[str, Any]]:
        array = load_multispectral(image_path)
        array = array[:, :, :NUM_BANDS].astype(np.float32)
        array = (array - array.mean()) / (array.std() + 1e-6)
        tensor = torch.tensor(array).permute(2, 0, 1).unsqueeze(0)
        image_info = {"size": (array.shape[1], array.shape[0])}
        return tensor, image_info

    # ------------------------------------------------------------------
    # Output postprocessing (segmentation coverage)
    # ------------------------------------------------------------------

    def _postprocess(
        self, raw_output: Any, image_info: Dict[str, Any]
    ) -> Dict[str, Any]:
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
