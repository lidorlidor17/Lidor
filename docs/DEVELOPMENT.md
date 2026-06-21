# Development Guide

## Quick Start

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API available at: http://localhost:8000
Swagger UI: http://localhost:8000/docs

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
App available at: http://localhost:5173

### 3. Docker (both services)
```bash
docker-compose up --build
```

## Architecture Decisions

### State Management
Zustand is used for global UI state (active site, components, drawing mode).
React Query (@tanstack/react-query) handles server state (API calls, caching).

### Database
SQLite for development (no setup required). Switch to PostgreSQL for production
by setting DATABASE_URL environment variable.

### 2D Drawing
Konva.js via react-konva provides the canvas-based 2D drawing surface.
Components are stored as objects with position/size, rendered as Konva shapes.

### 3D Visualization
Three.js via @react-three/fiber. Components from the 2D plan are lifted into 3D
space with type-specific box meshes.

### Reports
- PDF: ReportLab (Python) generates engineering PDFs server-side
- Excel: openpyxl generates multi-sheet Excel workbooks server-side

## Adding New Component Types
1. Add type to `ComponentType` union in `frontend/src/types/index.ts`
2. Add defaults to `COMPONENT_DEFAULTS` in `frontend/src/utils/componentDefaults.ts`
3. Add rendering logic to `SitePlanCanvas.tsx`
4. Add 3D rendering to `BESSComponent3D.tsx`
5. Add to type_labels dict in `excel_generator.py`
