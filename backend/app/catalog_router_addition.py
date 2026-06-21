# This file documents how the catalog router is wired into main.py.
#
# The following lines are already present in backend/app/main.py:
#
#   from .routers import catalog
#   app.include_router(catalog.router)
#
# Routes exposed under /api/catalog:
#
#   GET  /api/catalog/batteries                  – list battery container products
#   GET  /api/catalog/pcs                        – list PCS / inverter products
#   GET  /api/catalog/transformers               – list transformer products
#
#   POST /api/catalog/calculations/short-circuit – IEC 60909 fault current
#   POST /api/catalog/calculations/protection    – IEC 60255 relay settings
#   POST /api/catalog/calculations/power-quality – EN 50549 PQ assessment
#   POST /api/catalog/calculations/grounding     – IEC 60364-5-54 earthing grid
#   POST /api/catalog/calculations/cable-sizing  – IEC 60364-5-52 cable sizing
