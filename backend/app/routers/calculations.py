from dataclasses import asdict
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel

from ..services.bess_calculations import (
    calculate_site_capacity,
    calculate_land_use,
    calculate_cable_sizing,
    estimate_project_cost,
)

router = APIRouter(prefix="/calculations", tags=["calculations"])


class ComponentItem(BaseModel):
    component_type: str
    label: str | None = None
    x: float = 0.0
    y: float = 0.0
    width: float = 0.0
    height: float = 0.0
    rotation: float = 0.0
    properties: dict = {}


class CapacityRequest(BaseModel):
    components: List[ComponentItem]
    site_area_m2: float = 0.0


class LandUseRequest(BaseModel):
    components: List[ComponentItem]
    site_area_m2: float = 0.0


class CableSizingRequest(BaseModel):
    power_kw: float
    voltage_v: float
    distance_m: float
    power_factor: float = 0.95


@router.post("/capacity")
def calc_capacity(payload: CapacityRequest):
    """Calculate BESS site capacity from component list."""
    components = [c.model_dump() for c in payload.components]
    result = calculate_site_capacity(components)
    data = asdict(result)
    # Override site_area_m2 with provided value if given
    if payload.site_area_m2 and payload.site_area_m2 > 0:
        data["site_area_m2"] = payload.site_area_m2
        if data["site_area_m2"] > 0:
            data["energy_density_mwh_per_ha"] = round(
                data["total_capacity_mwh"] / (data["site_area_m2"] / 10000.0), 2
            )
    return data


@router.post("/land-use")
def calc_land_use(payload: LandUseRequest):
    """Calculate land use breakdown from component list."""
    components = [c.model_dump() for c in payload.components]
    result = calculate_land_use(components, payload.site_area_m2)
    return asdict(result)


@router.post("/cable-sizing")
def calc_cable_sizing(payload: CableSizingRequest):
    """Calculate cable sizing for a given power, voltage and distance."""
    return calculate_cable_sizing(
        power_kw=payload.power_kw,
        voltage_v=payload.voltage_v,
        distance_m=payload.distance_m,
        power_factor=payload.power_factor,
    )


@router.post("/cost-estimate")
def calc_cost_estimate(payload: CapacityRequest):
    """Calculate a rough project cost estimate."""
    components = [c.model_dump() for c in payload.components]
    capacity_result = calculate_site_capacity(components)
    if payload.site_area_m2 and payload.site_area_m2 > 0:
        from dataclasses import replace
        capacity_result = replace(capacity_result, site_area_m2=payload.site_area_m2)
    cost = estimate_project_cost(capacity_result)
    return {
        "capacity": asdict(capacity_result),
        "cost": cost,
    }
