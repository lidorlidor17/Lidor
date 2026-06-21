# Reservoir Site Drawing & Modeling Software

## Overview
Web application for drawing and modeling water reservoir sites with 2D/3D capabilities and engineering reports.

## Stack
- **Frontend**: React 18 + TypeScript, Konva.js (2D drawing), Three.js (3D), Zustand (state)
- **Backend**: Python 3.11, FastAPI, SQLAlchemy, PostgreSQL/PostGIS
- **Reports**: ReportLab (PDF generation)

## Project Structure
```
/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # API routes
│   │   ├── services/      # Business logic & hydrology calculations
│   │   └── schemas/       # Pydantic schemas
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Canvas2D/  # 2D drawing tools
│   │   │   ├── Canvas3D/  # Three.js 3D view
│   │   │   ├── Toolbar/   # Drawing toolbar
│   │   │   └── Reports/   # Report generation UI
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/         # Zustand state management
│   │   └── utils/
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## Core Features
1. **2D Drawing**: Site plan, cross-sections, contour lines
2. **3D Visualization**: Three.js terrain/reservoir 3D model
3. **Hydrology Calculations**: Volume, area, water level curves
4. **Reports**: PDF export with drawings and calculations
