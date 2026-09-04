FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Runtime libraries for OpenCV, EasyOCR/PyTorch, Tesseract, PDF rendering, and
# ZBar. Build tools are retained because some image dependencies may compile
# on slim images.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    libsm6 \
    libxext6 \
    tesseract-ocr \
    tesseract-ocr-eng \
    libzbar0 \
    && rm -rf /var/lib/apt/lists/*

# Install CPU-only PyTorch before EasyOCR so Docker does not download CUDA
# wheels.
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY backend/ ./backend/
COPY models/ ./models/

# Uploads are staged in the system temp directory. Run the API without root.
RUN useradd --create-home --uid 10001 appuser \
    && mkdir -p /tmp/ai-border-screening-uploads \
    && chown -R appuser:appuser /app /tmp/ai-border-screening-uploads

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "from urllib.request import urlopen; urlopen('http://127.0.0.1:8000/openapi.json', timeout=3)" || exit 1

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
