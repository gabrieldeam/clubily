# app/core/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn 

class Settings(BaseSettings):

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # CORS
    FRONTEND_ORIGINS: list[str]
        
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "clubily_db"
    POSTGRES_PORT: str = "5433"
    DATABASE_URI: PostgresDsn | None = None  # calculada abaixo

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.DATABASE_URI:
            self.DATABASE_URI = (
                f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )

settings = Settings()
