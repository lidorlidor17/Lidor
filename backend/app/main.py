from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback

from .database import engine, Base

# Import core router modules
from .routers import sites, components, calculations, reports

# excel_export and layout are now first-class routers (created by other agents)
from .routers import excel_export, layout
has_excel = True
has_layout = True

# Try to import optional routers (created by other agents)
try:
    from .routers import catalog
    has_catalog = True
except ImportError:
    has_catalog = False

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BESS Site Planning API",
    description="API for Battery Energy Storage System site design and modeling",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core routers
app.include_router(sites.router, prefix="/api")
app.include_router(components.router, prefix="/api")
app.include_router(calculations.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(excel_export.router, prefix="/api")
app.include_router(layout.router)  # prefix is /api/layout (already set in router)

# Optional routers
if has_catalog:
    app.include_router(catalog.router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "modules": {
            "catalog": has_catalog,
            "layout": has_layout,
            "excel": has_excel,
        }
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__}
    )
