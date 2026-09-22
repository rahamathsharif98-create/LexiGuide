"""Step 19: Multimodal Presentation and Capability Routes."""
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.utils.deps import get_current_user
from app.utils.authorization import assert_can_access_child
from app.schemas.multimodal import (
    MultimodalCapabilityStatus,
    MultimodalPresentationResponse,
)
from app.services.multimodal_service import multimodal_service

router = APIRouter(prefix="/api/multimodal", tags=["multimodal"])


@router.get("/capabilities", response_model=MultimodalCapabilityStatus)
def get_capabilities():
    """Declares transparent multimodal capabilities, distinguishing Real, Mock,
    and Unavailable states without fabricating AI functionality.
    """
    return multimodal_service.get_capabilities()


@router.get("/presentation/{content_id}", response_model=MultimodalPresentationResponse)
def get_presentation(
    content_id: str,
    child_id: Optional[int] = Query(None, description="Target child ID for personalized support"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Determines appropriate multimodal presentation modes, support level,
    and scaffolding for a given content item and learner.
    
    Protected by role-based authorization: parents only access their children,
    teachers only access assigned students, children only access themselves.
    """
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
