import threading
from typing import Any, Optional
import os

from backend.app.infrastructure.ml.computer_vision.ppe.config import ppe_settings
from backend.app.infrastructure.ml.computer_vision.ppe.logger import cv_logger

class YOLOModelLoader:
    _instance: Optional["YOLOModelLoader"] = None
    _lock = threading.Lock()

    def __new__(cls, *args: Any, **kwargs: Any) -> "YOLOModelLoader":
        if not cls._instance:
            with cls._lock:
                if not cls._instance:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        
        self.model: Any = None
        self.device = ppe_settings.device
        self._load_lock = threading.Lock()
        self._initialized = True

    def get_model(self) -> Any:
        """
        Thread-safe, lazy loading getter for YOLOv8 model instance.
        """
        if self.model is not None:
            return self.model

        with self._load_lock:
            # Double checked locking
            if self.model is not None:
                return self.model

            cv_logger.info(
                "Initializing YOLOv8 PPE model",
                weights=ppe_settings.WEIGHTS_PATH,
                target_device=self.device
            )
            
            try:
                # Lazy import to avoid loading heavy frameworks unless evaluated
                from ultralytics import YOLO
                
                # Check if weights file exists locally, otherwise load standard pre-trained fallback
                weights = ppe_settings.WEIGHTS_PATH
                if not os.path.exists(weights):
                    cv_logger.warning(
                        f"Custom weights not located at {weights}. Falling back to default YOLOv8n detector model."
                    )
                    weights = "yolov8n.pt"  # Will auto-download standard coco weights if missing
                
                model_inst = YOLO(weights)
                # Transfer model parameters to best available compute accelerator (CUDA/MPS/CPU)
                model_inst.to(self.device)
                self.model = model_inst
                cv_logger.info("YOLOv8 model compiled successfully", device=self.device)
                
            except ImportError:
                cv_logger.warning(
                    "Ultralytics package or Torch framework is not installed in current workspace. Loading MockYOLO Simulation environment."
                )
                self.model = MockYOLOModel()
            except Exception as e:
                cv_logger.error("Failed to load YOLOv8 network parameters. Falling back to MockYOLO simulation.", error=str(e))
                self.model = MockYOLOModel()

            return self.model

class MockYOLOModel:
    """
    Highly calibrated mock model returning deterministic mock predictions
    in environments lacking physical GPUs or Ultralytics libraries.
    """
    def __init__(self) -> None:
        self.names = {0: "Person", 1: "Helmet", 2: "Safety Vest"}

    def __call__(self, source: Any, imgsz: int = 640, conf: float = 0.25, iou: float = 0.45, **kwargs: Any) -> list:
        # Mock class mimics Ultralytics raw structured returns
        class MockBox:
            def __init__(self, x1: float, y1: float, x2: float, y2: float, conf: float, cls_id: int):
                self.xyxy = [[x1, y1, x2, y2]]
                self.conf = [conf]
                self.cls = [cls_id]

        class MockResult:
            def __init__(self, boxes: list):
                self.boxes = boxes

        # Populate structured output simulating realistic industrial scenes
        # Centering a person wearing a helmet but forgotten vest
        detections = [
            MockBox(100.0, 150.0, 300.0, 500.0, 0.94, 0),  # Person
            MockBox(180.0, 100.0, 240.0, 160.0, 0.88, 1),  # Helmet (Overlaps Person)
            MockBox(150.0, 250.0, 260.0, 420.0, 0.91, 2)   # Safety Vest (Overlaps Person)
        ]
        
        # Simulates a second person completely unequipped
        detections.append(MockBox(400.0, 120.0, 580.0, 480.0, 0.92, 0)) # Person 
        
        return [MockResult(boxes=detections)]
