from typing import Dict, Any, List, Union
import logging

logger = logging.getLogger("factory_gpt.predictive_maintenance.feature_engineering")

class PredictiveFeatureEngineer:
    """
    Handles robust algebraic feature engineering and statistical calculations
    from raw telemetry inputs (Temperature, Vibration, Pressure, Voltage, Current).
    Designed to process single dictionary entries or batch arrays.
    """

    @staticmethod
    def calculate_interaction_features(raw_data: Dict[str, float]) -> Dict[str, float]:
        """
        Derives critical physical interaction features from current telemetry logs:
        - Power (Voltage * Current)
        - Temperature-to-Pressure ratio
        - Vibration-to-Power ratio
        - Deviation from safety baseline values
        """
        temp = float(raw_data.get("temperature", 0.0))
        vib = float(raw_data.get("vibration", 0.0))
        press = float(raw_data.get("pressure", 0.0))
        voltage = float(raw_data.get("voltage", 0.0) or 0.0)
        current = float(raw_data.get("current", 0.0) or 0.0)

        # Operating Power (Watts) = Voltage * Current
        power = voltage * current

        # Avoid zero division
        temp_press_ratio = temp / max(press, 0.01)
        vib_power_ratio = vib / max(power, 0.01)

        # Baseline deviances (assuming common operational normal: temp=65C, press=5bar, vib=2.5mm/s)
        temp_deviation = max(0.0, temp - 65.0)
        vib_deviation = max(0.0, vib - 2.5)
        press_deviation = abs(press - 5.0)

        return {
            "temperature": temp,
            "vibration": vib,
            "pressure": press,
            "voltage": voltage,
            "current": current,
            "power": power,
            "temp_press_ratio": temp_press_ratio,
            "vib_power_ratio": vib_power_ratio,
            "temp_deviation": temp_deviation,
            "vib_deviation": vib_deviation,
            "press_deviation": press_deviation,
            "thermal_load": temp * max(power, 1.0)
        }

    def process_telemetry_snapshot(self, raw_data: Dict[str, float]) -> Dict[str, float]:
        """
        Transforms a single raw real-time streaming telemetry package.
        """
        try:
            return self.calculate_interaction_features(raw_data)
        except Exception as e:
            logger.error(f"Failed to engineer features for telemetry package: {e}")
            # Safe fallbacks mapping back to standard inputs
            return {
                **raw_data,
                "power": 0.0,
                "temp_press_ratio": 0.0,
                "vib_power_ratio": 0.0,
                "temp_deviation": 0.0,
                "vib_deviation": 0.0,
                "press_deviation": 0.0,
                "thermal_load": 0.0
            }

    def process_batch(self, batch_data: List[Dict[str, float]]) -> List[Dict[str, float]]:
        """
        Processes multi-record batches for industrial prediction arrays.
        """
        return [self.process_telemetry_snapshot(record) for record in batch_data]
