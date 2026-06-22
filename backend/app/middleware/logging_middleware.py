import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
import logging

# Standardize platform hardware console logging formats
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("factory_gpt.gateway")

class AccessTraceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Injects performance audits and request tracing parameters across all incoming endpoints."""
        start_time = time.perf_counter()
        trace_id = request.headers.get("X-Trace-ID", str(uuid.uuid4()))
        
        # Inject tracing tags structurally for background contexts
        request.state.trace_id = trace_id
        
        try:
            response = await call_next(request)
        except Exception as exc:
            logger.error(f"[Gateway Trace Exception] ID: {trace_id} | Path: {request.url.path} | Fail: {str(exc)}")
            raise exc
            
        process_time_ms = (time.perf_counter() - start_time) * 1000.0
        response.headers["X-Trace-ID"] = trace_id
        response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"
        
        logger.info(
            f"[API Gateway] Trace: {trace_id} | Route: {request.method} {request.url.path} "
            f"| Status: {response.status_code} | Duration: {process_time_ms:.2f}ms"
        )
        return response
