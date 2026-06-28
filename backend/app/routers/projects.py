"""
Stage-1 CRUD router: projects and components.
Uses raw SQLite via db_init.get_connection() — no SQLAlchemy ORM.
"""
import uuid
from fastapi import APIRouter, HTTPException
from ..db_init import get_connection
from ..schemas.project import (
    ProjectCreate, ProjectResponse,
    ComponentCreate, ComponentPositionUpdate, ComponentResponse, FieldValue,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


# ── helpers ──────────────────────────────────────────────────────────────────

def _require_project(conn, project_id: str):
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return row


def _require_component(conn, project_id: str, comp_id: str):
    row = conn.execute(
        "SELECT * FROM components WHERE id = ? AND project_id = ?", (comp_id, project_id)
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Component not found")
    return row


def _component_type_defaults(conn, type_id: str):
    row = conn.execute(
        "SELECT default_width, default_height FROM component_types WHERE id = ?", (type_id,)
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=400, detail=f"Unknown component_type_id: {type_id}")
    return row["default_width"], row["default_height"]


def _load_field_values(conn, comp_id: str) -> list[FieldValue]:
    rows = conn.execute("""
        SELECT cfv.field_key, cfv.value, ctf.label, ctf.unit
        FROM component_field_values cfv
        JOIN components c ON c.id = cfv.component_id
        JOIN component_type_fields ctf
            ON ctf.component_type_id = c.component_type_id
            AND ctf.field_key = cfv.field_key
        WHERE cfv.component_id = ?
        ORDER BY ctf.display_order
    """, (comp_id,)).fetchall()
    return [FieldValue(field_key=r["field_key"], value=r["value"],
                       label=r["label"], unit=r["unit"]) for r in rows]


def _seed_field_values(conn, comp_id: str, type_id: str):
    """Insert default field values for a newly created component."""
    fields = conn.execute(
        "SELECT field_key, default_value FROM component_type_fields "
        "WHERE component_type_id = ? ORDER BY display_order",
        (type_id,)
    ).fetchall()
    for f in fields:
        conn.execute(
            "INSERT INTO component_field_values (component_id, field_key, value) VALUES (?, ?, ?)",
            (comp_id, f["field_key"], f["default_value"])
        )


def _row_to_component(conn, row) -> ComponentResponse:
    fvs = _load_field_values(conn, row["id"])
    return ComponentResponse(
        id=row["id"],
        project_id=row["project_id"],
        component_type_id=row["component_type_id"],
        name=row["name"],
        x=row["x"],
        y=row["y"],
        width=row["width"],
        height=row["height"],
        rotation=row["rotation"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        field_values=fvs,
    )


# ── projects ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[ProjectResponse])
def list_projects():
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM projects ORDER BY created_at DESC"
        ).fetchall()
        return [ProjectResponse(**dict(r)) for r in rows]


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(body: ProjectCreate):
    pid = str(uuid.uuid4())
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO projects (id, name, description) VALUES (?, ?, ?)",
            (pid, body.name, body.description)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM projects WHERE id = ?", (pid,)).fetchone()
        return ProjectResponse(**dict(row))


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: str):
    with get_connection() as conn:
        row = _require_project(conn, project_id)
        return ProjectResponse(**dict(row))


# ── components ────────────────────────────────────────────────────────────────

@router.get("/{project_id}/components", response_model=list[ComponentResponse])
def list_components(project_id: str):
    with get_connection() as conn:
        _require_project(conn, project_id)
        rows = conn.execute(
            "SELECT * FROM components WHERE project_id = ? AND parent_component_id IS NULL "
            "ORDER BY created_at",
            (project_id,)
        ).fetchall()
        return [_row_to_component(conn, r) for r in rows]


@router.post("/{project_id}/components", response_model=ComponentResponse, status_code=201)
def create_component(project_id: str, body: ComponentCreate):
    with get_connection() as conn:
        _require_project(conn, project_id)
        default_w, default_h = _component_type_defaults(conn, body.component_type_id)
        comp_id = str(uuid.uuid4())
        conn.execute("""
            INSERT INTO components
                (id, project_id, component_type_id, name, x, y, width, height)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            comp_id, project_id, body.component_type_id, body.name,
            body.x, body.y,
            body.width if body.width is not None else default_w,
            body.height if body.height is not None else default_h,
        ))
        _seed_field_values(conn, comp_id, body.component_type_id)
        conn.commit()
        row = conn.execute("SELECT * FROM components WHERE id = ?", (comp_id,)).fetchone()
        return _row_to_component(conn, row)


@router.patch("/{project_id}/components/{comp_id}", response_model=ComponentResponse)
def update_component_position(project_id: str, comp_id: str, body: ComponentPositionUpdate):
    with get_connection() as conn:
        _require_component(conn, project_id, comp_id)
        conn.execute(
            "UPDATE components SET x = ?, y = ?, updated_at = datetime('now') WHERE id = ?",
            (body.x, body.y, comp_id)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM components WHERE id = ?", (comp_id,)).fetchone()
        return _row_to_component(conn, row)


@router.delete("/{project_id}/components/{comp_id}", status_code=204)
def delete_component(project_id: str, comp_id: str):
    with get_connection() as conn:
        _require_component(conn, project_id, comp_id)
        conn.execute("DELETE FROM components WHERE id = ?", (comp_id,))
        conn.commit()
