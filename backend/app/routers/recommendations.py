from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas.recommendation import RecommendationOut
from app.schemas.adaptive import LearningProfileOut, NextActivityOut, LearningPathOut, SpacedPracticeItemOut
from app.schemas.next_best_action import NextBestActionResponse
from app.services import student_service, recommendation_service, next_best_action_service
from app.services.adaptive_learning_service import AdaptiveLearningEngine
from app.utils.deps import get_current_user
from app.utils.authorization import assert_can_access_child
from app.utils.language import DISCLAIMER

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


# ----------------------------------------------------------------------
# Step 15 — Next-Best-Action Recommendation Engine endpoints
# ----------------------------------------------------------------------

@router.get("/next-best-action", response_model=NextBestActionResponse)
def get_next_best_action_query(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Query parameter version: GET /api/recommendations/next-best-action?child_id={child_id}"""
    return get_next_best_action(child_id, current_user, db)


@router.get("/next-best-action/{child_id}", response_model=NextBestActionResponse)
def get_next_best_action(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Step 15: Authoritative Intelligent Next-Best-Action Recommendation.
    Determines the single best next learning activity, ranked alternatives,
    and child-friendly educational rationale based on real persisted data.
    """
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    return next_best_action_service.determine_next_best_action(db, child_id)


# ----------------------------------------------------------------------
# Phase 9 — Adaptive Learning Engine endpoints. Registered BEFORE the
# "/{child_id}" catch-all below so "/next/5", "/profile/5", "/path/5" and
# "/spaced-practice/5" resolve to these routes rather than being parsed as
# a (non-numeric) child_id by the older endpoint.
# ----------------------------------------------------------------------

@router.get("/next", response_model=NextActivityOut)
def get_next_activity_query(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Query parameter version: GET /api/recommendations/next?child_id={child_id}"""
    return get_next_activity(child_id, current_user, db)


@router.get("/next/{child_id}", response_model=NextActivityOut)
def get_next_activity(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """"What should this child practice next?" — STEP 7. Always explainable:
    every field traces back to real stored fingerprint/session history.
    """
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    engine = AdaptiveLearningEngine(db, child_id)
    return engine.generate_next_activity()


@router.get("/profile/{child_id}", response_model=LearningProfileOut)
def get_learning_profile(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """The full per-skill learning profile — STEP 2/3: current level,
    historical performance, trend, consistency, detected pattern, and
    derived difficulty for every tracked skill.
    """
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    engine = AdaptiveLearningEngine(db, child_id)
    profile = engine.analyze_learning_profile()

    skills_list = [p.to_dict() for p in profile.values()]
    total_sessions = sum(p.attempts for p in profile.values())

    if total_sessions == 0:
        data_sufficiency = "insufficient_data"
    elif total_sessions < 3:
        data_sufficiency = "developing_data"
    else:
        data_sufficiency = "sufficient"

    ordered = engine.determine_skill_priority(profile)
    priority_skill = ordered[0].label if ordered else None

    # Strongest skill: highest level/recent performance
    strongest_candidates = sorted(
        profile.values(),
        key=lambda p: (p.current_level, p.recent_performance or 0),
        reverse=True
    )
    strongest_skill = strongest_candidates[0].label if strongest_candidates else None

    return {
        "student_id": child_id,
        "skills": skills_list,
        "disclaimer": DISCLAIMER,
        "data_sufficiency": data_sufficiency,
        "total_sessions": total_sessions,
        "priority_skill": priority_skill,
        "strongest_skill": strongest_skill,
    }


@router.get("/path", response_model=LearningPathOut)
def get_learning_path_query(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Query parameter version: GET /api/recommendations/path?child_id={child_id}"""
    return get_learning_path(child_id, current_user, db)


@router.get("/path/{child_id}", response_model=LearningPathOut)
def get_learning_path(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """The child's personalized, priority-ordered learning path — STEP 6."""
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    engine = AdaptiveLearningEngine(db, child_id)
    return {
        "student_id": child_id,
        "path": engine.generate_learning_path(),
        "disclaimer": DISCLAIMER,
    }


@router.get("/spaced-practice", response_model=list[SpacedPracticeItemOut])
def get_spaced_practice_query(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Query parameter version: GET /api/recommendations/spaced-practice?child_id={child_id}"""
    return get_spaced_practice(child_id, current_user, db)


@router.get("/spaced-practice/{child_id}", response_model=list[SpacedPracticeItemOut])
def get_spaced_practice(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Skills due for a review because they haven't been practiced
    recently — STEP 8.
    """
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    engine = AdaptiveLearningEngine(db, child_id)
    return engine.spaced_practice_candidates()


@router.get("/{child_id}", response_model=list[RecommendationOut])
def get_recommendations(child_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assert_can_access_child(db, current_user, child_id)
    student_service.get_student_or_404(db, child_id)
    rows = recommendation_service.list_recommendations_for_student(db, child_id)
    return [{
        "id": r.id, "student_id": r.student_id, "activity_id": r.activity_id,
        "activity_name": r.activity.name if r.activity else None,
        "reason": r.reason, "priority": r.priority, "created_at": r.created_at,
    } for r in rows]
