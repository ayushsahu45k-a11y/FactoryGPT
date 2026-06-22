import numpy as np
from PIL import Image
from typing import Union, List, Any
import io

from backend.app.infrastructure.ml.computer_vision.ppe.config import ppe_settings
from backend.app.infrastructure.ml.computer_vision.ppe.model import YOLOModelLoader
from backend.app.infrastructure.ml.computer_vision.ppe.schemas import DetectionItem, BoundingBox, BatchFrameResult
from backend.app.infrastructure.ml.computer_vision.ppe.result import compile_compliance_report
from backend.app.infrastructure.ml.computer_vision.ppe.logger import cv_logger

class PPEDetector:
    def __init__(self) -> None:
        self.model_loader = YOLOModelLoader()

    def _convert_source(self, source: Union[str, bytes, Image.Image, np.ndarray]) -> Any:
        """
        Coerces different media formats safely into formats readable by YOLOv8.
        """
        if isinstance(source, bytes):
            return Image.open(io.BytesIO(source))
        return source

    def detect_frame(self, source: Union[str, bytes, Image.Image, np.ndarray], frame_index: int = 0) -> BatchFrameResult:
        """
        Executes active model prediction over single input item and compiles compliance metrics.
        """
        model = self.model_loader.get_model()
        input_img = self._convert_source(source)

        cv_logger.info("Starting frame inference execution", frame_index=frame_index)

        # Run inference using configured parameters
        results = model(
            input_img,
            imgsz=ppe_settings.IMAGE_SIZE,
            conf=ppe_settings.CONF_THRESHOLD,
            iou=ppe_settings.IOU_THRESHOLD
        )

        detections: List[DetectionItem] = []
        
        if results and len(results) > 0:
            raw_result = results[0]
            if hasattr(raw_result, "boxes"):
                for box_item in raw_result.boxes:
                    # Coerce multi-dimensional PyTorch tensors safely into CPU float coordinates
                    coords = box_item.xyxy[0]
                    if hasattr(coords, "tolist"):
                        x1, y1, x2, y2 = coords.tolist()
                    else:
                        x1, y1, x2, y2 = coords
                    
                    raw_conf = box_item.conf[0]
                    conf = float(raw_conf.tolist() if hasattr(raw_conf, "tolist") else raw_conf)
                    
                    raw_cls = box_item.cls[0]
                    class_id = int(raw_cls.tolist() if hasattr(raw_cls, "tolist") else raw_cls)
                    
                    # Look up class identifier mapping cleanly
                    label = ppe_settings.CLASS_MAPPINGS.get(class_id, "Unknown")

                    detections.append(
                        DetectionItem(
                            class_id=class_id,
                            name=label,
                            confidence=conf,
                            box=BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2)
                        )
                    )

        # Map person boxes against protection asset overlays
        return compile_compliance_report(detections, frame_index=frame_index)

    def detect_batch(self, sources: List[Union[str, bytes, Image.Image, np.ndarray]]) -> List[BatchFrameResult]:
        """
        Handles batch evaluation cycles over multiple sources under parallel vector executions.
        """
        cv_logger.info("Executing batch inference session", batch_size=len(sources))
        results: List[BatchFrameResult] = []
        for index, src in enumerate(sources):
            frame_res = self.detect_frame(src, frame_index=index)
            results.append(frame_res)
        return results
