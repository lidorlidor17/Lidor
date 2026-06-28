"""
Stage 1 backend tests.
Verifies: create project, place Battery Container, update position, delete, persistence.
"""
import os
import pytest
from fastapi.testclient import TestClient

# Use a per-test temp DB so tests are isolated
os.environ["SQLITE_DB_PATH"] = "./data/test_bess.db"

# Clean DB before import so TestClient sees a fresh state
if os.path.exists("./data/test_bess.db"):
    os.remove("./data/test_bess.db")

from app.main import app  # noqa: E402 — import after env var set

client = TestClient(app)

BATTERY_TYPE = "battery-container"


@pytest.fixture(autouse=True)
def fresh_db():
    """Each test runs against a clean DB."""
    db_path = os.environ["SQLITE_DB_PATH"]
    if os.path.exists(db_path):
        os.remove(db_path)
    # Re-run migrations for each test
    from app.db_init import run_migrations
    run_migrations()
    yield
    if os.path.exists(db_path):
        os.remove(db_path)


# ── helpers ──────────────────────────────────────────────────────────────────

def create_project(name="Test Site"):
    r = client.post("/api/projects", json={"name": name, "description": "Test"})
    assert r.status_code == 201, r.text
    return r.json()


def place_battery(project_id, x=100.0, y=200.0, name="Battery 1"):
    r = client.post(f"/api/projects/{project_id}/components", json={
        "component_type_id": BATTERY_TYPE,
        "name": name,
        "x": x,
        "y": y,
    })
    assert r.status_code == 201, r.text
    return r.json()


# ── tests ────────────────────────────────────────────────────────────────────

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_create_project():
    proj = create_project("Site Alpha")
    assert proj["name"] == "Site Alpha"
    assert "id" in proj


def test_list_projects_empty():
    r = client.get("/api/projects")
    assert r.status_code == 200
    assert r.json() == []


def test_list_projects_after_create():
    create_project("Site A")
    create_project("Site B")
    r = client.get("/api/projects")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_project_not_found():
    r = client.get("/api/projects/nonexistent-id")
    assert r.status_code == 404


def test_place_battery_container():
    proj = create_project()
    comp = place_battery(proj["id"], x=150.0, y=250.0)
    assert comp["component_type_id"] == BATTERY_TYPE
    assert comp["x"] == 150.0
    assert comp["y"] == 250.0
    assert comp["project_id"] == proj["id"]
    # width and height come from seed defaults
    assert comp["width"] == 235
    assert comp["height"] == 138


def test_battery_gets_default_field_values():
    proj = create_project()
    comp = place_battery(proj["id"])
    fv_keys = {fv["field_key"] for fv in comp["field_values"]}
    assert "capacityKWh" in fv_keys
    assert "nominalDcVoltage" in fv_keys
    assert "manufacturer" in fv_keys


def test_list_components_after_place():
    proj = create_project()
    place_battery(proj["id"], name="Bat-1")
    place_battery(proj["id"], name="Bat-2")
    r = client.get(f"/api/projects/{proj['id']}/components")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_update_position():
    proj = create_project()
    comp = place_battery(proj["id"], x=10.0, y=20.0)
    r = client.patch(f"/api/projects/{proj['id']}/components/{comp['id']}",
                     json={"x": 300.0, "y": 400.0})
    assert r.status_code == 200
    updated = r.json()
    assert updated["x"] == 300.0
    assert updated["y"] == 400.0


def test_delete_component():
    proj = create_project()
    comp = place_battery(proj["id"])
    r = client.delete(f"/api/projects/{proj['id']}/components/{comp['id']}")
    assert r.status_code == 204
    # should be gone
    r = client.get(f"/api/projects/{proj['id']}/components")
    assert r.json() == []


def test_persistence_across_requests():
    """Place a component, then verify it appears in a subsequent list call (simulates reload)."""
    proj = create_project()
    comp = place_battery(proj["id"], x=77.0, y=88.0, name="Persistent Battery")

    # Simulate page reload: fetch components fresh
    r = client.get(f"/api/projects/{proj['id']}/components")
    assert r.status_code == 200
    comps = r.json()
    assert len(comps) == 1
    assert comps[0]["id"] == comp["id"]
    assert comps[0]["x"] == 77.0
    assert comps[0]["y"] == 88.0
    assert comps[0]["name"] == "Persistent Battery"


def test_unknown_component_type_rejected():
    proj = create_project()
    r = client.post(f"/api/projects/{proj['id']}/components", json={
        "component_type_id": "nonexistent-type",
        "name": "X",
        "x": 0, "y": 0,
    })
    assert r.status_code == 400


def test_component_not_found_on_update():
    proj = create_project()
    r = client.patch(f"/api/projects/{proj['id']}/components/bad-id",
                     json={"x": 1.0, "y": 2.0})
    assert r.status_code == 404


def test_component_not_found_on_delete():
    proj = create_project()
    r = client.delete(f"/api/projects/{proj['id']}/components/bad-id")
    assert r.status_code == 404
