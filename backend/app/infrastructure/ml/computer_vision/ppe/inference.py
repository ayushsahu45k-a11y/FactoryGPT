import argparse
import json
import sys
from PIL import Image

from backend.app.infrastructure.ml.computer_vision.ppe.detector import PPEDetector

def run_image_inference_cli(image_path: str, save_output_json: bool = False) -> None:
    """
    Executes deep safety audit of raw target image from command-line.
    """
    print(f"[*] Parsing image at: {image_path}")
    try:
        image = Image.open(image_path)
    except Exception as e:
        print(f"[-] Failed to access or load image: {e}")
        sys.exit(1)

    detector = PPEDetector()
    result = detector.detect_frame(image)

    # Print human scannable terminal outputs
    print("\n" + "="*50)
    print("           FACTORYGPT SAFETY AUDIT LOGS           ")
    print("="*50)
    print(f"Compliance Signature : {result.compliance_status.value}")
    print(f"Total Humans Detected: {result.total_persons_detected}")
    print(f"Compliant Sub-Group  : {result.compliant_persons_count}")
    print("-"*50)
    
    for pa in result.person_analytics:
        print(f"[Person #{pa.person_id}] Status: {pa.status.value}")
        print(f"  └─ Helmet Wear Identified: {pa.has_helmet} (Conf: {pa.helmet_confidence})")
        print(f"  └─ Safety Vest Wear Identified: {pa.has_vest} (Conf: {pa.vest_confidence})")
    
    print("="*50 + "\n")

    if save_output_json:
        out_name = "audit_report.json"
        with open(out_name, "w") as f:
            # Serialize parsing schemas seamlessly using standard pydantic exports
            f.write(result.model_dump_json(indent=2))
        print(f"[+] Full audit profile telemetry successfully captured in: {out_name}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Standalone CLI Runner for Factory GPT PPE Detection")
    parser.add_argument("image", type=str, help="Local file path to target image file")
    parser.add_argument("--save", action="store_true", help="Store structured predictions into output JSON file")
    
    args = parser.parse_args()
    run_image_inference_cli(image_path=args.image, save_output_json=args.save)
