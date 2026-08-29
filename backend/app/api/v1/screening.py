from fastapi import APIRouter, HTTPException
from ...models.request_models import ScreeningOrchestrateRequest
from ...models.response_models import ScreeningResponse
from ...services.orchestration_service import run_screening

router = APIRouter()

@router.post('/screening/orchestrate', response_model=ScreeningResponse)
async def orchestrate_screening(payload: ScreeningOrchestrateRequest):
    """Aggregate earlier step results and compute final decision.
    Relies on session data stored via SessionStore.
    """
    try:
        result = await run_screening(payload.session_id)
        return ScreeningResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
