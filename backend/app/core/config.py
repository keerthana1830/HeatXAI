from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application settings and environment validation using Pydantic Settings."""
    
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # MongoDB Settings
    MONGODB_URL: str = "mongodb://localhost:27017/thermacity"

    # Redis Settings
    REDIS_HOST: str = "127.0.0.1"
    REDIS_PORT: int = 6379

    # Security Settings
    SECRET_KEY: str = "super_secret_jwt_signing_key_change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Google Earth Engine Settings
    GEE_SERVICE_ACCOUNT_EMAIL: str = ""
    GEE_SERVICE_ACCOUNT_KEY: str = ""



    @property
    def redis_url(self) -> str:
        """Returns the Redis connection URL."""
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

# Instantiate settings
settings = Settings()
