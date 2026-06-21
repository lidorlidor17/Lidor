// Component types supported on the 2D site plan canvas
export type ComponentType =
  | 'battery_container'
  | 'pcs'
  | 'transformer'
  | 'control_room'
  | 'substation'
  | 'fence'
  | 'road'
  | 'text_annotation'
  | 'boundary'
  | 'fire_suppression'
  | 'grounding_grid'

// Legacy alias kept for compatibility with existing 3D components
export type BESSComponentType = ComponentType

export interface ComponentProperties {
  capacity_kwh?: number
  power_kw?: number
  quantity?: number
  voltage_kv?: number
  color?: string
  notes?: string
  label?: string
  [key: string]: unknown
}

// Legacy alias kept for compatibility
export type BESSComponentProperties = ComponentProperties

export interface BESSComponent {
  id: string
  site_id: string
  component_type: ComponentType
  label: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  properties: ComponentProperties
  created_at?: string
}

export interface BESSSite {
  id: string
  name: string
  description?: string
  location?: string
  target_capacity_mwh?: number
  target_power_mw?: number
  site_area_m2?: number
  drawing_data?: DrawingData
  created_at: string
  updated_at: string
}

export interface DrawingData {
  scale: number   // meters per pixel (e.g. 0.5 = 50cm per pixel)
  origin: { x: number; y: number }
  background?: string
}

export type DrawingMode = 'select' | 'place_component' | 'draw_boundary' | 'draw_road' | 'text'

export interface CapacityResult {
  total_capacity_mwh: number
  total_power_mw: number
  c_rate: number
  num_battery_containers: number
  num_pcs_units: number
  estimated_efficiency: number
  site_area_m2: number
  energy_density_mwh_per_ha: number
}

export interface MousePosition {
  x: number
  y: number
}
