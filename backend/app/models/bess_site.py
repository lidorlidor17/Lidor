import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


def _new_uuid() -> str:
    return str(uuid.uuid4())


class BESSSite(Base):
    __tablename__ = "bess_sites"

    id = Column(String, primary_key=True, default=_new_uuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    location = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    drawing_data = Column(JSON, nullable=True)
    site_area_m2 = Column(Float, nullable=True)
    target_capacity_mwh = Column(Float, nullable=True)
    target_power_mw = Column(Float, nullable=True)

    components = relationship("BESSComponent", back_populates="site", cascade="all, delete-orphan")


class BESSComponent(Base):
    __tablename__ = "bess_components"

    id = Column(String, primary_key=True, default=_new_uuid)
    site_id = Column(String, ForeignKey("bess_sites.id"), nullable=False)
    component_type = Column(String, nullable=False)
    label = Column(String, nullable=True)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    width = Column(Float, nullable=False)
    height = Column(Float, nullable=False)
    rotation = Column(Float, default=0.0, nullable=False)
    properties = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    site = relationship("BESSSite", back_populates="components")
