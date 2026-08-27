"""OCR schema placeholder."""
from pydantic import BaseModel


class OCRResult(BaseModel):
    text: str = ""
