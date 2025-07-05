# backend/app/services/file_service.py
import os
from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile
from app.core.config import settings

UPLOAD_DIR = Path(settings.MEDIA_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def save_upload(upload: UploadFile, subfolder: str) -> str:
    """
    Salva um UploadFile dentro de MEDIA_DIR/subfolder e
    retorna a path relativa (por ex. "subfolder/uuid.ext").
    """
    dest_folder = UPLOAD_DIR / subfolder
    dest_folder.mkdir(parents=True, exist_ok=True)

    ext = os.path.splitext(upload.filename)[1]
    filename = f"{uuid4()}{ext}"
    file_path = dest_folder / filename

    with open(file_path, "wb") as f:
        f.write(upload.file.read())

    # Retornamos o caminho relativo para servir depois por algum static files
    return f"{subfolder}/{filename}"
