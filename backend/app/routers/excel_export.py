from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.bess_site import BESSSite, BESSComponent
from ..services.excel_generator import generate_bess_excel

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/excel/{site_id}")
def export_excel(site_id: str, db: Session = Depends(get_db)):
    """Export a BESS site as a comprehensive Excel workbook (.xlsx)."""
    site = db.query(BESSSite).filter(BESSSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    components = (
        db.query(BESSComponent)
        .filter(BESSComponent.site_id == site_id)
        .order_by(BESSComponent.created_at)
        .all()
    )

    site_data = {
        "name": site.name,
        "location": site.location or "",
        "description": site.description or "",
        "target_capacity_mwh": site.target_capacity_mwh or 0,
        "target_power_mw": site.target_power_mw or 0,
        "site_area_m2": site.site_area_m2 or 0,
    }

    comp_list = [
        {
            "component_type": c.component_type,
            "label": c.label or "",
            "properties": c.properties or {},
        }
        for c in components
    ]

    excel_bytes = generate_bess_excel(site_data, comp_list)

    safe_name = "".join(
        ch if ch.isalnum() or ch in "-_ " else "_" for ch in site.name
    ).strip()
    filename = f"BESS_{safe_name}_{site_id[:8]}.xlsx"

    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
