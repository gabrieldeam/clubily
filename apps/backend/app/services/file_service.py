# backend/app/services/file_service.py

import os
from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile

# 1) Define o diretório base em app/static/rewards
BASE_STATIC = Path(os.getcwd()) / "app" / "static" / "rewards"
BASE_STATIC.mkdir(parents=True, exist_ok=True)

def save_upload(upload: UploadFile, subfolder: str = "") -> str:
    """
    Salva um UploadFile dentro de app/static/rewards[/<subfolder>]
    e retorna a URL relativa para servir via /static/…
    """
    # 2) Cria subpasta, se fornecida
    dest_folder = BASE_STATIC
    if subfolder:
        dest_folder = BASE_STATIC / subfolder
        dest_folder.mkdir(parents=True, exist_ok=True)

    # 3) Gera nome único e grava no disco
    ext = os.path.splitext(upload.filename)[1]
    filename = f"{uuid4()}{ext}"
    file_path = dest_folder / filename

    upload.file.seek(0)
    with open(file_path, "wb") as f:
        f.write(upload.file.read())

    # 4) Retorna caminho relativo para o static handler do FastAPI
    rel = Path("rewards")
    if subfolder:
        rel /= subfolder
    rel /= filename
    return f"/static/{rel.as_posix()}"
