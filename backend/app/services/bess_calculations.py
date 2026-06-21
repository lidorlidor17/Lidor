import math
from dataclasses import dataclass


BATTERY_COMPONENT_TYPES = {"battery_container"}
PCS_COMPONENT_TYPES = {"pcs"}
INFRASTRUCTURE_TYPES = {"transformer", "control_room", "substation"}
CIVIL_TYPES = {"fence", "road", "annotation"}

# Pixel-to-meter ratio for canvas (assume 1 px = 0.1 m by default)
PX_TO_M = 0.1


@dataclass
class BESSCapacityResult:
    total_capacity_mwh: float
    total_power_mw: float
    c_rate: float             # power/capacity ratio
    num_battery_containers: int
    num_pcs_units: int
    estimated_efficiency: float   # round-trip efficiency (fraction)
    site_area_m2: float
    energy_density_mwh_per_ha: float


def calculate_site_capacity(components: list[dict]) -> BESSCapacityResult:
    """
    Given a list of component dicts (each with component_type, properties),
    calculate total site capacity, power, and metrics.

    Battery container properties: {capacity_kwh: float, power_kw: float, quantity: int}
    PCS properties: {power_kw: float, quantity: int}
    """
    total_capacity_kwh = 0.0
    total_power_kw = 0.0
    num_battery_containers = 0
    num_pcs_units = 0

    for comp in components:
        ctype = comp.get("component_type", "")
        props = comp.get("properties", {}) or {}

        if ctype in BATTERY_COMPONENT_TYPES:
            quantity = int(props.get("quantity", 1))
            capacity_kwh = float(props.get("capacity_kwh", 250.0))
            power_kw = float(props.get("power_kw", 125.0))
            total_capacity_kwh += capacity_kwh * quantity
            total_power_kw += power_kw * quantity
            num_battery_containers += quantity

        elif ctype in PCS_COMPONENT_TYPES:
            quantity = int(props.get("quantity", 1))
            power_kw = float(props.get("power_kw", 500.0))
            total_power_kw_pcs = power_kw * quantity
            # PCS power caps total power if lower
            num_pcs_units += quantity

    # If PCS units are defined, use PCS-limited power
    pcs_power_kw = 0.0
    for comp in components:
        ctype = comp.get("component_type", "")
        props = comp.get("properties", {}) or {}
        if ctype in PCS_COMPONENT_TYPES:
            quantity = int(props.get("quantity", 1))
            power_kw = float(props.get("power_kw", 500.0))
            pcs_power_kw += power_kw * quantity

    if pcs_power_kw > 0:
        effective_power_kw = min(total_power_kw, pcs_power_kw)
    else:
        effective_power_kw = total_power_kw

    total_capacity_mwh = total_capacity_kwh / 1000.0
    total_power_mw = effective_power_kw / 1000.0

    # C-rate = power (kW) / capacity (kWh)
    c_rate = (effective_power_kw / total_capacity_kwh) if total_capacity_kwh > 0 else 0.0

    # Round-trip efficiency: lithium-ion BESS typically 85-95%
    # Estimate based on C-rate: higher C-rate -> slightly lower efficiency
    if c_rate <= 0.25:
        estimated_efficiency = 0.95
    elif c_rate <= 0.5:
        estimated_efficiency = 0.93
    elif c_rate <= 1.0:
        estimated_efficiency = 0.90
    else:
        estimated_efficiency = 0.87

    # Estimate site area from component footprints
    site_area_m2 = _estimate_site_area(components)

    # Energy density in MWh per hectare (1 ha = 10,000 m²)
    if site_area_m2 > 0:
        energy_density_mwh_per_ha = total_capacity_mwh / (site_area_m2 / 10000.0)
    else:
        energy_density_mwh_per_ha = 0.0

    return BESSCapacityResult(
        total_capacity_mwh=round(total_capacity_mwh, 3),
        total_power_mw=round(total_power_mw, 3),
        c_rate=round(c_rate, 3),
        num_battery_containers=num_battery_containers,
        num_pcs_units=num_pcs_units,
        estimated_efficiency=round(estimated_efficiency, 3),
        site_area_m2=round(site_area_m2, 1),
        energy_density_mwh_per_ha=round(energy_density_mwh_per_ha, 2),
    )


def _component_area_m2(comp: dict) -> float:
    """Return the footprint area of a component in m²."""
    width_px = float(comp.get("width", 0))
    height_px = float(comp.get("height", 0))
    return width_px * PX_TO_M * height_px * PX_TO_M


@dataclass
class LandUseResult:
    total_area_m2: float
    battery_area_m2: float
    pcs_area_m2: float
    infrastructure_area_m2: float
    utilization_percent: float


def calculate_land_use(components: list[dict], site_area_m2: float) -> LandUseResult:
    """Calculate how site area is divided between component types."""
    battery_area_m2 = 0.0
    pcs_area_m2 = 0.0
    infrastructure_area_m2 = 0.0

    for comp in components:
        ctype = comp.get("component_type", "")
        area = _component_area_m2(comp)

        if ctype in BATTERY_COMPONENT_TYPES:
            battery_area_m2 += area
        elif ctype in PCS_COMPONENT_TYPES:
            pcs_area_m2 += area
        elif ctype in INFRASTRUCTURE_TYPES:
            infrastructure_area_m2 += area
        # fence, road, annotation are civil — not counted in equipment area

    total_equipment_area = battery_area_m2 + pcs_area_m2 + infrastructure_area_m2

    # Use provided site_area_m2 if available, otherwise estimate
    if site_area_m2 and site_area_m2 > 0:
        total_area = site_area_m2
    else:
        total_area = _estimate_site_area(components)

    utilization_percent = (total_equipment_area / total_area * 100.0) if total_area > 0 else 0.0

    return LandUseResult(
        total_area_m2=round(total_area, 1),
        battery_area_m2=round(battery_area_m2, 1),
        pcs_area_m2=round(pcs_area_m2, 1),
        infrastructure_area_m2=round(infrastructure_area_m2, 1),
        utilization_percent=round(min(utilization_percent, 100.0), 1),
    )


def _estimate_site_area(components: list[dict]) -> float:
    """Estimate total site area from the bounding box of all components."""
    if not components:
        return 0.0

    xs = []
    ys = []
    for comp in components:
        x = float(comp.get("x", 0))
        y = float(comp.get("y", 0))
        w = float(comp.get("width", 0))
        h = float(comp.get("height", 0))
        xs.extend([x, x + w])
        ys.extend([y, y + h])

    if not xs:
        return 0.0

    width_px = max(xs) - min(xs)
    height_px = max(ys) - min(ys)

    # Add 20% margin around components
    width_px *= 1.2
    height_px *= 1.2

    return width_px * PX_TO_M * height_px * PX_TO_M


def calculate_cable_sizing(
    power_kw: float,
    voltage_v: float,
    distance_m: float,
    power_factor: float = 0.95,
) -> dict:
    """
    Calculate required cable cross-section area.
    Returns: {current_a: float, cable_size_mm2: float, voltage_drop_percent: float}
    Uses copper 3-phase cable sizing.
    """
    # Full-load current: I = P / (sqrt(3) * V * pf)
    current = power_kw * 1000.0 / (math.sqrt(3) * voltage_v * power_factor)

    # Cable sizing based on current density 2.5 A/mm² for copper in free air
    current_density = 2.5  # A/mm²
    cable_size = current / current_density

    # Round up to nearest standard IEC cable size
    standard_sizes = [16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300]
    cable_size_std = next((s for s in standard_sizes if s >= cable_size), 300)

    # Voltage drop calculation
    # Resistance of copper cable: rho_cu = 0.0175 ohm.mm²/m
    resistance_per_m = 0.0175 / cable_size_std  # ohm/m per conductor
    # 3-phase voltage drop: ΔV = sqrt(3) * I * R * L
    voltage_drop_v = math.sqrt(3) * current * resistance_per_m * distance_m
    voltage_drop_percent = (voltage_drop_v / voltage_v) * 100.0

    return {
        "current_a": round(current, 1),
        "cable_size_mm2": cable_size_std,
        "voltage_drop_percent": round(voltage_drop_percent, 2),
    }


def estimate_project_cost(capacity_result: BESSCapacityResult) -> dict:
    """
    Rough cost estimation in USD.
    Returns: {battery_cost, pcs_cost, civil_cost, total_cost, cost_per_kwh}

    Battery: ~$250/kWh
    PCS: ~$50/kW
    Civil & BOS: ~$30/kWh
    """
    capacity_kwh = capacity_result.total_capacity_mwh * 1000.0
    power_kw = capacity_result.total_power_mw * 1000.0

    battery_cost = capacity_kwh * 250.0
    pcs_cost = power_kw * 50.0
    civil_cost = capacity_kwh * 30.0
    total_cost = battery_cost + pcs_cost + civil_cost

    cost_per_kwh = (total_cost / capacity_kwh) if capacity_kwh > 0 else 0.0

    return {
        "battery_cost": round(battery_cost, 2),
        "pcs_cost": round(pcs_cost, 2),
        "civil_cost": round(civil_cost, 2),
        "total_cost": round(total_cost, 2),
        "cost_per_kwh": round(cost_per_kwh, 2),
    }
