from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import sites, components, calculations, reports, excel_export

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BESS Site Planning API",
    version="1.0.0",
    description="Backend API for BESS site drawing, modeling, and engineering calculations.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sites.router, prefix="/api")
app.include_router(components.router, prefix="/api")
app.include_router(calculations.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(excel_export.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
