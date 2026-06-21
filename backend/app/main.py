from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .database import engine, Base
from .routers import sites, components, calculations, reports, excel_export, layout, catalog

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BESS Site Planning API",
    version="1.0.0",
    description="Backend API for BESS site drawing, modeling, and engineering calculations.",
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

app.include_router(sites.router, prefix="/api")
app.include_router(components.router, prefix="/api")
app.include_router(calculations.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(excel_export.router, prefix="/api")
app.include_router(layout.router)
app.include_router(catalog.router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(status_code=500, content={"detail": str(exc), "type": type(exc).__name__})
