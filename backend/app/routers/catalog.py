from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.electrical_catalog import (
    get_all_batteries,
    get_all_pcs,
    get_all_transformers,
)
from ..services.electrical_calculations import (
    assess_power_quality,
    calculate_cable_sizing,
    calculate_grounding_system,
    calculate_protection_settings,
    calculate_short_circuit_current,
)

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


# ---------------------------------------------------------------------------
# Catalog list endpoints
# ---------------------------------------------------------------------------

@router.get("/batteries", summary="List all battery container products")
def list_batteries() -> list[dict]:
    """Return the full battery container catalog."""
    return get_all_batteries()


@router.get("/pcs", summary="List all PCS (inverter) products")
def list_pcs() -> list[dict]:
    """Return the full PCS catalog."""
    return get_all_pcs()


@router.get("/transformers", summary="List all transformer products")
def list_transformers() -> list[dict]:
    """Return the full transformer catalog."""
    return get_all_transformers()


# ---------------------------------------------------------------------------
# Calculation endpoints
# ---------------------------------------------------------------------------

class ShortCircuitRequest(BaseModel):
    transformer_kva: float = Field(..., gt=0, description="Transformer rated power (kVA)")
    voltage_kv: float = Field(..., gt=0, description="System voltage at fault point (kV)")
    impedance_percent: float = Field(6.0, gt=0, description="Transformer impedance (%)")


@router.post("/calculations/short-circuit", summary="IEC 60909 short circuit calculation")
def short_circuit_calc(req: ShortCircuitRequest):
    """Calculate three-phase short circuit current per IEC 60909."""
    return calculate_short_circuit_current(
        req.transformer_kva, req.voltage_kv, req.impedance_percent
    )


class ProtectionRequest(BaseModel):
    rated_current_a: float = Field(..., gt=0, description="Equipment rated current (A)")
    cable_size_mm2: float = Field(..., gt=0, description="Cable cross-section (mm²)")
    cable_length_m: float = Field(..., gt=0, description="Cable run length (m)")


@router.post("/calculations/protection", summary="IEC 60255 protection relay settings")
def protection_calc(req: ProtectionRequest):
    """Calculate overcurrent and earth-fault relay settings per IEC 60255."""
    return calculate_protection_settings(
        req.rated_current_a, req.cable_size_mm2, req.cable_length_m
    )


class PowerQualityRequest(BaseModel):
    pcs_count: int = Field(..., ge=1, description="Number of PCS units on site")
    total_power_kw: float = Field(..., gt=0, description="Total BESS active power (kW)")
    grid_fault_level_mva: float = Field(
        100.0, gt=0, description="Grid short-circuit level at PCC (MVA)"
    )


@router.post("/calculations/power-quality", summary="EN 50549 power quality assessment")
def power_quality_calc(req: PowerQualityRequest):
    """Assess power quality per EN 50549 and IEC 61000-3-2."""
    return assess_power_quality(
        req.pcs_count, req.total_power_kw, req.grid_fault_level_mva
    )


class GroundingRequest(BaseModel):
    site_area_m2: float = Field(..., gt=0, description="Site footprint (m²)")
    soil_resistivity_ohm_m: float = Field(
        100.0, gt=0, description="Soil resistivity (Ω·m)"
    )


@router.post("/calculations/grounding", summary="IEC 60364-5-54 earthing grid design")
def grounding_calc(req: GroundingRequest):
    """Calculate earthing grid per IEC 60364-5-54."""
    return calculate_grounding_system(
        req.site_area_m2, req.soil_resistivity_ohm_m
    )


class CableSizingRequest(BaseModel):
    power_kw: float = Field(..., gt=0, description="Load power (kW)")
    voltage_v: float = Field(..., gt=0, description="System line voltage (V)")
    power_factor: float = Field(0.97, ge=0.1, le=1.0, description="Load power factor")
    cable_length_m: float = Field(..., gt=0, description="One-way cable length (m)")
    max_voltage_drop_percent: float = Field(
        3.0, gt=0, description="Maximum allowable voltage drop (%)"
    )
    ambient_temp_c: float = Field(40.0, description="Ambient temperature (°C)")


@router.post("/calculations/cable-sizing", summary="IEC 60364-5-52 cable sizing")
def cable_sizing_calc(req: CableSizingRequest):
    """Size AC cables per IEC 60364-5-52 (thermal rating + voltage drop)."""
    return calculate_cable_sizing(
        req.power_kw,
        req.voltage_v,
        req.power_factor,
        req.cable_length_m,
        req.max_voltage_drop_percent,
        req.ambient_temp_c,
    )
