from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from ..services.layout_generator import generate_layout, get_standard_templates, LayoutConfig

router = APIRouter(prefix="/api/layout", tags=["layout"])

VALID_BATTERY_MODELS = {
    "CATL EnerOne Plus",
    "BYD Battery-Box Premium HVS",
    "Sungrow ST2752UX",
}

VALID_PCS_MODELS = {
    "SMA Sunny Central Storage 2500",
    "ABB PCS100 BESS-e 1250",
}


class GenerateLayoutRequest(BaseModel):
    target_capacity_mwh: float
    target_power_mw: float
    site_width_m: float = 200.0
    site_height_m: float = 150.0
    battery_model: str = "CATL EnerOne Plus"
    pcs_model: str = "SMA Sunny Central Storage 2500"
    layout_style: str = "grid"

    @field_validator("target_capacity_mwh", "target_power_mw", "site_width_m", "site_height_m")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Value must be positive")
        return v

    @field_validator("layout_style")
    @classmethod
    def valid_layout_style(cls, v: str) -> str:
        if v not in ("grid", "row"):
            raise ValueError("layout_style must be 'grid' or 'row'")
        return v


@router.post("/generate")
def generate_site_layout(req: GenerateLayoutRequest):
    """Auto-generate a BESS site layout from capacity/power requirements."""
    if req.battery_model not in VALID_BATTERY_MODELS:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown battery model '{req.battery_model}'. "
                   f"Valid models: {sorted(VALID_BATTERY_MODELS)}",
        )
    if req.pcs_model not in VALID_PCS_MODELS:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown PCS model '{req.pcs_model}'. "
                   f"Valid models: {sorted(VALID_PCS_MODELS)}",
        )

    config = LayoutConfig(**req.model_dump())
    result = generate_layout(config)

    return {
        "components": [vars(c) for c in result.components],
        "summary": {
            "total_capacity_mwh": result.total_capacity_mwh,
            "total_power_mw": result.total_power_mw,
            "num_battery_containers": result.num_battery_containers,
            "num_pcs_units": result.num_pcs_units,
            "site_utilization_percent": result.site_utilization_percent,
        },
        "notes": result.notes,
    }


@router.get("/templates")
def list_templates():
    """Return standard BESS site configuration templates."""
    return get_standard_templates()
