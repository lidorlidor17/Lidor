from dataclasses import dataclass
import math


@dataclass
class LayoutConfig:
    target_capacity_mwh: float
    target_power_mw: float
    site_width_m: float
    site_height_m: float
    battery_model: str = "CATL EnerOne Plus"
    pcs_model: str = "SMA Sunny Central Storage 2500"
    layout_style: str = "grid"  # "grid" or "row"


@dataclass
class GeneratedComponent:
    component_type: str
    label: str
    x: float          # canvas pixels (at scale 0.5 m/px)
    y: float
    width: float      # canvas pixels
    height: float
    rotation: float
    properties: dict


@dataclass
class GeneratedLayout:
    components: list[GeneratedComponent]
    total_capacity_mwh: float
    total_power_mw: float
    num_battery_containers: int
    num_pcs_units: int
    site_utilization_percent: float
    notes: list[str]


def generate_layout(config: LayoutConfig) -> GeneratedLayout:
    """
    Auto-generate a BESS site layout given requirements.

    Algorithm:
    1. Calculate number of battery containers needed
    2. Calculate number of PCS units needed (1 PCS per 2-4 batteries typically)
    3. Place batteries in rows with 3m spacing between rows, 1m between containers
    4. Place PCS units alongside battery rows
    5. Place transformer at edge near grid connection
    6. Place control room near entrance
    7. Draw site boundary around everything with 5m buffer
    8. Add access road along one side

    Scale: 1 pixel = 0.5 meters (scale = 0.5)
    Battery container: 6m L x 2.4m W -> 12px x 4.8px...
    Actually use: battery = 120px x 48px (representing 6m x 2.4m at scale 0.5)
    PCS: 40px x 60px (2m x 3m)
    Transformer: 60px x 60px (3m x 3m)
    Control room: 160px x 100px (8m x 5m)

    Position origin at (100, 100) canvas pixels (top-left of site)
    """

    # Determine container specs from model name
    CONTAINER_CAPACITY = {
        "CATL EnerOne Plus": 372,
        "BYD Battery-Box Premium HVS": 256,
        "Sungrow ST2752UX": 2752,
    }
    CONTAINER_POWER = {
        "CATL EnerOne Plus": 372,
        "BYD Battery-Box Premium HVS": 128,
        "Sungrow ST2752UX": 1375,
    }
    PCS_POWER = {
        "SMA Sunny Central Storage 2500": 2500,
        "ABB PCS100 BESS-e 1250": 1250,
    }

    capacity_kwh_per_container = CONTAINER_CAPACITY.get(config.battery_model, 372)
    power_kw_per_container = CONTAINER_POWER.get(config.battery_model, 372)
    pcs_power_kw = PCS_POWER.get(config.pcs_model, 2500)

    target_kwh = config.target_capacity_mwh * 1000
    target_kw = config.target_power_mw * 1000

    # Number of containers
    n_containers = math.ceil(max(
        target_kwh / capacity_kwh_per_container,
        target_kw / power_kw_per_container
    ))

    # Enforce at least 1 container
    n_containers = max(1, n_containers)

    # Number of PCS
    total_power_kw = n_containers * power_kw_per_container
    n_pcs = math.ceil(total_power_kw / pcs_power_kw)
    n_pcs = max(1, n_pcs)

    components: list[GeneratedComponent] = []

    # Canvas dimensions and scale
    SCALE = 0.5  # m/px
    BAT_W, BAT_H = 120, 48   # px (6m x 2.4m)
    BAT_GAP_X, BAT_GAP_Y = 20, 30  # px gap between containers
    PCS_W, PCS_H = 40, 60
    TX_W, TX_H = 60, 60
    CR_W, CR_H = 160, 100

    # Layout: rows of batteries
    if config.layout_style == "row":
        # Single long row layout
        cols = n_containers
        rows = 1
    else:
        # Grid layout: roughly square
        cols = max(1, math.ceil(math.sqrt(n_containers)))
        rows = math.ceil(n_containers / cols)

    origin_x, origin_y = 100, 100  # canvas offset

    # Place battery containers
    for i in range(n_containers):
        row = i // cols
        col = i % cols
        x = origin_x + col * (BAT_W + BAT_GAP_X)
        y = origin_y + row * (BAT_H + BAT_GAP_Y)
        components.append(GeneratedComponent(
            component_type="battery_container",
            label=f"מכל סוללות {i + 1}",
            x=x, y=y,
            width=BAT_W, height=BAT_H,
            rotation=0,
            properties={
                "capacity_kwh": capacity_kwh_per_container,
                "power_kw": power_kw_per_container,
                "quantity": 1,
                "model": config.battery_model,
            }
        ))

    # Place PCS units to the right of battery rows
    pcs_x = origin_x + cols * (BAT_W + BAT_GAP_X) + 40
    for i in range(n_pcs):
        y = origin_y + i * (PCS_H + 20)
        components.append(GeneratedComponent(
            component_type="pcs",
            label=f"PCS {i + 1}",
            x=pcs_x, y=y,
            width=PCS_W, height=PCS_H,
            rotation=0,
            properties={
                "power_kw": pcs_power_kw,
                "model": config.pcs_model,
            }
        ))

    # Transformer - next to PCS
    tx_x = pcs_x + PCS_W + 40
    tx_y = origin_y
    components.append(GeneratedComponent(
        component_type="transformer",
        label="שנאי מתח",
        x=tx_x, y=tx_y,
        width=TX_W, height=TX_H,
        rotation=0,
        properties={"voltage_kv": 33}
    ))

    # Control room - near entrance (bottom left)
    battery_bottom = origin_y + rows * (BAT_H + BAT_GAP_Y) + 60
    components.append(GeneratedComponent(
        component_type="control_room",
        label="חדר בקרה",
        x=origin_x, y=battery_bottom,
        width=CR_W, height=CR_H,
        rotation=0,
        properties={}
    ))

    # Substation
    components.append(GeneratedComponent(
        component_type="substation",
        label="תחנת משנה",
        x=tx_x, y=tx_y + TX_H + 40,
        width=100, height=80,
        rotation=0,
        properties={"voltage_kv": 33}
    ))

    # Site boundary
    boundary_x = origin_x - 60
    boundary_y = origin_y - 60
    all_x = [c.x + c.width for c in components]
    all_y = [c.y + c.height for c in components]
    boundary_w = max(all_x) - boundary_x + 80
    boundary_h = max(all_y) - boundary_y + 80

    components.append(GeneratedComponent(
        component_type="boundary",
        label="גבול אתר",
        x=boundary_x, y=boundary_y,
        width=boundary_w, height=boundary_h,
        rotation=0,
        properties={}
    ))

    # Access road
    components.append(GeneratedComponent(
        component_type="road",
        label="דרך גישה",
        x=boundary_x + 20, y=boundary_y + boundary_h - 30,
        width=boundary_w - 40, height=25,
        rotation=0,
        properties={}
    ))

    # Calculate metrics
    total_cap = n_containers * capacity_kwh_per_container / 1000
    total_pwr = n_containers * power_kw_per_container / 1000
    site_area = boundary_w * boundary_h * SCALE * SCALE  # m²
    battery_area = n_containers * 6 * 2.4  # m²
    utilization = (battery_area / site_area) * 100 if site_area > 0 else 0

    notes = [
        f"נדרשים {n_containers} מכלי סוללות",
        f"נדרשים {n_pcs} יחידות PCS",
        f"ניצולת שטח: {utilization:.1f}%",
        "יש להוסיף גידור היקפי ומערכת כיבוי אש",
    ]

    return GeneratedLayout(
        components=components,
        total_capacity_mwh=round(total_cap, 2),
        total_power_mw=round(total_pwr, 2),
        num_battery_containers=n_containers,
        num_pcs_units=n_pcs,
        site_utilization_percent=round(utilization, 1),
        notes=notes,
    )


def get_standard_templates() -> list[dict]:
    """Return standard BESS site configuration templates."""
    return [
        {
            "id": "small_10mwh",
            "name": "אתר קטן - 10MWh",
            "description": "אתר אגירה קטן לאיזון רשת מקומי",
            "target_capacity_mwh": 10,
            "target_power_mw": 5,
            "typical_site_area_m2": 3000,
            "battery_model": "CATL EnerOne Plus",
            "pcs_model": "SMA Sunny Central Storage 2500",
        },
        {
            "id": "medium_50mwh",
            "name": "אתר בינוני - 50MWh",
            "description": "אתר אגירה בינוני לשיא עומס",
            "target_capacity_mwh": 50,
            "target_power_mw": 25,
            "typical_site_area_m2": 12000,
            "battery_model": "Sungrow ST2752UX",
            "pcs_model": "SMA Sunny Central Storage 2500",
        },
        {
            "id": "large_200mwh",
            "name": "אתר גדול - 200MWh",
            "description": "אתר אגירה גדול לאיזון רשת ארצי",
            "target_capacity_mwh": 200,
            "target_power_mw": 100,
            "typical_site_area_m2": 45000,
            "battery_model": "Sungrow ST2752UX",
            "pcs_model": "SMA Sunny Central Storage 2500",
        },
    ]
