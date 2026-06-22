from typing import Any, Dict, Optional
from fastapi import HTTPException, status

class FactoryGPTException(Exception):
    """Base application exception for all FactoryGPT modules."""
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class EntityNotFoundException(FactoryGPTException):
    """Raised when requesting non-existent hardware or user profiles."""
    def __init__(self, message: str = "Requested entity could not be found.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND, details=details)


class AuthenticationFailedException(FactoryGPTException):
    """Raised when authentication credentials or tokens fail checks."""
    def __init__(self, message: str = "Invalid credentials or expired security session.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED, details=details)


class ActionForbiddenException(FactoryGPTException):
    """Raised when Role-Based Access Control asserts missing scope permissions."""
    def __init__(self, message: str = "Access denied: insufficient clearance.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN, details=details)


class OutOfBoundsTelemetryException(FactoryGPTException):
    """Raised when machine streams break structural validation schemas or calibration ranges."""
    def __init__(self, message: str = "Out of bounds telemetry thresholds encountered.", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST, details=details)
