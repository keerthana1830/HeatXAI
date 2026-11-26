# pyrefly: ignore [missing-import]
from celery import Celery
from app.core.config import settings
from app.core.logging import logger

# Initialize Celery app instance (configured to run on local Redis by default)
celery_app = Celery("tasks", broker=settings.redis_url, backend=settings.redis_url)

# Local fallback configuration: Run tasks synchronously inside the main thread (eager mode)
# to avoid requiring a running Redis daemon locally.
celery_app.conf.update(
    task_always_eager=True,
    task_eager_propagates=True,
)

logger.info("Celery configured in eager (synchronous) execution mode.")
