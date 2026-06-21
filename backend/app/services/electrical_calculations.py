import math
from dataclasses import dataclass, field


@dataclass
class ShortCircuitResult:
    isc_ka: float                    # Short circuit current in kA
    isc_peak_ka: float               # Peak short circuit current
    breaking_capacity_ka: float      # Required CB breaking capacity
    recommended_cb: str              # Recommended circuit breaker


@dataclass
class ProtectionResult:
    overcurrent_relay_setting_a: float
    earth_fault_relay_setting_a: float
    fuse_rating_a: float
    cable_protection_ok: bool
    thermal_withstand_ok: bool


@dataclass
class PowerQualityResult:
    thd_voltage_percent: float       # Total Harmonic Distortion
    power_factor: float
    flicker_pst: float
    grid_code_compliant: bool        # EN 50549 compliance
    recommendations: list[str]


def calculate_short_circuit_current(
    transformer_kva: float,
    voltage_kv: float,
    impedance_percent: float,
) -> ShortCircuitResult:
    """Calculate three-phase short circuit current per IEC 60909.

    Args:
        transformer_kva:    Transformer rated power in kVA.
        voltage_kv:         System voltage at fault point in kV.
        impedance_percent:  Transformer short-circuit impedance in %.

    Returns:
        ShortCircuitResult with Isc, peak Isc, required breaking capacity
        and a recommended standard circuit breaker rating.
    """
    # Base impedance at the secondary bus
    v_base = voltage_kv * 1000  # Volts
    s_base = transformer_kva * 1000  # VA
    z_base = (v_base ** 2) / s_base  # Ohms

    z_transformer = (impedance_percent / 100.0) * z_base

    # Symmetrical three-phase fault current (IEC 60909 Eq. 29)
    isc = v_base / (math.sqrt(3) * z_transformer)
    isc_ka = isc / 1000

    # Peak factor kappa ~ 2.2 for LV / close-to-transformer faults
    isc_peak_ka = isc_ka * 2.2

    # Required breaking capacity: add 25 % safety margin
    breaking_capacity = isc_ka * 1.25

    # Select the next standard ACB breaking capacity
    standard_cbs = [10, 16, 25, 36, 50, 63, 80, 100]
    cb_ka = next((c for c in standard_cbs if c >= breaking_capacity), 100)

    return ShortCircuitResult(
        isc_ka=round(isc_ka, 2),
        isc_peak_ka=round(isc_peak_ka, 2),
        breaking_capacity_ka=round(breaking_capacity, 2),
        recommended_cb=f"ACB {cb_ka}kA",
    )


def calculate_protection_settings(
    rated_current_a: float,
    cable_size_mm2: float,
    cable_length_m: float,
) -> ProtectionResult:
    """Calculate protection relay settings per IEC 60255 and IEC 60364.

    Args:
        rated_current_a:  Equipment rated current in Amperes.
        cable_size_mm2:   Cable cross-sectional area in mm².
        cable_length_m:   Cable run length in metres.

    Returns:
        ProtectionResult with relay settings and cable suitability flags.
    """
    # Overcurrent relay pick-up: 1.1 × In (IEC 60255-151)
    oc_setting = rated_current_a * 1.1

    # Earth-fault relay pick-up: 10 % of rated current
    ef_setting = rated_current_a * 0.1

    # Fuse rating: next standard size above 1.25 × In (IEC 60269)
    fuse_sizes = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400]
    fuse = next((f for f in fuse_sizes if f >= rated_current_a * 1.25), 400)

    # Cable suitability checks (IEC 60364-5-52)
    # Minimum 16 mm² for BESS interconnections
    cable_protection = cable_size_mm2 >= 16

    # Thermal withstand: for runs > 200 m, require at least 35 mm²
    thermal_ok = (cable_length_m < 200) or (cable_size_mm2 >= 35)

    return ProtectionResult(
        overcurrent_relay_setting_a=round(oc_setting, 1),
        earth_fault_relay_setting_a=round(ef_setting, 1),
        fuse_rating_a=fuse,
        cable_protection_ok=cable_protection,
        thermal_withstand_ok=thermal_ok,
    )


def assess_power_quality(
    pcs_count: int,
    total_power_kw: float,
    grid_fault_level_mva: float = 100.0,
) -> PowerQualityResult:
    """Assess power quality per EN 50549 and IEC 61000-3-2.

    Args:
        pcs_count:             Number of PCS units on site.
        total_power_kw:        Total BESS active power output in kW.
        grid_fault_level_mva:  Grid short-circuit level at PCC in MVA.

    Returns:
        PowerQualityResult with THD, power factor, flicker and compliance flag.
    """
    # Modern PCS units at full load inject ~2.5 % THD
    base_thd = 2.5
    # Multiple units operating asynchronously can amplify harmonics slightly
    loading_factor = 1.2 if pcs_count > 4 else 1.0
    thd = base_thd * loading_factor

    # PCS typically operates at 0.97 power factor lagging/leading
    pf = 0.97

    # Short-term flicker (Pst) – simplified per IEC 61000-4-15
    # Larger sites with more switching events produce higher flicker
    pst = 0.3 if total_power_kw < 5000 else 0.5

    # EN 50549 limits: THD < 8 %, PF > 0.90, Pst < 1.0
    grid_code_ok = thd < 8.0 and pf > 0.90 and pst < 1.0

    recommendations: list[str] = []
    if thd > 5.0:
        recommendations.append("Consider harmonic filters to reduce THD below 5 %")
    if pf < 0.95:
        recommendations.append("Enable reactive power compensation in PCS settings")
    if pst >= 0.8:
        recommendations.append(
            "Review switching ramp rates to keep flicker Pst below 0.8"
        )
    if not grid_code_ok:
        recommendations.append("Grid code compliance review required before energisation")

    return PowerQualityResult(
        thd_voltage_percent=round(thd, 1),
        power_factor=round(pf, 3),
        flicker_pst=round(pst, 2),
        grid_code_compliant=grid_code_ok,
        recommendations=recommendations,
    )


def calculate_grounding_system(
    site_area_m2: float,
    soil_resistivity_ohm_m: float = 100.0,
) -> dict:
    """Calculate earthing grid per IEC 60364-5-54 and IEEE Std 80.

    Args:
        site_area_m2:             Total BESS site footprint in m².
        soil_resistivity_ohm_m:   Measured soil resistivity in Ω·m (default 100).

    Returns:
        Dict with grid geometry, earthing resistance and compliance flag.
    """
    # Grid conductor spacing (limited to 3 m for safety step-potential)
    spacing = min(3.0, math.sqrt(site_area_m2 / 100))

    # Number of vertical earth rods (one per ~50 m²)
    num_rods = max(4, int(site_area_m2 / 50))

    rod_depth_m = 1.5  # Standard vertical rod length

    # Simplified Schwarz formula for grid resistance (IEC 60364-5-54, A.54.3)
    grid_side = math.sqrt(site_area_m2)  # Equivalent square side length
    r_earth = (soil_resistivity_ohm_m / (4.0 * grid_side)) * (
        1.0 + 1.0 / (1.0 + 0.22 * grid_side / rod_depth_m)
    )

    # Touch voltage check: IEC 60479 limits touch voltage to 50 V (AC)
    # Body resistance ~1000 Ω -> permissible ground current 50 mA
    # Conservative: require R_earth < 1 Ω for BESS sites
    meets_iec = r_earth < 1.0

    return {
        "grid_spacing_m": round(spacing, 1),
        "num_earth_rods": num_rods,
        "rod_depth_m": rod_depth_m,
        "earthing_resistance_ohm": round(r_earth, 2),
        "meets_iec_requirement": meets_iec,
        "conductor_size_mm2": 95,   # Standard: 95 mm² bare copper tape
        "note": "IEC 60364-5-54: R_E < 1 Ω required for BESS sites",
    }


def calculate_cable_sizing(
    power_kw: float,
    voltage_v: float,
    power_factor: float,
    cable_length_m: float,
    max_voltage_drop_percent: float = 3.0,
    ambient_temp_c: float = 40.0,
) -> dict:
    """Size AC cables per IEC 60364-5-52 considering thermal rating and voltage drop.

    Args:
        power_kw:                  Load power in kW.
        voltage_v:                 System line voltage in V (phase-phase).
        power_factor:              Load power factor.
        cable_length_m:            One-way cable run in metres.
        max_voltage_drop_percent:  Maximum allowable voltage drop (default 3 %).
        ambient_temp_c:            Ambient temperature in °C (default 40 °C).

    Returns:
        Dict with recommended cable size, current rating, actual voltage drop.
    """
    # Full-load current (three-phase)
    i_load = (power_kw * 1000) / (math.sqrt(3) * voltage_v * power_factor)

    # Derating factor for 40 °C ambient (IEC 60364-5-52 Table B.52.14)
    # Reference temperature is 30 °C; XLPE cable (90 °C rated)
    derating = math.sqrt((90 - ambient_temp_c) / (90 - 30))
    i_derated = i_load / derating

    # Standard XLPE cable sizes (mm²) and approximate ampacity at 30 °C in ground
    cable_table = [
        (10, 65), (16, 85), (25, 110), (35, 133), (50, 159),
        (70, 200), (95, 241), (120, 278), (150, 318), (185, 362),
        (240, 424), (300, 482),
    ]
    cable_mm2, ampacity = next(
        ((mm2, amp) for mm2, amp in cable_table if amp >= i_derated),
        (300, 482),
    )

    # Voltage drop: ΔV = (√3 × I × L × ρ) / A   where ρ = 0.0172 Ω·mm²/m (Cu)
    rho_cu = 0.0172  # Ω·mm²/m
    delta_v = (math.sqrt(3) * i_load * cable_length_m * rho_cu) / cable_mm2
    vd_percent = (delta_v / voltage_v) * 100

    return {
        "rated_current_a": round(i_load, 1),
        "derated_current_a": round(i_derated, 1),
        "recommended_cable_mm2": cable_mm2,
        "cable_ampacity_a": ampacity,
        "voltage_drop_v": round(delta_v, 1),
        "voltage_drop_percent": round(vd_percent, 2),
        "meets_voltage_drop_limit": vd_percent <= max_voltage_drop_percent,
        "standard": "IEC 60364-5-52 / XLPE Cu cable",
    }
