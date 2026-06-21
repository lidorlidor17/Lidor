import io
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import (
    Font, PatternFill, Alignment, Border, Side,
)
from openpyxl.utils import get_column_letter


def generate_bess_excel(site_data: dict, components: list) -> bytes:
    """
    Generate a comprehensive Excel workbook for a BESS site.
    Returns bytes of the .xlsx file.

    site_data: {name, location, description, target_capacity_mwh, target_power_mw, site_area_m2}
    components: list of component dicts from DB
    """
    wb = Workbook()

    # Color scheme
    DARK_BLUE = "1E3A5F"
    ELECTRIC_YELLOW = "F0C040"
    LIGHT_GREY = "F5F5F5"
    MED_GREY = "CCCCCC"
    GREEN = "2ECC71"

    # Sheet 1: Site Summary
    _create_summary_sheet(wb.active, site_data, components, DARK_BLUE, ELECTRIC_YELLOW)
    wb.active.title = "סיכום אתר"

    # Sheet 2: Bill of Materials
    bom_sheet = wb.create_sheet("רשימת חומרים (BOM)")
    _create_bom_sheet(bom_sheet, components, DARK_BLUE, ELECTRIC_YELLOW)

    # Sheet 3: Calculations
    calc_sheet = wb.create_sheet("חישובים הנדסיים")
    _create_calculations_sheet(calc_sheet, site_data, components, DARK_BLUE, ELECTRIC_YELLOW)

    # Sheet 4: Energy Analysis
    energy_sheet = wb.create_sheet("ניתוח אנרגיה")
    _create_energy_analysis_sheet(energy_sheet, site_data, components, DARK_BLUE)

    # Sheet 5: Cost Estimate
    cost_sheet = wb.create_sheet("הערכת עלות")
    _create_cost_sheet(cost_sheet, components, DARK_BLUE, ELECTRIC_YELLOW)

    # Save to bytes
    output = io.BytesIO()
    wb.save(output)
    return output.getvalue()


def _apply_header_style(cell, dark_blue, yellow):
    cell.font = Font(bold=True, color="FFFFFF", size=11)
    cell.fill = PatternFill("solid", fgColor=dark_blue)
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)


def _apply_subheader_style(cell, yellow):
    cell.font = Font(bold=True, color="000000", size=10)
    cell.fill = PatternFill("solid", fgColor=yellow)
    cell.alignment = Alignment(horizontal="center", vertical="center")


def _create_summary_sheet(ws, site_data, components, dark_blue, yellow):
    ws.sheet_view.rightToLeft = True  # RTL for Hebrew

    # Title
    ws.merge_cells("A1:F1")
    title_cell = ws["A1"]
    title_cell.value = f"BESS Site Summary - {site_data.get('name', 'N/A')}"
    title_cell.font = Font(bold=True, size=16, color="FFFFFF")
    title_cell.fill = PatternFill("solid", fgColor=dark_blue)
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 40

    # Date
    ws["A2"] = f"תאריך: {datetime.now().strftime('%d/%m/%Y')}"
    ws["A2"].font = Font(italic=True, color="666666")

    # Site info table (rows 4-12)
    info = [
        ("שם האתר", site_data.get("name", "N/A")),
        ("מיקום", site_data.get("location", "N/A")),
        ("קיבולת יעד", f"{site_data.get('target_capacity_mwh', 0):.1f} MWh"),
        ("הספק יעד", f"{site_data.get('target_power_mw', 0):.1f} MW"),
        ("שטח האתר", f"{site_data.get('site_area_m2', 0):,.0f} m²"),
        ("מספר מכלי סוללות", str(sum(1 for c in components if c.get("component_type") == "battery_container"))),
        ("מספר יחידות PCS", str(sum(1 for c in components if c.get("component_type") == "pcs"))),
        ('סה"כ רכיבים', str(len(components))),
    ]

    ws["A4"] = "פרטי האתר"
    _apply_subheader_style(ws["A4"], yellow)
    ws.merge_cells("A4:B4")

    for i, (label, value) in enumerate(info):
        row = 5 + i
        ws[f"A{row}"] = label
        ws[f"A{row}"].font = Font(bold=True)
        ws[f"B{row}"] = value
        if i % 2 == 0:
            ws[f"A{row}"].fill = PatternFill("solid", fgColor="F0F4FF")
            ws[f"B{row}"].fill = PatternFill("solid", fgColor="F0F4FF")

    # Set column widths
    ws.column_dimensions["A"].width = 25
    ws.column_dimensions["B"].width = 20
    ws.column_dimensions["C"].width = 15
    ws.column_dimensions["D"].width = 15
    ws.column_dimensions["E"].width = 15
    ws.column_dimensions["F"].width = 15


def _create_bom_sheet(ws, components, dark_blue, yellow):
    ws.sheet_view.rightToLeft = True

    # Title
    ws.merge_cells("A1:G1")
    ws["A1"].value = "רשימת חומרים - Bill of Materials"
    ws["A1"].font = Font(bold=True, size=14, color="FFFFFF")
    ws["A1"].fill = PatternFill("solid", fgColor=dark_blue)
    ws["A1"].alignment = Alignment(horizontal="center")
    ws.row_dimensions[1].height = 30

    # Headers
    headers = ["#", "סוג רכיב", "תווית", "קיבולת/הספק", "כמות", "הערות", "תקן"]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=2, column=col, value=header)
        _apply_header_style(cell, dark_blue, yellow)
    ws.row_dimensions[2].height = 25

    # Component type labels
    type_labels = {
        "battery_container": "מכל סוללות",
        "pcs": "ממיר PCS",
        "transformer": "שנאי",
        "control_room": "חדר בקרה",
        "substation": "תחנת משנה",
        "fence": "גדר",
        "road": "דרך גישה",
        "text_annotation": "הערה",
        "boundary": "גבול אתר",
    }

    for i, comp in enumerate(components):
        row = 3 + i
        comp_type = comp.get("component_type", "")
        props = comp.get("properties", {}) or {}

        # Power/capacity display
        if comp_type == "battery_container":
            spec = f"{props.get('capacity_kwh', 250)} kWh"
        elif comp_type == "pcs":
            spec = f"{props.get('power_kw', 250)} kW"
        elif comp_type == "transformer":
            spec = f"{props.get('voltage_kv', 33)} kV"
        else:
            spec = "-"

        ws.cell(row=row, column=1, value=i + 1)
        ws.cell(row=row, column=2, value=type_labels.get(comp_type, comp_type))
        ws.cell(row=row, column=3, value=comp.get("label", ""))
        ws.cell(row=row, column=4, value=spec)
        ws.cell(row=row, column=5, value=1)
        ws.cell(row=row, column=6, value=props.get("notes", ""))
        ws.cell(
            row=row,
            column=7,
            value=(
                "IEC 62619"
                if comp_type == "battery_container"
                else ("IEC 62477" if comp_type == "pcs" else "-")
            ),
        )

        if i % 2 == 0:
            for col in range(1, 8):
                ws.cell(row=row, column=col).fill = PatternFill("solid", fgColor="F9F9F9")

    # Totals row
    total_row = 3 + len(components)
    ws.cell(row=total_row, column=1, value='סה"כ רכיבים:')
    ws.cell(row=total_row, column=5, value=len(components))
    for col in range(1, 8):
        ws.cell(row=total_row, column=col).font = Font(bold=True)
        ws.cell(row=total_row, column=col).fill = PatternFill("solid", fgColor=yellow)

    # Column widths
    widths = [5, 20, 20, 18, 10, 25, 15]
    for col, width in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(col)].width = width


def _create_calculations_sheet(ws, site_data, components, dark_blue, yellow):
    ws.sheet_view.rightToLeft = True

    ws.merge_cells("A1:E1")
    ws["A1"].value = "חישובים הנדסיים"
    ws["A1"].font = Font(bold=True, size=14, color="FFFFFF")
    ws["A1"].fill = PatternFill("solid", fgColor=dark_blue)
    ws["A1"].alignment = Alignment(horizontal="center")
    ws.row_dimensions[1].height = 30

    # Calculate values
    battery_comps = [c for c in components if c.get("component_type") == "battery_container"]
    pcs_comps = [c for c in components if c.get("component_type") == "pcs"]

    total_kwh = sum((c.get("properties") or {}).get("capacity_kwh", 250) for c in battery_comps)
    total_kw_bat = sum((c.get("properties") or {}).get("power_kw", 125) for c in battery_comps)
    total_kw_pcs = sum((c.get("properties") or {}).get("power_kw", 250) for c in pcs_comps)
    total_kw = min(total_kw_bat, total_kw_pcs) if (total_kw_bat and total_kw_pcs) else (total_kw_bat or total_kw_pcs)
    c_rate = total_kw / total_kwh if total_kwh > 0 else 0

    site_area = site_data.get("site_area_m2", 0) or 0
    battery_footprint = len(battery_comps) * 14.4  # 6m x 2.4m per container
    land_utilization = (
        f"{(battery_footprint / site_area) * 100:.1f}%"
        if site_area > 0
        else "N/A"
    )

    calcs = [
        ("סיכום קיבולת אנרגיה", "", ""),
        ("קיבולת כוללת (kWh)", total_kwh, "kWh"),
        ("קיבולת כוללת (MWh)", round(total_kwh / 1000, 3), "MWh"),
        ("הספק כולל (kW)", total_kw, "kW"),
        ("הספק כולל (MW)", round(total_kw / 1000, 3), "MW"),
        ("C-Rate", round(c_rate, 3), "h⁻¹"),
        ("זמן פריקה", round(1 / c_rate, 1) if c_rate > 0 else 0, "שעות"),
        ("", "", ""),
        ("שימוש בקרקע", "", ""),
        ("שטח האתר", site_area, "m²"),
        ("שטח מכלי סוללות", battery_footprint, "m² (6m\xd72.4m)"),
        ("ניצולת שטח", land_utilization, ""),
        ("", "", ""),
        ("הערכת ביצועים", "", ""),
        ("יעילות Round-trip", "92.5%", ""),
        ("אנרגיה שימושית", round(total_kwh * 0.925 / 1000, 2), "MWh/מחזור"),
        ("מחזורים/שנה", 365, ""),
        ("אנרגיה שנתית", round(total_kwh * 0.925 * 365 / 1000, 0), "MWh/שנה"),
    ]

    row = 2
    for label, value, unit in calcs:
        if not label:
            row += 1
            continue
        if not value and not unit:  # Section header
            ws.cell(row=row, column=1, value=label).font = Font(bold=True, size=11)
            ws.cell(row=row, column=1).fill = PatternFill("solid", fgColor=yellow)
            ws.merge_cells(f"A{row}:C{row}")
            row += 1
            continue
        ws.cell(row=row, column=1, value=label).font = Font(bold=True)
        ws.cell(row=row, column=2, value=value)
        ws.cell(row=row, column=3, value=unit).font = Font(color="666666")
        if row % 2 == 0:
            for col in range(1, 4):
                ws.cell(row=row, column=col).fill = PatternFill("solid", fgColor="F5F5F5")
        row += 1

    ws.column_dimensions["A"].width = 30
    ws.column_dimensions["B"].width = 18
    ws.column_dimensions["C"].width = 15


def _create_energy_analysis_sheet(ws, site_data, components, dark_blue):
    ws.sheet_view.rightToLeft = True

    ws["A1"] = "ניתוח אנרגיה שנתי"
    ws["A1"].font = Font(bold=True, size=14, color="FFFFFF")
    ws["A1"].fill = PatternFill("solid", fgColor=dark_blue)
    ws.merge_cells("A1:C1")
    ws.row_dimensions[1].height = 30

    # Monthly energy table headers
    headers = ["חודש", "מחזורים", "אנרגיה (MWh)"]
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=2, column=col, value=h)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor=dark_blue)
        cell.alignment = Alignment(horizontal="center")

    months = [
        "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
        "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
    ]
    cycles = [28, 25, 30, 29, 31, 30, 31, 30, 29, 30, 28, 28]

    battery_comps = [c for c in components if c.get("component_type") == "battery_container"]
    total_kwh = sum((c.get("properties") or {}).get("capacity_kwh", 250) for c in battery_comps)

    for i, (month, cycle) in enumerate(zip(months, cycles)):
        row = 3 + i
        energy = round(total_kwh * cycle * 0.925 / 1000, 1)
        ws.cell(row=row, column=1, value=month)
        ws.cell(row=row, column=2, value=cycle)
        ws.cell(row=row, column=3, value=energy)
        if i % 2 == 0:
            for col in range(1, 4):
                ws.cell(row=row, column=col).fill = PatternFill("solid", fgColor="F5F5F5")

    # Total row
    total_row = 15
    total_energy = round(total_kwh * sum(cycles) * 0.925 / 1000, 0)
    ws.cell(row=total_row, column=1, value='סה"כ').font = Font(bold=True)
    ws.cell(row=total_row, column=2, value=sum(cycles)).font = Font(bold=True)
    ws.cell(row=total_row, column=3, value=total_energy).font = Font(bold=True)
    for col in range(1, 4):
        ws.cell(row=total_row, column=col).fill = PatternFill("solid", fgColor="F0C040")
        ws.cell(row=total_row, column=col).font = Font(bold=True)

    ws.column_dimensions["A"].width = 15
    ws.column_dimensions["B"].width = 12
    ws.column_dimensions["C"].width = 18


def _create_cost_sheet(ws, components, dark_blue, yellow):
    ws.sheet_view.rightToLeft = True

    ws.merge_cells("A1:D1")
    ws["A1"].value = "הערכת עלות ראשונית (USD)"
    ws["A1"].font = Font(bold=True, size=14, color="FFFFFF")
    ws["A1"].fill = PatternFill("solid", fgColor=dark_blue)
    ws["A1"].alignment = Alignment(horizontal="center")
    ws.row_dimensions[1].height = 30

    battery_comps = [c for c in components if c.get("component_type") == "battery_container"]
    pcs_comps = [c for c in components if c.get("component_type") == "pcs"]

    total_kwh = sum((c.get("properties") or {}).get("capacity_kwh", 250) for c in battery_comps)
    total_kw = sum((c.get("properties") or {}).get("power_kw", 250) for c in pcs_comps)

    battery_cost = total_kwh * 250
    pcs_cost = total_kw * 50
    electrical_cost = total_kwh * 30
    civil_cost = total_kwh * 20
    scada_cost = 150000
    subtotal = battery_cost + pcs_cost + electrical_cost + civil_cost + scada_cost
    engineering_cost = subtotal * 0.05
    contingency_cost = (subtotal + engineering_cost) * 0.10
    total_cost = subtotal + engineering_cost + contingency_cost

    costs = [
        ("סוללות", battery_cost, f"{total_kwh:.0f} kWh \xd7 $250/kWh"),
        ("PCS / ממירים", pcs_cost, f"{total_kw:.0f} kW \xd7 $50/kW"),
        ("שנאי ותשתית חשמלית", electrical_cost, f"{total_kwh:.0f} kWh \xd7 $30/kWh"),
        ("עבודות אזרחיות", civil_cost, f"{total_kwh:.0f} kWh \xd7 $20/kWh"),
        ('בקרה ותוכנה (SCADA)', scada_cost, "Lump sum"),
        ('תכנון והנדסה (5%)', engineering_cost, 'סה"כ 5% מ'),
        ('בלת"מ (10%)', contingency_cost, "10%"),
    ]

    headers = ["פריט", "עלות ($)", "בסיס חישוב", "הערות"]
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=2, column=col, value=h)
        _apply_header_style(cell, dark_blue, yellow)
    ws.row_dimensions[2].height = 25

    for i, (item, cost, basis) in enumerate(costs):
        row = 3 + i
        ws.cell(row=row, column=1, value=item)
        cost_cell = ws.cell(row=row, column=2, value=round(cost))
        cost_cell.number_format = "#,##0"
        ws.cell(row=row, column=3, value=basis)
        if i % 2 == 0:
            for col in range(1, 5):
                ws.cell(row=row, column=col).fill = PatternFill("solid", fgColor="F9F9F9")

    # Total row
    total_row = 3 + len(costs)
    ws.cell(row=total_row, column=1, value='סה"כ עלות מוערכת').font = Font(bold=True, size=12)
    total_cell = ws.cell(row=total_row, column=2, value=round(total_cost))
    total_cell.font = Font(bold=True, size=12)
    total_cell.number_format = "#,##0"
    for col in range(1, 5):
        ws.cell(row=total_row, column=col).fill = PatternFill("solid", fgColor=yellow)

    # Per kWh row
    per_kwh_row = total_row + 1
    ws.cell(row=per_kwh_row, column=1, value="עלות ל-kWh").font = Font(italic=True)
    per_kwh_cell = ws.cell(
        row=per_kwh_row,
        column=2,
        value=round(total_cost / total_kwh) if total_kwh > 0 else 0,
    )
    per_kwh_cell.font = Font(italic=True)
    per_kwh_cell.number_format = "#,##0"
    ws.cell(row=per_kwh_row, column=3, value="$/kWh").font = Font(italic=True, color="666666")

    ws.column_dimensions["A"].width = 28
    ws.column_dimensions["B"].width = 18
    ws.column_dimensions["C"].width = 25
    ws.column_dimensions["D"].width = 20
