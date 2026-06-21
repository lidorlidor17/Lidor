# Sprint 1 - Foundation Build
**Duration**: Week 1-2
**Goal**: Working MVP with all core features

## Stories

### Story 1: Project Setup
- Git repository initialized
- Branch: claude/software-dev-agent-team-60tq24
- Directory structure created

### Story 2: Backend Foundation
- FastAPI application setup
- SQLite database with SQLAlchemy
- CRUD for sites and components
- BESS capacity calculations
- PDF report generation

### Story 3: Frontend Foundation
- React + Vite + TypeScript setup
- Zustand state management
- API client (axios)
- Routing (react-router-dom)

### Story 4: 2D Drawing Canvas
- Konva.js canvas integration
- Component palette (all 9 types)
- Place, select, move, delete components
- Scale bar and North arrow

### Story 5: 3D Visualization
- Three.js scene setup
- Component 3D box rendering
- Orbit controls
- Component labels

### Story 6: Excel Export
- openpyxl Excel generation
- 5 sheets: Summary, BOM, Calculations, Energy, Cost
- Download from browser

### Story 7: Electrical Catalog
- Real BESS product catalog
- IEC calculations
- Short circuit, protection, grounding

### Story 8: Configuration Wizard
- Auto-layout algorithm
- Standard templates
- React wizard UI

## Definition of Done for Sprint 1
- [ ] `docker-compose up` starts both services
- [ ] Can create a site and place components
- [ ] PDF download works
- [ ] Excel download works
- [ ] 3D view renders components
