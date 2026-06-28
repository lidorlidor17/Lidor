from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: str = ""


class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: str
    updated_at: str


class ComponentCreate(BaseModel):
    component_type_id: str
    name: str
    x: float
    y: float
    width: Optional[float] = None
    height: Optional[float] = None


class ComponentPositionUpdate(BaseModel):
    x: float
    y: float


class FieldValue(BaseModel):
    field_key: str
    value: str
    label: str
    unit: str


class ComponentResponse(BaseModel):
    id: str
    project_id: str
    component_type_id: str
    name: str
    x: float
    y: float
    width: Optional[float]
    height: Optional[float]
    rotation: float
    created_at: str
    updated_at: str
    field_values: list[FieldValue] = []


class ComponentTypeResponse(BaseModel):
    id: str
    name: str
    category: str
    default_color: str
    default_width: float
    default_height: float


class FieldUpdate(BaseModel):
    field_key: str
    value: str


class ComponentFieldsUpdate(BaseModel):
    fields: list[FieldUpdate]
