# Coding Standards - Urban Heat Intelligence Platform

## Backend (FastAPI)
- **Type Hints**: All function signatures, variable declarations, and return types must be fully typed.
- **Docstrings**: All classes, modules, and public functions must have descriptive docstrings explaining their purpose, parameters, and return values.
- **Structured Logging**: Use structured logging (e.g., standard library logging configured for JSON output, or loguru/structlog) rather than simple print statements, ensuring metadata like request IDs, timestamps, and error contexts are captured.
- **Repository Pattern**: Database operations must be isolated inside repository classes/modules to decouple database access from business logic.
- **Pydantic Settings**: Use `pydantic-settings` to manage application configuration and validate environment variables.
- **Database**: Use Postgres with PostGIS extension for spatial queries, and SQLAlchemy/SQLModel for ORM. Redis for celery broker/caching.
- **Mockable Adapters**: Every external service integration (Google Earth Engine, ERA5-Land, OSM/OSMnx) must be wrapped in an isolated adapter class implementing a clean interface, allowing it to be easily mocked or swapped later.

## Frontend (React/Vite/TypeScript)
- **Framework**: React with Vite and TypeScript.
- **Styling**: Vanilla CSS or Tailwind CSS (per user instruction, Tailwind + shadcn is specified for Phase 1).
- **Component Design**: Modular, reusable components with distinct responsibilities. Use shadcn/ui components where applicable.
- **TypeScript**: Strict type check, no `any` types. Define clear interfaces for all component props and API responses.
- **Visual Aesthetics**: Premium design matching the guidelines (glassmorphism, vibrant palettes, dark/light modes, animations, skeleton loaders, toasts).

## Configuration & Security
- **No Secrets**: Never hardcode API keys, passwords, private keys, or credentials.
- **Environment Variables**: Everything must be configured via environment variables.
- **Environment Template**: Provide a complete `.env.example` showing all required configuration parameters without actual values.
