"""Part 1 & Phase 1: Child Profile, Interests, Comfort, and Multilingual Router."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User,
    UserRole,
    Student,
    Parent,
    ChildProfile,
    ChildInterest,
    ChildComfortPreference,
    LanguageProfile,
    LearningProfile,
)
from app.schemas.child_profile import (
    ChildProfileOut,
    ChildProfileCreate,
    ChildInterestOut,
    ChildInterestCreate,
    ChildComfortPreferenceOut,
    ChildComfortPreferenceCreate,
    LanguageProfileOut,
    LanguageProfileCreate,
    LearningProfileOut,
    CompleteChildSetupPayload,
)
from app.utils.deps import get_current_user, require_role
from app.utils.authorization import assert_can_access_child
from app.services import student_service

router = APIRouter(prefix="/api/children/{child_id}/profile", tags=["child-profile"])


@router.get("", response_model=ChildProfileOut)
def get_child_profile(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_can_access_child(db, current_user, child_id)
    student = student_service.get_student_or_404(db, child_id)
    profile = db.query(ChildProfile).filter(ChildProfile.student_id == child_id).first()
    if not profile:
        profile = ChildProfile(
            student_id=child_id,
            preferred_name=student.name,
            age=student.age,
            avatar=student.avatar or "🦊",
            mother_tongue="en",
            learning_languages=["en"],
            interface_language="en",
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("", response_model=ChildProfileOut)
def update_child_profile(
    child_id: int,
    payload: ChildProfileCreate,
    current_user: User = Depends(require_role(UserRole.parent, UserRole.teacher)),
    db: Session = Depends(get_db),
):
    assert_can_access_child(db, current_user, child_id)
    profile = db.query(ChildProfile).filter(ChildProfile.student_id == child_id).first()
    if not profile:
        profile = ChildProfile(student_id=child_id, preferred_name=payload.preferred_name)
        db.add(profile)

    profile.preferred_name = payload.preferred_name
    profile.age = payload.age
    profile.age_group = payload.age_group
    profile.grade = payload.grade
    profile.avatar = payload.avatar
    profile.mother_tongue = payload.mother_tongue
    profile.learning_languages = payload.learning_languages
    profile.interface_language = payload.interface_language

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/interests", response_model=ChildInterestOut)
def get_child_interests(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_can_access_child(db, current_user, child_id)
    interests = db.query(ChildInterest).filter(ChildInterest.student_id == child_id).first()
    if not interests:
        interests = ChildInterest(student_id=child_id, interest_categories=[])
        db.add(interests)
        db.commit()
        db.refresh(interests)
    return interests


@router.put("/interests", response_model=ChildInterestOut)
def update_child_interests(
    child_id: int,
    payload: ChildInterestCreate,
    current_user: User = Depends(require_role(UserRole.parent, UserRole.teacher, UserRole.child)),
    db: Session = Depends(get_db),
):
    assert_can_access_child(db, current_user, child_id)
    interests = db.query(ChildInterest).filter(ChildInterest.student_id == child_id).first()
    if not interests:
        interests = ChildInterest(student_id=child_id)
        db.add(interests)

    interests.interest_categories = payload.interest_categories
    interests.favorite_color = payload.favorite_color
    interests.favorite_animal = payload.favorite_animal
    interests.favorite_character = payload.favorite_character
    interests.favorite_music_style = payload.favorite_music_style

    db.commit()
    db.refresh(interests)
    return interests


@router.get("/comfort", response_model=ChildComfortPreferenceOut)
def get_comfort_preferences(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_can_access_child(db, current_user, child_id)
    pref = db.query(ChildComfortPreference).filter(ChildComfortPreference.student_id == child_id).first()
    if not pref:
        pref = ChildComfortPreference(student_id=child_id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


@router.put("/comfort", response_model=ChildComfortPreferenceOut)
def update_comfort_preferences(
    child_id: int,
    payload: ChildComfortPreferenceCreate,
    current_user: User = Depends(require_role(UserRole.parent, UserRole.teacher, UserRole.child)),
    db: Session = Depends(get_db),
):
    assert_can_access_child(db, current_user, child_id)
    pref = db.query(ChildComfortPreference).filter(ChildComfortPreference.student_id == child_id).first()
    if not pref:
        pref = ChildComfortPreference(student_id=child_id)
        db.add(pref)

    for field, val in payload.model_dump().items():
        setattr(pref, field, val)

    db.commit()
    db.refresh(pref)
    return pref


@router.get("/language", response_model=LanguageProfileOut)
def get_language_profile(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assert_can_access_child(db, current_user, child_id)
    lang = db.query(LanguageProfile).filter(LanguageProfile.student_id == child_id).first()
    if not lang:
        lang = LanguageProfile(student_id=child_id, enabled_languages=["en"])
        db.add(lang)
        db.commit()
        db.refresh(lang)
    return lang


@router.put("/language", response_model=LanguageProfileOut)
def update_language_profile(
    child_id: int,
    payload: LanguageProfileCreate,
    current_user: User = Depends(require_role(UserRole.parent, UserRole.teacher)),
    db: Session = Depends(get_db),
):
    assert_can_access_child(db, current_user, child_id)
    lang = db.query(LanguageProfile).filter(LanguageProfile.student_id == child_id).first()
    if not lang:
        lang = LanguageProfile(student_id=child_id)
        db.add(lang)

    lang.mother_tongue = payload.mother_tongue
    lang.support_language = payload.support_language
    lang.target_learning_language = payload.target_learning_language
    lang.interface_language = payload.interface_language
    lang.enabled_languages = payload.enabled_languages

    db.commit()
    db.refresh(lang)
    return lang


@router.get("/learning-profile", response_model=LearningProfileOut)
def get_learning_profile(
    child_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves the strictly evidence-based learning profile.
    Populated solely by performance data, never influenced by interests.
    """
    assert_can_access_child(db, current_user, child_id)
    learning_prof = db.query(LearningProfile).filter(LearningProfile.student_id == child_id).first()
    if not learning_prof:
        learning_prof = LearningProfile(student_id=child_id)
        db.add(learning_prof)
        db.commit()
        db.refresh(learning_prof)
    return learning_prof
