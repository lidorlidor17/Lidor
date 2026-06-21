# Functional Requirements Specification

## FR-001: Site Management
- FR-001.1: User can create a new BESS site with name, location, and target capacity
- FR-001.2: User can view a list of all sites with summary info
- FR-001.3: User can delete a site (with confirmation)
- FR-001.4: Site data is persisted to database

## FR-002: 2D Drawing
- FR-002.1: Canvas displays a grid with configurable scale (m/px)
- FR-002.2: User can place BESS components from a palette onto the canvas
- FR-002.3: User can move components by dragging
- FR-002.4: User can select and delete components
- FR-002.5: Canvas auto-saves to backend every 2 seconds after changes
- FR-002.6: Scale bar shows current map scale
- FR-002.7: North arrow is displayed

## FR-003: Component Management
- FR-003.1: Each component has: type, label, position, size, properties
- FR-003.2: Battery containers show capacity (kWh) and power (kW)
- FR-003.3: PCS units show power rating (kW)
- FR-003.4: Transformers show voltage level (kV)
- FR-003.5: User can edit component properties in a properties panel

## FR-004: 3D Visualization
- FR-004.1: Site plan can be viewed in 3D mode
- FR-004.2: 3D view shows components as 3D boxes with correct dimensions
- FR-004.3: User can rotate, zoom, and pan the 3D view
- FR-004.4: Components are colored by type

## FR-005: Calculations
- FR-005.1: System calculates total site capacity (MWh) from components
- FR-005.2: System calculates total power (MW) from PCS units
- FR-005.3: System calculates C-rate (MW/MWh)
- FR-005.4: Cable sizing calculation given power, voltage, distance
- FR-005.5: Cost estimation given component count

## FR-006: Reports
- FR-006.1: PDF report generated with site summary and component list
- FR-006.2: Excel export with 5 sheets: Summary, BOM, Calculations, Energy, Cost
- FR-006.3: Reports downloadable directly from browser

## FR-007: Configuration Wizard
- FR-007.1: Wizard generates site layout from capacity requirements
- FR-007.2: Standard templates available for 10MWh, 50MWh, 200MWh sites
- FR-007.3: Generated layout can be applied to canvas

## FR-008: Electrical Engineering
- FR-008.1: Component catalog with real BESS product specs
- FR-008.2: Short circuit calculation per IEC 60909
- FR-008.3: Protection relay settings calculation
- FR-008.4: Power quality assessment (THD, power factor)
- FR-008.5: Grounding system design per IEC 60364
