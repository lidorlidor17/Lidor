# BESS Site Drawing & Modeling Software
# תוכנה לשרטוט ומידול אתרי אגירת חשמל (BESS)

## Overview
Web application for drawing, planning, and modeling Battery Energy Storage System (BESS) sites.
Enables site layout design, electrical modeling, capacity calculations, and engineering report generation.

## Stack
- **Frontend**: React 18 + TypeScript, Konva.js (2D site plan drawing), Three.js (3D visualization), Zustand (state)
- **Backend**: Python 3.11, FastAPI, SQLAlchemy, SQLite (dev)
- **Reports**: ReportLab (PDF engineering reports)

## Project Structure
```
/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── routers/       # FastAPI route handlers
│   │   ├── services/      # Business logic & BESS calculations
│   │   └── schemas/       # Pydantic request/response schemas
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas2D/  # 2D site plan drawing (Konva)
│   │   │   ├── Canvas3D/  # Three.js 3D site visualization
│   │   │   ├── Toolbar/   # Drawing toolbar & component palette
│   │   │   ├── Reports/   # Report generation UI
│   │   │   └── Layout/    # App layout components
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/         # Zustand global state
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## BESS Site Components (placeable on site plan)
- **Battery Containers**: 20ft/40ft shipping container-sized battery units (e.g. 250kWh/500kWh each)
- **PCS (Power Conversion System)**: Inverters/converters connecting batteries to grid
- **MV Transformer**: Step-up transformer to medium voltage (11kV/33kV)
- **Control Room / SCADA**: Control building
- **Substation**: Grid connection point
- **Fencing & Security**: Site perimeter
- **Access Roads**: Internal site roads
- **Fire Suppression**: Fire detection and suppression areas
- **Grounding Grid**: Earthing system area

## Core Features
1. **2D Site Plan**: Drag-and-drop BESS components onto site plan, draw boundaries, roads
2. **3D Visualization**: 3D view of the BESS site with containers and buildings
3. **BESS Calculations**: Total capacity (MWh), power (MW), efficiency, C-rate, land use density
4. **Electrical Single-Line**: Simplified single-line diagram viewer
5. **Reports**: PDF engineering reports with site plan, calculations, component list
