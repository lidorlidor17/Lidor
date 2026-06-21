# ⚡ BESS Planner - Project Charter
# מנהל הפרויקט: AI Agent Team

## Vision
תוכנת תכנון אתרי אגירת חשמל (BESS) מקצועית המאפשרת למהנדסים לתכנן, לשרטט ולמדל
אתרי Battery Energy Storage System בצורה מהירה ומדויקת.

## Problem Statement
תכנון אתרי BESS דורש תיאום בין מספר תחומי מקצוע: הנדסה חשמלית, תכנון אתרים,
חישובים הנדסיים ותיעוד. כיום, המידע מפוזר בין כלים שונים (AutoCAD, Excel, Word).
המוצר הזה מרכז הכל במקום אחד.

## Target Users
1. **מהנדסי חשמל** - תכנון מערכות חשמליות לאתר BESS
2. **מתכנני אתרים** - שרטוט תכנית אתר ופריסת רכיבים
3. **מנהלי פרויקטים** - מעקב אחר תכנון ועלויות
4. **חברות אנרגיה** - הערכת היתכנות פרויקטים חדשים

## Core Features (MVP)

### Phase 1 - Foundation (Current Sprint)
- [x] 2D site plan drawing canvas (Konva.js)
- [x] BESS component placement (drag & drop)
- [x] FastAPI backend with SQLite
- [x] PDF report generation
- [x] 3D site visualization (Three.js)
- [x] Excel export (BOM, calculations, cost)
- [x] Electrical component catalog (IEC specs)
- [x] Configuration wizard (auto-layout)
- [x] Docker deployment

### Phase 2 - Enhanced Engineering
- [ ] IEC 62933 compliance checker
- [ ] Single-line diagram generator
- [ ] Protection coordination study
- [ ] Cable routing optimization
- [ ] Fire safety zone calculations
- [ ] Grid connection study (load flow)

### Phase 3 - Advanced Features
- [ ] Real satellite imagery import (Google Maps API)
- [ ] DXF/DWG import/export (AutoCAD compatibility)
- [ ] Multi-user collaboration (WebSocket)
- [ ] PostgreSQL with PostGIS
- [ ] Version control for designs
- [ ] Regulatory compliance reports (Israeli Electric Authority)

### Phase 4 - Business Features
- [ ] Project portfolio management
- [ ] Cost tracking vs. budget
- [ ] Procurement assistance
- [ ] Client presentation mode
- [ ] API for integration with GIS systems

## Technical Architecture

```
┌─────────────────────────────────────────┐
│           Frontend (React + TS)          │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ │
│  │ 2D Draw │ │ 3D View  │ │ Reports  │ │
│  │ Konva   │ │ Three.js │ │ Panels   │ │
│  └─────────┘ └──────────┘ └──────────┘ │
│              Zustand + RQ               │
└────────────────┬────────────────────────┘
                 │ REST API
┌────────────────▼────────────────────────┐
│           Backend (FastAPI)              │
│  ┌─────────────────────────────────┐   │
│  │         Business Logic          │   │
│  │  - BESS Calculations            │   │
│  │  - Electrical Engineering       │   │
│  │  - Layout Generator             │   │
│  │  - PDF Generator (ReportLab)    │   │
│  │  - Excel Generator (openpyxl)   │   │
│  └─────────────────────────────────┘   │
│           SQLAlchemy ORM               │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│        Database (SQLite → PostgreSQL)    │
└─────────────────────────────────────────┘
```

## Team Roster & Responsibilities

| Role | Responsibility | Status |
|------|---------------|--------|
| Software Architect | System design, integration, API spec | Active |
| Backend Developer | FastAPI, DB models, calculations | Active |
| Frontend Developer | React, 2D canvas, state management | Active |
| 3D Visualization | Three.js, terrain rendering | Active |
| Electrical Engineer | IEC specs, electrical calc | Active |
| Drafter | Config wizard, layout templates | Active |
| Excel Agent | Excel export, BOM | Active |
| CEO/PM | Project coordination, roadmap | Active |

## Success Metrics (KPIs)
- Time to create a 10MW BESS site plan: < 15 minutes
- PDF report generation time: < 5 seconds
- Excel export: < 3 seconds
- Page load time: < 2 seconds
- API response time: < 200ms (95th percentile)

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AutoCAD integration complexity | High | Medium | Use SVG export as alternative |
| Grid connection regulatory changes | Medium | High | Parameterize all calculations |
| Performance with large sites (100+ containers) | Medium | Medium | Canvas virtualization |
| Browser compatibility (WebGL for 3D) | Low | Medium | Fallback to 2D-only mode |

## Definition of Done
- [ ] Unit tests for all calculation functions (pytest)
- [ ] TypeScript strict mode: zero errors
- [ ] Docker compose starts cleanly: `docker-compose up`
- [ ] Can create a 50MW/200MWh site plan in under 30 minutes
- [ ] PDF report generated with correct data
- [ ] Excel export with all 5 sheets working
