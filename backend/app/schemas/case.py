"""Case schema placeholder."""
from pydantic import BaseModel


class CaseReference(BaseModel):
    case_id: str
