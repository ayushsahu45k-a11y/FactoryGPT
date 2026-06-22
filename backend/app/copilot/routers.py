from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.dependencies.db import get_async_session
from backend.app.dependencies.auth import verify_jwt_token, CurrentUser
from backend.app.copilot.schemas import CopilotQuerySchema, CopilotResponseSchema

copilot_router = APIRouter(prefix="/copilot", tags=["AI Natural Language Assistant & Commands"])

@copilot_router.post(
    "/prompt", 
    response_model=CopilotResponseSchema,
    summary="Submit query prompts to the intelligent factory assistant"
)
async def prompt_factory_copilot(
    payload: CopilotQuerySchema,
    session: AsyncSession = Depends(get_async_session),
    current_user: CurrentUser = Depends(verify_jwt_token)
):
    """Processes natural language operators queries to suggest telemetry metrics lookup or schedule maintenance."""
    pass
