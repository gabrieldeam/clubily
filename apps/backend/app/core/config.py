# backend/app/core/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, EmailStr, validator

class Settings(BaseSettings):
    # Indica onde está o .env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # SMS
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_VERIFY_SERVICE_SID: str
    
    # Project
    PROJECT_NAME: str = "Clubily API"
    API_V1_STR: str = "/api/v1"

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "clubily_db"
    DATABASE_URI: PostgresDsn | None = None  # calculada abaixo

    # Auth
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    COOKIE_NAME: str = "access_token"

    # Crypto
    FERNET_KEY: str  # 32-byte base64 URL-safe key

    # E-mail
    SMTP_HOST: str
    SMTP_PORT: int = 587
    SMTP_USER: EmailStr
    SMTP_PASSWORD: str
    EMAIL_FROM: EmailStr

    # CORS
    FRONTEND_ORIGINS: list[str]
    COOKIE_DOMAIN: str

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.DATABASE_URI:
            self.DATABASE_URI = (
                f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
            )

    ASAAS_API_KEY: str
    ASAAS_BASE_URL: str
    
    # ... as suas outras configurações
    MEDIA_DIR: str = "./media"

settings = Settings()
