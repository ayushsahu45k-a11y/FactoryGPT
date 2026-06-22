from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config.settings import settings
from backend.app.middleware.logging_middleware import AccessTraceMiddleware
from backend.app.dependencies.redis_client import RedisConnectionManager
from backend.app.exceptions.custom_exceptions import FactoryGPTException

# Sub-Module Router Imports
from backend.app.auth.routers import auth_router
from backend.app.safety_monitoring.routers import safety_router
from backend.app.predictive_maintenance.routers import maintenance_router
from backend.app.alerts.routers import alerts_router
from backend.app.reports.routers import reports_router
from backend.app.dashboard.routers import dashboard_router
from backend.app.analytics.routers import analytics_router
from backend.app.digital_twin.routers import digital_twin_router
from backend.app.copilot.routers import copilot_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles container startup initialization and shutdown pooling cleanup schedules cleanly."""
    # Lazily pre-warm connection locks on boot
    RedisConnectionManager.get_client()
    yield
    # Shutdown safely on signals
    await RedisConnectionManager.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    lifespan=lifespan
)

# 1. CORS Policy Rules Enforcement
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Add Trace, Logging, and Timing Core Midware
app.add_middleware(AccessTraceMiddleware)

# 3. Dynamic Sub-Module Routing Registries
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(safety_router, prefix=settings.API_PREFIX)
app.include_router(maintenance_router, prefix=settings.API_PREFIX)
app.include_router(alerts_router, prefix=settings.API_PREFIX)
app.include_router(reports_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)
app.include_router(digital_twin_router, prefix=settings.API_PREFIX)
app.include_router(copilot_router, prefix=settings.API_PREFIX)

# 4. Centralized Custom Application Error Exception Catchers
@app.exception_handler(FactoryGPTException)
async def custom_application_error_handler(request: Request, exc: FactoryGPTException):
    """Converts high-level structured application errors cleanly to JSON messages."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_summary": exc.message,
            "error_details": exc.details,
            "trace_id": getattr(request.state, "trace_id", "untracked")
        }
    )

@app.get("/health", tags=["Diagnostic Checks"])
async def platform_health_check_endpoint():
    """Provides automated status checks for monitoring loops."""
    return {
        "status": "healthy",
        "service": "factory_gpt_core_api",
        "version": settings.VERSION
    }
