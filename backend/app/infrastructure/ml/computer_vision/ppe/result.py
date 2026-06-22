from typing import List, Tuple, Optional
from backend.app.infrastructure.ml.computer_vision.ppe.schemas import (
    DetectionItem,
    PersonAnalysis,
    BatchFrameResult,
    ComplianceStatus,
    BoundingBox
)

def compute_containment_ratio(target_box: BoundingBox, person_box: BoundingBox) -> float:
    """
    Computes portion of target_box (like helmet) that falls within person_box.
    Highly robust benchmark metric for localized PPE mappings.
    """
    xA = max(target_box.x1, person_box.x1)
    yA = max(target_box.y1, person_box.y1)
    xB = min(target_box.x2, person_box.x2)
    yB = min(target_box.y2, person_box.y2)

    inter_width = max(0.0, xB - xA)
    inter_height = max(0.0, yB - yA)
    intersection_area = inter_width * inter_height

    target_area = (target_box.x2 - target_box.x1) * (target_box.y2 - target_box.y1)
    if target_area <= 0.0:
        return 0.0

    return intersection_area / target_area

def compile_compliance_report(detections: List[DetectionItem], frame_index: int = 0) -> BatchFrameResult:
    """
    Resolves topological associations between people and equipment bounding boxes.
    Outputs strict safety scoring profiles based on intersection characteristics.
    """
    # 1. Segregate anchors
    persons = [d for d in detections if d.name == "Person"]
    helmets = [d for d in detections if d.name == "Helmet"]
    vests = [d for d in detections if d.name == "Safety Vest"]

    person_analytics: List[PersonAnalysis] = []
    
    # 2. Iterate through each person anchoring element
    # Use intersection indices to prevent multiple assignment of singular asset flags
    assigned_helmets = set()
    assigned_vests = set()

    for idx, p in enumerate(persons):
        best_helmet: Optional[DetectionItem] = None
        best_helmet_score = 0.5  # Min containment ratio to consider true overlap
        
        for h_idx, h in enumerate(helmets):
            if h_idx in assigned_helmets:
                continue
            ratio = compute_containment_ratio(h.box, p.box)
            if ratio > best_helmet_score:
                best_helmet = h
                best_helmet_score = ratio

        best_vest: Optional[DetectionItem] = None
        best_vest_score = 0.4  # Vest overlaps are occasionally skewed at bounds
        
        for v_idx, v in enumerate(vests):
            if v_idx in assigned_vests:
                continue
            ratio = compute_containment_ratio(v.box, p.box)
            if ratio > best_vest_score:
                best_vest = v
                best_vest_score = ratio

        # Log associated detections to avoid double counts on crowd intersections
        if best_helmet:
            assigned_helmets.add(helmets.index(best_helmet))
        if best_vest:
            assigned_vests.add(vests.index(best_vest))

        has_h = best_helmet is not None
        has_v = best_vest is not None

        # Compliance categorization
        if has_h and has_v:
            status = ComplianceStatus.FULLY_COMPLIANT
        elif has_h or has_v:
            status = ComplianceStatus.PARTIAL
        else:
            status = ComplianceStatus.NON_COMPLIANT

        person_analytics.append(
            PersonAnalysis(
                person_id=idx + 1,
                box=p.box,
                has_helmet=has_h,
                has_vest=has_v,
                helmet_confidence=best_helmet.confidence if best_helmet else None,
                vest_confidence=best_vest.confidence if best_vest else None,
                status=status
            )
        )

    # Calculate overarching safety metrics
    total_persons = len(persons)
    if total_persons == 0:
        frame_status = ComplianceStatus.NO_PERSON
        compliant_count = 0
    else:
        compliant_count = sum(1 for pa in person_analytics if pa.status == ComplianceStatus.FULLY_COMPLIANT)
        partial_count = sum(1 for pa in person_analytics if pa.status == ComplianceStatus.PARTIAL)
        non_compliant_count = sum(1 for pa in person_analytics if pa.status == ComplianceStatus.NON_COMPLIANT)

        if compliant_count == total_persons:
            frame_status = ComplianceStatus.FULLY_COMPLIANT
        elif non_compliant_count > 0 or partial_count > 0:
            frame_status = ComplianceStatus.PARTIAL if compliant_count > 0 else ComplianceStatus.NON_COMPLIANT
        else:
            frame_status = ComplianceStatus.NON_COMPLIANT

    return BatchFrameResult(
        frame_index=frame_index,
        compliance_status=frame_status,
        total_persons_detected=total_persons,
        compliant_persons_count=compliant_count,
        detections=detections,
        person_analytics=person_analytics
    )
