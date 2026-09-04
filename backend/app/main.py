from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.v1 import router as api_v1_router
from .config.settings import settings

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Asynchronous FastAPI backend orchestrating document screening micro‑services.",
    docs_url="/swagger",
    openapi_url="/openapi.json",
    redoc_url=None,
)

# VerifyDoc is normally served on the same origin as the API. The explicit
# allowlist retains local Vite development without exposing credentialed API
# access to arbitrary websites.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(api_v1_router, prefix="/api/v1")

# Global exception handler example
@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )
