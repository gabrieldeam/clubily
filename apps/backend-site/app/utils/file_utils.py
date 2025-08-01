import os
import shutil
import uuid
from fastapi import UploadFile

STATIC_DIR = os.path.join("app", "static")

def save_file(file: UploadFile, subfolder: str) -> str:
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(STATIC_DIR, subfolder, filename)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return f"/static/{subfolder}/{filename}"

def delete_file_by_url(url_path: str):
    if url_path.startswith("/static/"):
        filepath = os.path.join("app", url_path.lstrip("/"))
        if os.path.isfile(filepath):
            os.remove(filepath)
