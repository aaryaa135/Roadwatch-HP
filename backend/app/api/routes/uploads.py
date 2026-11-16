"""Image upload endpoint for RoadWatch HP hazard reports.

Accepts a photograph, validates it, stores it under the configured upload
directory, and returns the public URL. The URL can be stored in a hazard
report and passed to the AI service for inference.
"""

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.hazard import UploadResponse
from app.services.upload import save_upload, UploadError

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...)):
    try:
        url = await save_upload(file)
    except UploadError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return UploadResponse(url=url, filename=file.filename or "upload")
