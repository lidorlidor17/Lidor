import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.bess_site import BESSSite, BESSComponent
from ..schemas.bess_site import BESSComponentCreate, BESSComponentResponse

router = APIRouter(tags=["components"])


def _get_site_or_404(site_id: str, db: Session) -> BESSSite:
    site = db.query(BESSSite).filter(BESSSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site


@router.get("/sites/{site_id}/components", response_model=List[BESSComponentResponse])
def list_components(site_id: str, db: Session = Depends(get_db)):
    """List all components for a site."""
    _get_site_or_404(site_id, db)
    return (
        db.query(BESSComponent)
        .filter(BESSComponent.site_id == site_id)
        .order_by(BESSComponent.created_at)
        .all()
    )


@router.post(
    "/sites/{site_id}/components",
    response_model=BESSComponentResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_component(
    site_id: str, payload: BESSComponentCreate, db: Session = Depends(get_db)
):
    """Add a component to a site."""
    _get_site_or_404(site_id, db)
    now = datetime.utcnow()
    component = BESSComponent(
        id=str(uuid.uuid4()),
        site_id=site_id,
        component_type=payload.component_type,
        label=payload.label,
        x=payload.x,
        y=payload.y,
        width=payload.width,
        height=payload.height,
        rotation=payload.rotation,
        properties=payload.properties,
        created_at=now,
    )
    db.add(component)
    db.commit()
    db.refresh(component)
    return component


@router.put(
    "/sites/{site_id}/components/{comp_id}", response_model=BESSComponentResponse
)
def update_component(
    site_id: str,
    comp_id: str,
    payload: BESSComponentCreate,
    db: Session = Depends(get_db),
):
    """Update a component."""
    _get_site_or_404(site_id, db)
    component = (
        db.query(BESSComponent)
        .filter(BESSComponent.id == comp_id, BESSComponent.site_id == site_id)
        .first()
    )
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(component, field, value)

    db.commit()
    db.refresh(component)
    return component


@router.delete(
    "/sites/{site_id}/components/{comp_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_component(site_id: str, comp_id: str, db: Session = Depends(get_db)):
    """Delete a component from a site."""
    _get_site_or_404(site_id, db)
    component = (
        db.query(BESSComponent)
        .filter(BESSComponent.id == comp_id, BESSComponent.site_id == site_id)
        .first()
    )
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    db.delete(component)
    db.commit()


@router.post(
    "/sites/{site_id}/components/bulk",
    response_model=List[BESSComponentResponse],
    status_code=status.HTTP_200_OK,
)
def bulk_replace_components(
    site_id: str,
    payload: List[BESSComponentCreate],
    db: Session = Depends(get_db),
):
    """Replace all components for a site with the provided list."""
    _get_site_or_404(site_id, db)

    # Delete all existing components for the site
    db.query(BESSComponent).filter(BESSComponent.site_id == site_id).delete()

    now = datetime.utcnow()
    new_components = []
    for item in payload:
        component = BESSComponent(
            id=str(uuid.uuid4()),
            site_id=site_id,
            component_type=item.component_type,
            label=item.label,
            x=item.x,
            y=item.y,
            width=item.width,
            height=item.height,
            rotation=item.rotation,
            properties=item.properties,
            created_at=now,
        )
        db.add(component)
        new_components.append(component)

    db.commit()
    for c in new_components:
        db.refresh(c)
    return new_components
