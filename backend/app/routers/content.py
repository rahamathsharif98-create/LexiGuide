"""Step 18: Content generation, curation, and capabilities API routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.utils.deps import get_current_user
from app.content.base import (
    ContentItemModel,
    ContentGenerationRequest,
    ContentGenerationResponse,
    ContentCapabilitiesResponse,
)
from app.content.service import content_service

router = APIRouter(prefix="/api/content", tags=["content"])


@router.get("/capabilities", response_model=ContentCapabilitiesResponse)
def get_capabilities():
    """Declares content capabilities and transparent AI status."""
    return content_service.get_capabilities()


@router.get("/library", response_model=List[ContentItemModel])
def list_library(
    skill: Optional[str] = Query(None),
    difficulty: Optional[int] = Query(None, ge=1, le=4),
    content_type: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    age: Optional[int] = Query(None, ge=4, le=10),
    current_user: User = Depends(get_current_user),
):
    """Lists curated and validated educational content items with optional filters."""
    return content_service.list_content_library(
        skill=skill,
        difficulty=difficulty,
        content_type=content_type,
        language=language,
        age=age,
    )


@router.post("/generate", response_model=ContentGenerationResponse)
def generate_content(
    payload: ContentGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Assembles or generates tailored educational content for a child.
    
    Protected by child access authorization, difficulty bounds, age safety,
    and comprehension consistency validation.
    """
    return content_service.generate_or_assemble_content(db, current_user, payload)


@router.get("/multimodal/{content_id}")
def get_content_multimodal(
    content_id: str,
    child_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Step 19: Multimodal presentation metadata for a specific content item."""
    from app.services.multimodal_service import multimodal_service
    from app.utils.authorization import assert_can_access_child

    effective_child_id = child_id
    if current_user.role == "child" and current_user.student:
        if child_id is not None and child_id != current_user.student.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Children can only access their own multimodal presentation.",
            )
        effective_child_id = current_user.student.id
    elif child_id is not None:
        assert_can_access_child(db, current_user, child_id)

    return multimodal_service.determine_presentation(
        db=db,
        content_id=content_id,
        child_id=effective_child_id,
    )


@router.get("/{content_id}", response_model=ContentItemModel)
def get_content_item(
    content_id: str,
    current_user: User = Depends(get_current_user),
):
    """Fetches a specific educational content item by its ID."""
    if content_id == "personalized":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Use /api/content/personalized endpoint")
    item = content_service.get_content_by_id(content_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Content item '{content_id}' not found.",
        )
    return item
