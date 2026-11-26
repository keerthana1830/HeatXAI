import logging
import sys
import structlog

def setup_logging():
    """Configures structured logging using structlog."""
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            # Use ConsoleRenderer for TTY/interactive shell, JSONRenderer for production/logs
            structlog.processors.JSONRenderer() if not sys.stdout.isatty() else structlog.dev.ConsoleRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure root logger of the standard logging module
    handler = logging.StreamHandler(sys.stdout)
    root_logger = logging.getLogger()
    
    # Avoid duplicate logs by clearing existing handlers
    if root_logger.handlers:
        for h in root_logger.handlers:
            root_logger.removeHandler(h)
            
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)

# Expose a default logger instance
logger = structlog.get_logger("thermacity")
