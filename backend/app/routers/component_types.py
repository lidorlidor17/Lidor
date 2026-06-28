"""
Component types router — Stage 2: expose DB catalog to frontend.
"""
from fastapi import APIRouter
from ..db_init import get_connection
from ..schemas.project import ComponentTypeResponse

router = APIRouter(prefix="/api/component-types", tags=["component-types"])


@router.get("", response_model=list[ComponentTypeResponse])
def list_component_types():
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, name, category, default_color, default_width, default_height "
            "FROM component_types ORDER BY rowid"
        ).fetchall()
        return [ComponentTypeResponse(**dict(r)) for r in rows]
