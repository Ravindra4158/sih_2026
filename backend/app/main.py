from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api.v1 import router as api_v1_router

app = FastAPI(
    title="AI Border Screening API",
    version="1.0.0",
    description="Asynchronous FastAPI backend orchestrating document screening micro‑services.",
    docs_url="/swagger",
    openapi_url="/openapi.json",
    redoc_url=None,
)

# Robust CORS allowing all origins, credentials, headers, and methods
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
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
