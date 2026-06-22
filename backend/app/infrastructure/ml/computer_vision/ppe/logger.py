import logging
import json
import sys
from datetime import datetime, timezone
from typing import Any, Dict

class StructLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        if not self.logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(logging.Formatter("%(message)s"))
            self.logger.addHandler(handler)

    def _log(self, level: str, msg: str, extra: Dict[str, Any] = None) -> None:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level,
            "message": msg,
            "context": extra or {}
        }
        self.logger.info(json.dumps(payload))

    def info(self, msg: str, **kwargs: Any) -> None:
        self._log("INFO", msg, kwargs)

    def warning(self, msg: str, **kwargs: Any) -> None:
        self._log("WARNING", msg, kwargs)

    def error(self, msg: str, **kwargs: Any) -> None:
        self._log("ERROR", msg, kwargs)

cv_logger = StructLogger("factorygpt.cv.ppe")
