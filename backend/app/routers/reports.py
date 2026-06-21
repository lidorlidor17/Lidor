import io
from datetime import datetime
from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    PageBreak,
)
from reportlab.platypus.flowables import KeepTogether

from ..database import get_db
from ..models.bess_site import BESSSite, BESSComponent
from ..services.bess_calculations import (
    calculate_site_capacity,
    calculate_land_use,
    estimate_project_cost,
)

router = APIRouter(prefix="/reports", tags=["reports"])

# Colour palette
DARK_BLUE = colors.HexColor("#1a3a5c")
MED_BLUE = colors.HexColor("#2563eb")
LIGHT_BLUE = colors.HexColor("#dbeafe")
LIGHT_GREY = colors.HexColor("#f3f4f6")
MID_GREY = colors.HexColor("#6b7280")
WHITE = colors.white
BLACK = colors.black

PAGE_W, PAGE_H = A4
MARGIN = 2 * cm


def _build_styles():
    styles = getSampleStyleSheet()
    custom = {
        "ReportTitle": ParagraphStyle(
            "ReportTitle",
            fontSize=26,
            fontName="Helvetica-Bold",
            textColor=WHITE,
            spaceAfter=6,
            alignment=TA_CENTER,
        ),
        "ReportSubtitle": ParagraphStyle(
            "ReportSubtitle",
            fontSize=14,
            fontName="Helvetica",
            textColor=LIGHT_BLUE,
            spaceAfter=4,
            alignment=TA_CENTER,
        ),
        "CoverMeta": ParagraphStyle(
            "CoverMeta",
            fontSize=11,
            fontName="Helvetica",
            textColor=WHITE,
            spaceAfter=3,
            alignment=TA_CENTER,
        ),
        "SectionHeader": ParagraphStyle(
            "SectionHeader",
            fontSize=13,
            fontName="Helvetica-Bold",
            textColor=DARK_BLUE,
            spaceBefore=14,
            spaceAfter=6,
        ),
        "BodyText": ParagraphStyle(
            "BodyText",
            fontSize=9,
            fontName="Helvetica",
            textColor=BLACK,
            spaceAfter=4,
            leading=14,
        ),
        "TableHeader": ParagraphStyle(
            "TableHeader",
            fontSize=9,
            fontName="Helvetica-Bold",
            textColor=WHITE,
            alignment=TA_CENTER,
        ),
        "TableCell": ParagraphStyle(
            "TableCell",
            fontSize=9,
            fontName="Helvetica",
            textColor=BLACK,
            alignment=TA_LEFT,
        ),
        "TableCellRight": ParagraphStyle(
            "TableCellRight",
            fontSize=9,
            fontName="Helvetica",
            textColor=BLACK,
            alignment=TA_RIGHT,
        ),
        "Footer": ParagraphStyle(
            "Footer",
            fontSize=8,
            fontName="Helvetica",
            textColor=MID_GREY,
            alignment=TA_CENTER,
        ),
        "Disclaimer": ParagraphStyle(
            "Disclaimer",
            fontSize=8,
            fontName="Helvetica-Oblique",
            textColor=MID_GREY,
            spaceAfter=4,
            alignment=TA_CENTER,
        ),
    }
    for name, style in custom.items():
        styles.add(style)
    return styles


def _table_style(header_rows: int = 1) -> TableStyle:
    return TableStyle(
        [
            # Header rows
            ("BACKGROUND", (0, 0), (-1, header_rows - 1), DARK_BLUE),
            ("TEXTCOLOR", (0, 0), (-1, header_rows - 1), WHITE),
            ("FONTNAME", (0, 0), (-1, header_rows - 1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, header_rows - 1), 9),
            ("ALIGN", (0, 0), (-1, header_rows - 1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            # Data rows alternating
            ("ROWBACKGROUNDS", (0, header_rows), (-1, -1), [WHITE, LIGHT_GREY]),
            ("FONTNAME", (0, header_rows), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, header_rows), (-1, -1), 9),
            ("ALIGN", (1, header_rows), (-1, -1), "RIGHT"),
            ("ALIGN", (0, header_rows), (0, -1), "LEFT"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ]
    )


def _cover_page(site: BESSSite, styles) -> list:
    elements = []

    # Dark header band (simulated with a table)
    cover_data = [
        [Paragraph("PRELIMINARY ENGINEERING REPORT", styles["ReportTitle"])],
        [Paragraph("Battery Energy Storage System (BESS) Site Planning", styles["ReportSubtitle"])],
        [Spacer(1, 8)],
        [Paragraph(f"Site Name:&nbsp;&nbsp;<b>{site.name}</b>", styles["CoverMeta"])],
    ]
    if site.location:
        cover_data.append([Paragraph(f"Location:&nbsp;&nbsp;{site.location}", styles["CoverMeta"])])
    if site.description:
        cover_data.append([Paragraph(f"Description:&nbsp;&nbsp;{site.description}", styles["CoverMeta"])])
    cover_data.append([Spacer(1, 4)])
    cover_data.append(
        [Paragraph(f"Report Date:&nbsp;&nbsp;{datetime.utcnow().strftime('%B %d, %Y')}", styles["CoverMeta"])]
    )
    cover_data.append([Paragraph("Document Status:&nbsp;&nbsp;PRELIMINARY – FOR REVIEW ONLY", styles["CoverMeta"])])

    col_width = PAGE_W - 2 * MARGIN
    cover_table = Table(cover_data, colWidths=[col_width])
    cover_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), DARK_BLUE),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 20),
                ("RIGHTPADDING", (0, 0), (-1, -1), 20),
            ]
        )
    )
    elements.append(Spacer(1, 1.5 * cm))
    elements.append(cover_table)
    elements.append(Spacer(1, 1 * cm))

    # Disclaimer box
    disclaimer_text = (
        "This report has been generated automatically by ResWater BESS Planning Software. "
        "All calculations are estimates based on the provided component data and standard engineering assumptions. "
        "This document is preliminary and must be reviewed and verified by a qualified electrical engineer "
        "before use in any construction or procurement activities."
    )
    elements.append(
        Table(
            [[Paragraph(disclaimer_text, styles["Disclaimer"])]],
            colWidths=[col_width],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BLUE),
                    ("BOX", (0, 0), (-1, -1), 1, MED_BLUE),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("LEFTPADDING", (0, 0), (-1, -1), 12),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ]
            ),
        )
    )
    elements.append(PageBreak())
    return elements


def _summary_section(site: BESSSite, capacity, cost, styles) -> list:
    elements = []
    elements.append(Paragraph("1. Project Summary", styles["SectionHeader"]))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=DARK_BLUE, spaceAfter=8))

    col_w = (PAGE_W - 2 * MARGIN) / 2 - 5

    summary_rows = [
        ["Parameter", "Value", "Parameter", "Value"],
        ["Site Name", site.name, "Energy Capacity", f"{capacity.total_capacity_mwh:.2f} MWh"],
        [
            "Location",
            site.location or "—",
            "Peak Power",
            f"{capacity.total_power_mw:.2f} MW",
        ],
        [
            "Target Capacity",
            f"{site.target_capacity_mwh:.1f} MWh" if site.target_capacity_mwh else "—",
            "C-Rate",
            f"{capacity.c_rate:.2f} C",
        ],
        [
            "Target Power",
            f"{site.target_power_mw:.1f} MW" if site.target_power_mw else "—",
            "Round-Trip Efficiency",
            f"{capacity.estimated_efficiency * 100:.1f}%",
        ],
        [
            "Site Area",
            f"{capacity.site_area_m2:,.0f} m²" if capacity.site_area_m2 else "—",
            "Energy Density",
            f"{capacity.energy_density_mwh_per_ha:.1f} MWh/ha",
        ],
        [
            "Battery Containers",
            str(capacity.num_battery_containers),
            "PCS Units",
            str(capacity.num_pcs_units),
        ],
        [
            "Estimated Total Cost",
            f"${cost['total_cost']:,.0f}",
            "Cost per kWh",
            f"${cost['cost_per_kwh']:.0f}/kWh",
        ],
    ]

    col_widths = [col_w * 0.45, col_w * 0.55, col_w * 0.45, col_w * 0.55]
    summary_table = Table(summary_rows, colWidths=col_widths)
    summary_table.setStyle(
        TableStyle(
            [
                # Header row
                ("BACKGROUND", (0, 0), (-1, 0), DARK_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                # Label columns (0 and 2) bold
                ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (2, 1), (2, -1), "Helvetica-Bold"),
                ("BACKGROUND", (0, 1), (0, -1), LIGHT_GREY),
                ("BACKGROUND", (2, 1), (2, -1), LIGHT_GREY),
                ("ROWBACKGROUNDS", (1, 1), (1, -1), [WHITE, LIGHT_GREY]),
                ("ROWBACKGROUNDS", (3, 1), (3, -1), [WHITE, LIGHT_GREY]),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    elements.append(summary_table)
    elements.append(Spacer(1, 0.5 * cm))
    return elements


def _component_section(components: list, styles) -> list:
    elements = []
    elements.append(Paragraph("2. Component List", styles["SectionHeader"]))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=DARK_BLUE, spaceAfter=8))

    # Aggregate components by type
    aggregated: dict[str, dict] = {}
    for comp in components:
        ctype = comp.get("component_type", "unknown")
        props = comp.get("properties", {}) or {}
        qty = int(props.get("quantity", 1))

        if ctype not in aggregated:
            aggregated[ctype] = {
                "count": 0,
                "capacity_kwh_each": props.get("capacity_kwh"),
                "power_kw_each": props.get("power_kw"),
                "label": comp.get("label", ""),
            }
        aggregated[ctype]["count"] += qty

    COMPONENT_LABELS = {
        "battery_container": "Battery Container",
        "pcs": "Power Conversion System (PCS)",
        "transformer": "MV Transformer",
        "control_room": "Control Room / SCADA",
        "substation": "Substation",
        "fence": "Security Fencing",
        "road": "Access Road",
        "annotation": "Annotation",
    }

    header = ["Component Type", "Qty", "Unit Capacity", "Unit Power", "Total Capacity", "Total Power"]
    rows = [header]

    for ctype, info in aggregated.items():
        label = COMPONENT_LABELS.get(ctype, ctype.replace("_", " ").title())
        qty = info["count"]
        cap_each = info.get("capacity_kwh_each")
        pwr_each = info.get("power_kw_each")

        unit_cap = f"{cap_each:.0f} kWh" if cap_each is not None else "—"
        unit_pwr = f"{pwr_each:.0f} kW" if pwr_each is not None else "—"
        total_cap = f"{cap_each * qty / 1000:.2f} MWh" if cap_each is not None else "—"
        total_pwr = f"{pwr_each * qty / 1000:.2f} MW" if pwr_each is not None else "—"

        rows.append([label, str(qty), unit_cap, unit_pwr, total_cap, total_pwr])

    col_widths_comp = [None, 30, 70, 70, 80, 80]
    # Distribute remaining width
    total_fixed = sum(w for w in col_widths_comp if w is not None)
    remaining = PAGE_W - 2 * MARGIN - total_fixed
    col_widths_comp[0] = remaining

    comp_table = Table(rows, colWidths=col_widths_comp)
    comp_table.setStyle(_table_style(header_rows=1))
    elements.append(comp_table)
    elements.append(Spacer(1, 0.5 * cm))
    return elements


def _land_use_section(land_use, styles) -> list:
    elements = []
    elements.append(Paragraph("3. Land Use Breakdown", styles["SectionHeader"]))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=DARK_BLUE, spaceAfter=8))

    rows = [
        ["Land Use Category", "Area (m²)", "Percentage"],
        ["Battery Containers", f"{land_use.battery_area_m2:,.1f}", _pct(land_use.battery_area_m2, land_use.total_area_m2)],
        ["PCS Equipment", f"{land_use.pcs_area_m2:,.1f}", _pct(land_use.pcs_area_m2, land_use.total_area_m2)],
        ["Infrastructure", f"{land_use.infrastructure_area_m2:,.1f}", _pct(land_use.infrastructure_area_m2, land_use.total_area_m2)],
        [
            "Unassigned / Civil",
            f"{max(0, land_use.total_area_m2 - land_use.battery_area_m2 - land_use.pcs_area_m2 - land_use.infrastructure_area_m2):,.1f}",
            _pct(
                max(0, land_use.total_area_m2 - land_use.battery_area_m2 - land_use.pcs_area_m2 - land_use.infrastructure_area_m2),
                land_use.total_area_m2,
            ),
        ],
        ["TOTAL", f"{land_use.total_area_m2:,.1f}", "100.0%"],
    ]

    col_w = (PAGE_W - 2 * MARGIN) / 3
    land_table = Table(rows, colWidths=[col_w * 1.5, col_w * 0.8, col_w * 0.7])
    land_table.setStyle(_table_style(header_rows=1))
    # Bold last row (totals)
    land_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                ("BACKGROUND", (0, -1), (-1, -1), LIGHT_BLUE),
            ]
        )
    )
    elements.append(land_table)

    util_text = (
        f"Equipment utilization: {land_use.utilization_percent:.1f}% of total site area is occupied by "
        f"battery containers, PCS, and infrastructure equipment."
    )
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(util_text, styles["BodyText"]))
    elements.append(Spacer(1, 0.5 * cm))
    return elements


def _cost_section(cost: dict, capacity, styles) -> list:
    elements = []
    elements.append(Paragraph("4. Preliminary Cost Estimate", styles["SectionHeader"]))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=DARK_BLUE, spaceAfter=8))

    rows = [
        ["Cost Category", "Basis", "Unit Rate", "Amount (USD)"],
        [
            "Battery Storage",
            f"{capacity.total_capacity_mwh * 1000:,.0f} kWh",
            "$250/kWh",
            f"${cost['battery_cost']:,.0f}",
        ],
        [
            "Power Conversion System",
            f"{capacity.total_power_mw * 1000:,.0f} kW",
            "$50/kW",
            f"${cost['pcs_cost']:,.0f}",
        ],
        [
            "Civil, BOS & EPC",
            f"{capacity.total_capacity_mwh * 1000:,.0f} kWh",
            "$30/kWh",
            f"${cost['civil_cost']:,.0f}",
        ],
        ["TOTAL PROJECT COST", "", "", f"${cost['total_cost']:,.0f}"],
        ["Cost per kWh", "", "", f"${cost['cost_per_kwh']:.0f}/kWh"],
    ]

    col_w = (PAGE_W - 2 * MARGIN)
    cost_table = Table(rows, colWidths=[col_w * 0.35, col_w * 0.25, col_w * 0.15, col_w * 0.25])
    cost_table.setStyle(_table_style(header_rows=1))
    cost_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, -2), (-1, -2), "Helvetica-Bold"),
                ("BACKGROUND", (0, -2), (-1, -2), LIGHT_BLUE),
                ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ]
        )
    )
    elements.append(cost_table)

    elements.append(Spacer(1, 6))
    elements.append(
        Paragraph(
            "Note: These are order-of-magnitude estimates only. Actual costs will vary based on specific "
            "equipment selection, site conditions, grid connection requirements, and local market rates. "
            "Costs do not include land, permitting, grid connection fees, or financing.",
            styles["Disclaimer"],
        )
    )
    elements.append(Spacer(1, 0.5 * cm))
    return elements


def _assumptions_section(styles) -> list:
    elements = []
    elements.append(Paragraph("5. Engineering Assumptions", styles["SectionHeader"]))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=DARK_BLUE, spaceAfter=8))

    assumptions = [
        ("Battery Technology", "Lithium-ion (LFP chemistry assumed)"),
        ("Round-Trip Efficiency", "87–95% depending on C-rate (see Summary)"),
        ("Default Container Capacity", "250 kWh per battery container (if not specified)"),
        ("Default Container Power", "125 kW per battery container (0.5C default)"),
        ("Cable Current Density", "2.5 A/mm² (copper, free air installation)"),
        ("Cable Resistivity", "0.0175 Ω·mm²/m (copper conductors)"),
        ("Cost Basis – Battery", "USD $250/kWh (2024 market estimate)"),
        ("Cost Basis – PCS", "USD $50/kW"),
        ("Cost Basis – Civil/BOS", "USD $30/kWh"),
        ("Canvas Scale", "1 pixel = 0.1 m (default; adjust in project settings)"),
        ("Coordinate System", "Top-left origin, X right, Y down"),
    ]

    rows = [["Assumption", "Value / Description"]] + [[a, b] for a, b in assumptions]
    col_w = PAGE_W - 2 * MARGIN
    assump_table = Table(rows, colWidths=[col_w * 0.35, col_w * 0.65])
    assump_table.setStyle(_table_style(header_rows=1))
    elements.append(assump_table)
    elements.append(Spacer(1, 0.5 * cm))
    return elements


def _pct(part: float, total: float) -> str:
    if total <= 0:
        return "—"
    return f"{part / total * 100:.1f}%"


def _add_page_number(canvas, doc):
    """Draw page number and footer on every page."""
    canvas.saveState()
    page_num = canvas.getPageNumber()
    footer_text = "Generated by ResWater BESS Planning Software  |  PRELIMINARY – NOT FOR CONSTRUCTION"
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MID_GREY)
    canvas.drawCentredString(PAGE_W / 2, 1.0 * cm, footer_text)
    canvas.drawRightString(PAGE_W - MARGIN, 1.0 * cm, f"Page {page_num}")
    canvas.drawString(MARGIN, 1.0 * cm, datetime.utcnow().strftime("%Y-%m-%d"))
    canvas.restoreState()


def _generate_pdf(site: BESSSite, components: list) -> bytes:
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=MARGIN,
        leftMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=1.8 * cm,
        title=f"BESS Preliminary Report – {site.name}",
        author="ResWater BESS Planning Software",
    )

    styles = _build_styles()

    # Run calculations
    comp_dicts = [
        {
            "component_type": c.component_type,
            "label": c.label,
            "x": c.x,
            "y": c.y,
            "width": c.width,
            "height": c.height,
            "rotation": c.rotation,
            "properties": c.properties or {},
        }
        for c in components
    ]

    capacity = calculate_site_capacity(comp_dicts)
    if site.site_area_m2 and site.site_area_m2 > 0:
        from dataclasses import replace
        capacity = replace(capacity, site_area_m2=site.site_area_m2)
        if capacity.site_area_m2 > 0:
            capacity = replace(
                capacity,
                energy_density_mwh_per_ha=round(
                    capacity.total_capacity_mwh / (capacity.site_area_m2 / 10000.0), 2
                ),
            )

    land_use = calculate_land_use(comp_dicts, site.site_area_m2 or 0.0)
    cost = estimate_project_cost(capacity)

    story = []
    story += _cover_page(site, styles)
    story += _summary_section(site, capacity, cost, styles)
    story += _component_section(comp_dicts, styles)
    story += _land_use_section(land_use, styles)
    story += _cost_section(cost, capacity, styles)
    story += _assumptions_section(styles)

    doc.build(story, onFirstPage=_add_page_number, onLaterPages=_add_page_number)
    buffer.seek(0)
    return buffer.read()


@router.post("/generate/{site_id}")
def generate_report(site_id: str, db: Session = Depends(get_db)):
    """Generate a PDF engineering report for a BESS site."""
    site = db.query(BESSSite).filter(BESSSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    components = (
        db.query(BESSComponent)
        .filter(BESSComponent.site_id == site_id)
        .order_by(BESSComponent.created_at)
        .all()
    )

    pdf_bytes = _generate_pdf(site, components)

    safe_name = "".join(c if c.isalnum() or c in "-_ " else "_" for c in site.name).strip()
    filename = f"BESS_Report_{safe_name}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
