export type BESSComponentType =
  | 'battery_container'
  | 'pcs'
  | 'transformer'
  | 'control_room'
  | 'substation'
  | 'fence'
  | 'road'
  | 'fire_suppression'
  | 'grounding_grid'

export interface BESSComponentProperties {
  capacity_kwh?: number
  quantity?: number
  power_kw?: number
  voltage_kv?: number
  label?: string
  [key: string]: unknown
}

export interface BESSComponent {
  id: string
  component_type: BESSComponentType
  name: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  properties?: BESSComponentProperties
}

export interface BESSSite {
  id: string
  name: string
  description?: string
  width_m: number
  height_m: number
  target_capacity_mwh?: number
  created_at?: string
  updated_at?: string
}
