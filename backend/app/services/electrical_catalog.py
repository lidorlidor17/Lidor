from dataclasses import dataclass
from enum import Enum
from typing import Optional


class VoltageLevel(str, Enum):
    LV = "400V"
    MV_11 = "11kV"
    MV_33 = "33kV"
    HV_132 = "132kV"


class BatteryChemistry(str, Enum):
    LFP = "LFP"    # Lithium Iron Phosphate
    NMC = "NMC"    # Lithium Nickel Manganese Cobalt
    VRLA = "VRLA"  # Valve Regulated Lead Acid
    FLOW = "FLOW"  # Vanadium Redox Flow


@dataclass
class BatteryContainerSpec:
    model_name: str
    manufacturer: str
    chemistry: BatteryChemistry
    capacity_kwh: float              # Usable energy (kWh)
    rated_power_kw: float            # Max discharge power (kW)
    c_rate: float                    # C-rate (power/capacity)
    dc_voltage_range_v: tuple        # (min, max) DC voltage
    dimensions_m: tuple              # (length, width, height) in meters
    weight_kg: float
    ip_rating: str                   # e.g. "IP54"
    iec_standard: str                # e.g. "IEC 62619"
    roundtrip_efficiency: float      # e.g. 0.92
    cycle_life: int                  # cycles to 80% capacity
    dod_percent: float               # Depth of discharge
    operating_temp_range: tuple      # (min, max) Celsius
    fire_suppression: str            # e.g. "FM200", "HFC-125"
    container_type: str              # "20ft" or "40ft"


@dataclass
class PCSSpec:
    model_name: str
    manufacturer: str
    rated_power_kw: float
    ac_voltage_v: int
    dc_voltage_range_v: tuple
    efficiency_peak: float
    efficiency_at_10_percent: float
    ip_rating: str
    iec_standard: str                 # IEC 62477
    grid_forming_capable: bool        # Can operate in island mode
    reactive_power_capability_kvar: float
    dimensions_m: tuple
    weight_kg: float
    cooling: str                      # "air" or "liquid"


@dataclass
class TransformerSpec:
    model_name: str
    rated_power_kva: float
    primary_voltage_kv: float
    secondary_voltage_kv: float
    vector_group: str                 # e.g. "Dyn11"
    impedance_percent: float
    no_load_losses_kw: float
    full_load_losses_kw: float
    iec_standard: str                 # IEC 60076
    cooling_type: str                 # "ONAN", "ONAF", "AN"
    insulation_class: str


# ---------------------------------------------------------------------------
# Battery Container Catalog – real-world BESS products
# ---------------------------------------------------------------------------
BATTERY_CATALOG: list[BatteryContainerSpec] = [
    BatteryContainerSpec(
        model_name="CATL EnerOne Plus",
        manufacturer="CATL",
        chemistry=BatteryChemistry.LFP,
        capacity_kwh=372,
        rated_power_kw=372,
        c_rate=1.0,
        dc_voltage_range_v=(614, 768),
        dimensions_m=(6.058, 2.438, 2.591),
        weight_kg=22000,
        ip_rating="IP54",
        iec_standard="IEC 62619",
        roundtrip_efficiency=0.925,
        cycle_life=6000,
        dod_percent=90,
        operating_temp_range=(-20, 55),
        fire_suppression="FM200",
        container_type="20ft",
    ),
    BatteryContainerSpec(
        model_name="BYD Battery-Box Premium HVS",
        manufacturer="BYD",
        chemistry=BatteryChemistry.LFP,
        capacity_kwh=256,
        rated_power_kw=128,
        c_rate=0.5,
        dc_voltage_range_v=(480, 614),
        dimensions_m=(5.9, 2.35, 2.5),
        weight_kg=18500,
        ip_rating="IP55",
        iec_standard="IEC 62619",
        roundtrip_efficiency=0.93,
        cycle_life=5000,
        dod_percent=85,
        operating_temp_range=(-20, 50),
        fire_suppression="HFC-125",
        container_type="20ft",
    ),
    BatteryContainerSpec(
        model_name="Sungrow ST2752UX",
        manufacturer="Sungrow",
        chemistry=BatteryChemistry.LFP,
        capacity_kwh=2752,
        rated_power_kw=1375,
        c_rate=0.5,
        dc_voltage_range_v=(1000, 1500),
        dimensions_m=(12.192, 2.438, 2.896),
        weight_kg=36000,
        ip_rating="IP54",
        iec_standard="IEC 62619",
        roundtrip_efficiency=0.937,
        cycle_life=6000,
        dod_percent=90,
        operating_temp_range=(-30, 50),
        fire_suppression="FM200",
        container_type="40ft",
    ),
    BatteryContainerSpec(
        model_name="Tesla Megapack 2XL",
        manufacturer="Tesla",
        chemistry=BatteryChemistry.LFP,
        capacity_kwh=4000,
        rated_power_kw=1638,
        c_rate=0.41,
        dc_voltage_range_v=(1080, 1500),
        dimensions_m=(9.6, 2.07, 2.79),
        weight_kg=38000,
        ip_rating="IP55",
        iec_standard="IEC 62619",
        roundtrip_efficiency=0.933,
        cycle_life=6000,
        dod_percent=90,
        operating_temp_range=(-30, 50),
        fire_suppression="FM200",
        container_type="40ft",
    ),
    BatteryContainerSpec(
        model_name="Huawei LUNA2000-200KWH",
        manufacturer="Huawei",
        chemistry=BatteryChemistry.LFP,
        capacity_kwh=200,
        rated_power_kw=100,
        c_rate=0.5,
        dc_voltage_range_v=(600, 840),
        dimensions_m=(5.88, 2.3, 2.415),
        weight_kg=15000,
        ip_rating="IP54",
        iec_standard="IEC 62619",
        roundtrip_efficiency=0.928,
        cycle_life=5000,
        dod_percent=90,
        operating_temp_range=(-20, 50),
        fire_suppression="HFC-125",
        container_type="20ft",
    ),
    BatteryContainerSpec(
        model_name="Invinity VS3-022",
        manufacturer="Invinity",
        chemistry=BatteryChemistry.FLOW,
        capacity_kwh=22,
        rated_power_kw=7,
        c_rate=0.32,
        dc_voltage_range_v=(48, 60),
        dimensions_m=(1.68, 0.66, 1.95),
        weight_kg=1050,
        ip_rating="IP45",
        iec_standard="IEC 62619",
        roundtrip_efficiency=0.72,
        cycle_life=20000,
        dod_percent=100,
        operating_temp_range=(5, 40),
        fire_suppression="Dry Powder",
        container_type="20ft",
    ),
]

# ---------------------------------------------------------------------------
# PCS (Power Conversion System) Catalog
# ---------------------------------------------------------------------------
PCS_CATALOG: list[PCSSpec] = [
    PCSSpec(
        model_name="SMA Sunny Central Storage 2500",
        manufacturer="SMA",
        rated_power_kw=2500,
        ac_voltage_v=690,
        dc_voltage_range_v=(900, 1500),
        efficiency_peak=0.989,
        efficiency_at_10_percent=0.972,
        ip_rating="IP54",
        iec_standard="IEC 62477",
        grid_forming_capable=True,
        reactive_power_capability_kvar=2500,
        dimensions_m=(2.1, 0.8, 2.2),
        weight_kg=1450,
        cooling="air",
    ),
    PCSSpec(
        model_name="ABB PCS100 BESS-e 1250",
        manufacturer="ABB",
        rated_power_kw=1250,
        ac_voltage_v=400,
        dc_voltage_range_v=(600, 1000),
        efficiency_peak=0.985,
        efficiency_at_10_percent=0.968,
        ip_rating="IP54",
        iec_standard="IEC 62477",
        grid_forming_capable=True,
        reactive_power_capability_kvar=1000,
        dimensions_m=(2.0, 0.8, 2.1),
        weight_kg=1200,
        cooling="air",
    ),
    PCSSpec(
        model_name="Sungrow SC3450UD-MV",
        manufacturer="Sungrow",
        rated_power_kw=3450,
        ac_voltage_v=690,
        dc_voltage_range_v=(1000, 1500),
        efficiency_peak=0.990,
        efficiency_at_10_percent=0.975,
        ip_rating="IP54",
        iec_standard="IEC 62477",
        grid_forming_capable=True,
        reactive_power_capability_kvar=3450,
        dimensions_m=(2.45, 1.0, 2.3),
        weight_kg=1900,
        cooling="liquid",
    ),
    PCSSpec(
        model_name="Schneider Electric Conext XW Pro 6848",
        manufacturer="Schneider Electric",
        rated_power_kw=6.8,
        ac_voltage_v=230,
        dc_voltage_range_v=(40, 64),
        efficiency_peak=0.972,
        efficiency_at_10_percent=0.950,
        ip_rating="IP20",
        iec_standard="IEC 62477",
        grid_forming_capable=True,
        reactive_power_capability_kvar=5,
        dimensions_m=(0.42, 0.25, 0.54),
        weight_kg=25,
        cooling="air",
    ),
    PCSSpec(
        model_name="Huawei SUN2000-330KTL",
        manufacturer="Huawei",
        rated_power_kw=330,
        ac_voltage_v=800,
        dc_voltage_range_v=(200, 1500),
        efficiency_peak=0.990,
        efficiency_at_10_percent=0.971,
        ip_rating="IP65",
        iec_standard="IEC 62477",
        grid_forming_capable=False,
        reactive_power_capability_kvar=330,
        dimensions_m=(1.26, 0.47, 1.59),
        weight_kg=220,
        cooling="air",
    ),
]

# ---------------------------------------------------------------------------
# Transformer Catalog
# ---------------------------------------------------------------------------
TRANSFORMER_CATALOG: list[TransformerSpec] = [
    TransformerSpec(
        model_name="ABB RESIBLOC 1600kVA",
        rated_power_kva=1600,
        primary_voltage_kv=11.0,
        secondary_voltage_kv=0.69,
        vector_group="Dyn11",
        impedance_percent=6.0,
        no_load_losses_kw=1.8,
        full_load_losses_kw=14.5,
        iec_standard="IEC 60076",
        cooling_type="AN",
        insulation_class="F",
    ),
    TransformerSpec(
        model_name="Siemens GEAFOL 2500kVA",
        rated_power_kva=2500,
        primary_voltage_kv=33.0,
        secondary_voltage_kv=0.69,
        vector_group="Dyn11",
        impedance_percent=6.5,
        no_load_losses_kw=3.2,
        full_load_losses_kw=21.0,
        iec_standard="IEC 60076",
        cooling_type="AN",
        insulation_class="H",
    ),
    TransformerSpec(
        model_name="Schneider Electric Minera 630kVA",
        rated_power_kva=630,
        primary_voltage_kv=11.0,
        secondary_voltage_kv=0.4,
        vector_group="Dyn11",
        impedance_percent=4.0,
        no_load_losses_kw=0.85,
        full_load_losses_kw=6.2,
        iec_standard="IEC 60076",
        cooling_type="ONAN",
        insulation_class="A",
    ),
    TransformerSpec(
        model_name="ABB RESIBLOC 4000kVA",
        rated_power_kva=4000,
        primary_voltage_kv=33.0,
        secondary_voltage_kv=0.69,
        vector_group="Dyn11",
        impedance_percent=6.0,
        no_load_losses_kw=4.5,
        full_load_losses_kw=30.0,
        iec_standard="IEC 60076",
        cooling_type="AN",
        insulation_class="F",
    ),
    TransformerSpec(
        model_name="Siemens GEAFOL 5000kVA",
        rated_power_kva=5000,
        primary_voltage_kv=33.0,
        secondary_voltage_kv=11.0,
        vector_group="YNd11",
        impedance_percent=7.0,
        no_load_losses_kw=6.0,
        full_load_losses_kw=40.0,
        iec_standard="IEC 60076",
        cooling_type="ONAF",
        insulation_class="H",
    ),
]


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def _spec_to_dict(spec) -> dict:
    """Convert a dataclass spec to a plain dict, serialising enums and tuples."""
    result: dict = {}
    for key, value in vars(spec).items():
        if isinstance(value, Enum):
            result[key] = value.value
        elif isinstance(value, tuple):
            result[key] = list(value)
        else:
            result[key] = value
    return result


def get_battery_by_name(name: str) -> Optional[BatteryContainerSpec]:
    return next((b for b in BATTERY_CATALOG if b.model_name == name), None)


def get_pcs_by_name(name: str) -> Optional[PCSSpec]:
    return next((p for p in PCS_CATALOG if p.model_name == name), None)


def get_transformer_by_name(name: str) -> Optional[TransformerSpec]:
    return next((t for t in TRANSFORMER_CATALOG if t.model_name == name), None)


def get_all_batteries() -> list[dict]:
    return [_spec_to_dict(b) for b in BATTERY_CATALOG]


def get_all_pcs() -> list[dict]:
    return [_spec_to_dict(p) for p in PCS_CATALOG]


def get_all_transformers() -> list[dict]:
    return [_spec_to_dict(t) for t in TRANSFORMER_CATALOG]
