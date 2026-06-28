// ── Stage-1 types (migration-based schema) ────────────────────────────────

export interface Project {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export interface FieldValue {
  field_key: string
  value: string
  label: string
  unit: string
}

/** A component instance placed on the canvas. */
export interface ComponentInstance {
  id: string
  project_id: string
  component_type_id: string   // e.g. 'battery-container'
  name: string
  x: number
  y: number
  width: number | null
  height: number | null
  rotation: number
  created_at: string
  updated_at: string
  field_values: FieldValue[]
}

export type DrawingMode = 'select' | 'place_component'

export interface MousePosition {
  x: number
  y: number
}

// ── Legacy type aliases — kept so pre-Stage-1 files still compile ──────────
// These are not used by the Stage-1 code paths.

export type ComponentType =
  | 'battery_container' | 'pcs' | 'transformer' | 'control_room'
  | 'substation' | 'fence' | 'road' | 'text_annotation'
  | 'boundary' | 'fire_suppression' | 'grounding_grid'

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
  scale: number
  origin: { x: number; y: number }
  background?: string
}

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
