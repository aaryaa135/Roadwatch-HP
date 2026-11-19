"""Image upload endpoint for RoadWatch HP hazard reports.

Accepts a photograph, validates it, stores it under the configured upload
directory, and returns the public URL. The URL can be stored in a hazard
report and passed to the AI service for inference.
"""

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.schemas.hazard import UploadResponse
from app.services.upload import (
    UploadError,
    get_uploaded_file,
    save_upload,
)

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_image(file: UploadFile = File(...)):
    try:
        url = await save_upload(file)
    except UploadError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return UploadResponse(url=url, filename=file.filename or "upload")


@router.get("/{object_name}")
async def get_upload(object_name: str):
    path = get_uploaded_file(object_name)
    if path is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Uploaded file not found")
    return FileResponse(path)
