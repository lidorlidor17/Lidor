# BESS Site Planning API - Specification

Base URL: `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

## Authentication
None (development mode). Add API key for production.

## Endpoints

### Sites
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/sites | List all sites |
| POST | /api/sites | Create new site |
| GET | /api/sites/{id} | Get site details |
| PUT | /api/sites/{id} | Update site |
| DELETE | /api/sites/{id} | Delete site |
| PUT | /api/sites/{id}/drawing | Update drawing data |

### Components
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/sites/{id}/components | List site components |
| POST | /api/sites/{id}/components | Add component |
| PUT | /api/sites/{id}/components/{cid} | Update component |
| DELETE | /api/sites/{id}/components/{cid} | Delete component |
| POST | /api/sites/{id}/components/bulk | Bulk replace components |

### Calculations
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/calculations/capacity | BESS capacity calculation |
| POST | /api/calculations/land-use | Land use breakdown |
| POST | /api/calculations/cable-sizing | Cable size calculation |
| POST | /api/calculations/cost-estimate | Cost estimation |

### Reports
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/reports/generate/{id} | Generate PDF report |
| GET | /api/export/excel/{id} | Export Excel workbook |

### Catalog (Electrical Engineering)
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/catalog/batteries | List battery models |
| GET | /api/catalog/pcs | List PCS models |
| GET | /api/catalog/transformers | List transformer models |
| POST | /api/catalog/calculations/short-circuit | Short circuit calc |
| POST | /api/catalog/calculations/protection | Protection settings |
| POST | /api/catalog/calculations/power-quality | Power quality assessment |
| POST | /api/catalog/calculations/grounding | Grounding system design |

### Layout Generator
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/layout/generate | Auto-generate site layout |
| GET | /api/layout/templates | Get standard templates |

## Data Models

### BESSSite
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string|null",
  "location": "string|null",
  "target_capacity_mwh": "float|null",
  "target_power_mw": "float|null",
  "site_area_m2": "float|null",
  "drawing_data": "object|null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### BESSComponent
```json
{
  "id": "uuid",
  "site_id": "uuid",
  "component_type": "battery_container|pcs|transformer|control_room|substation|fence|road|text_annotation|boundary",
  "label": "string",
  "x": "float",
  "y": "float",
  "width": "float",
  "height": "float",
  "rotation": "float",
  "properties": "object"
}
```
