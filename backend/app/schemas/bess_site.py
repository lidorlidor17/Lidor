from datetime import datetime
from pydantic import BaseModel, ConfigDict


class BESSSiteCreate(BaseModel):
    name: str
    description: str | None = None
    location: str | None = None
    target_capacity_mwh: float | None = None
    target_power_mw: float | None = None


class BESSSiteUpdate(BESSSiteCreate):
    drawing_data: dict | None = None
    site_area_m2: float | None = None


class BESSSiteResponse(BESSSiteCreate):
    id: str
    created_at: datetime
    updated_at: datetime
    drawing_data: dict | None = None
    site_area_m2: float | None = None

    model_config = ConfigDict(from_attributes=True)


class BESSComponentCreate(BaseModel):
    component_type: str
    label: str | None = None
    x: float
    y: float
    width: float
    height: float
    rotation: float = 0.0
    properties: dict = {}


class BESSComponentResponse(BESSComponentCreate):
    id: str
    site_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
