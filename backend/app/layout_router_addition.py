# Instructions for wiring the layout router into main.py
#
# Add the following two lines to backend/app/main.py:
#
#   from .routers import layout
#   app.include_router(layout.router)
#
# Example updated imports section in main.py:
#
#   from .routers import sites, components, calculations, reports, layout
#
#   app.include_router(sites.router, prefix="/api")
#   app.include_router(components.router, prefix="/api")
#   app.include_router(calculations.router, prefix="/api")
#   app.include_router(reports.router, prefix="/api")
#   app.include_router(layout.router)   # <-- add this (prefix already set in router)
#
# The layout router is mounted at /api/layout with the following endpoints:
#   POST /api/layout/generate  - auto-generate a site layout
#   GET  /api/layout/templates - list standard templates
