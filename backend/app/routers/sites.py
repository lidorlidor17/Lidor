import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.bess_site import BESSSite
from ..schemas.bess_site import BESSSiteCreate, BESSSiteUpdate, BESSSiteResponse

router = APIRouter(tags=["sites"])


@router.get("/sites", response_model=List[BESSSiteResponse])
def list_sites(db: Session = Depends(get_db)):
    """List all BESS sites."""
    return db.query(BESSSite).order_by(BESSSite.created_at.desc()).all()


@router.post("/sites", response_model=BESSSiteResponse, status_code=status.HTTP_201_CREATED)
def create_site(payload: BESSSiteCreate, db: Session = Depends(get_db)):
    """Create a new BESS site."""
    now = datetime.utcnow()
    site = BESSSite(
        id=str(uuid.uuid4()),
        name=payload.name,
        description=payload.description,
        location=payload.location,
        target_capacity_mwh=payload.target_capacity_mwh,
        target_power_mw=payload.target_power_mw,
        created_at=now,
        updated_at=now,
    )
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


@router.get("/sites/{site_id}", response_model=BESSSiteResponse)
def get_site(site_id: str, db: Session = Depends(get_db)):
    """Get a single BESS site by ID."""
    site = db.query(BESSSite).filter(BESSSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site


@router.put("/sites/{site_id}", response_model=BESSSiteResponse)
def update_site(site_id: str, payload: BESSSiteUpdate, db: Session = Depends(get_db)):
    """Update an existing BESS site."""
    site = db.query(BESSSite).filter(BESSSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(site, field, value)
    site.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(site)
    return site


@router.delete("/sites/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(site_id: str, db: Session = Depends(get_db)):
    """Delete a BESS site and all its components."""
    site = db.query(BESSSite).filter(BESSSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    db.delete(site)
    db.commit()


@router.put("/sites/{site_id}/drawing", response_model=BESSSiteResponse)
def update_drawing(site_id: str, payload: dict, db: Session = Depends(get_db)):
    """Update only the drawing_data for a BESS site."""
    site = db.query(BESSSite).filter(BESSSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    site.drawing_data = payload
    site.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(site)
    return site
