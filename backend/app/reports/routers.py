from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.dependencies.db import get_async_session
from backend.app.dependencies.auth import RoleChecker, CurrentUser
from backend.app.reports.schemas import ReportRequestSchema, ReportResponseSchema

reports_router = APIRouter(prefix="/reports", tags=["Exportable Compliance Documentation"])

@reports_router.get(
    "/historical", 
    response_model=List[ReportResponseSchema],
    summary="List all ready, compiled compliance reports"
)
async def list_historic_facility_reports(
    session: AsyncSession = Depends(get_async_session),
    current_user: CurrentUser = Depends(RoleChecker(["admin", "engineer"]))
):
    """Provides file pointers to historical operator and safety checklists."""
    pass

@reports_router.post(
    "/generate", 
    response_model=ReportResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Trigger the compilation of a new compliance document"
)
async def compile_new_report(
    payload: ReportRequestSchema,
    session: AsyncSession = Depends(get_async_session),
    current_user: CurrentUser = Depends(RoleChecker(["admin", "engineer"]))
):
    """Launches analytical sweep functions, creating static PDF/CSV records on active cloud files."""
    pass
