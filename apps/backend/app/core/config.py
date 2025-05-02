import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file from the backend directory
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
load_dotenv(dotenv_path=dotenv_path)

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # FastAPI / JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default_secret_key") # Replace default in .env
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

    # Add other application settings here
    # EXAMPLE_SETTING: str = os.getenv("EXAMPLE_SETTING", "default_value")

    class Config:
        case_sensitive = True
        # If using Pydantic v1, use env_file = ".env"

settings = Settings()

