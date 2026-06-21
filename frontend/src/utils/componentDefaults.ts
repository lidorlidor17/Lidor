import type { ComponentType, BESSComponent } from '../types'

/**
 * Default visual and engineering properties for each BESS component type.
 */
export const COMPONENT_DEFAULTS: Record<
  ComponentType,
  {
    label: string
    labelHe: string
    width: number
    height: number
    properties: Record<string, number | string>
    color: string
    description: string
  }
> = {
  battery_container: {
    label: 'Battery Container',
    labelHe: 'מכל סוללות',
    width: 80,
    height: 40,
    properties: { capacity_kwh: 250, power_kw: 125, quantity: 1 },
    color: '#16a34a',
    description: 'מכל אחסון אנרגיה 250kWh',
  },
  pcs: {
    label: 'PCS / Inverter',
    labelHe: 'ממיר PCS',
    width: 40,
    height: 30,
    properties: { power_kw: 250, quantity: 1 },
    color: '#1d4ed8',
    description: 'Power Conversion System',
  },
  transformer: {
    label: 'Transformer',
    labelHe: 'שנאי',
    width: 50,
    height: 50,
    properties: { voltage_kv: 33 },
    color: '#b45309',
    description: 'שנאי מתח בינוני',
  },
  control_room: {
    label: 'Control Room',
    labelHe: 'חדר בקרה',
    width: 100,
    height: 60,
    properties: {},
    color: '#475569',
    description: 'חדר בקרה ו-SCADA',
  },
  substation: {
    label: 'Substation',
    labelHe: 'תחנת משנה',
    width: 80,
    height: 60,
    properties: { voltage_kv: 33 },
    color: '#991b1b',
    description: 'תחנת חיבור לרשת',
  },
  fence: {
    label: 'Fence',
    labelHe: 'גדר',
    width: 200,
    height: 10,
    properties: {},
    color: '#6b7280',
    description: 'גדר אבטחה היקפית',
  },
  road: {
    label: 'Access Road',
    labelHe: 'דרך גישה',
    width: 150,
    height: 20,
    properties: {},
    color: '#374151',
    description: 'דרך גישה פנימית',
  },
  text_annotation: {
    label: 'Text',
    labelHe: 'טקסט',
    width: 100,
    height: 30,
    properties: {},
    color: '#ffffff',
    description: 'הערת טקסט',
  },
  boundary: {
    label: 'Site Boundary',
    labelHe: 'גבול אתר',
    width: 400,
    height: 300,
    properties: {},
    color: '#dc2626',
    description: 'גבול האתר',
  },
  fire_suppression: {
    label: 'Fire Suppression',
    labelHe: 'מערכת כיבוי אש',
    width: 40,
    height: 40,
    properties: {},
    color: '#ef4444',
    description: 'מערכת כיבוי אש',
  },
  grounding_grid: {
    label: 'Grounding Grid',
    labelHe: 'רשת הארקה',
    width: 80,
    height: 80,
    properties: {},
    color: '#eab308',
    description: 'רשת הארקה',
  },
}

/**
 * Generate a new component object with default values for the given type.
 * The returned object is ready to be POSTed to the API (missing `id` and `created_at`).
 */
export function createComponent(
  type: ComponentType,
  x: number,
  y: number,
  siteId: string,
): Omit<BESSComponent, 'id' | 'created_at'> {
  const defaults = COMPONENT_DEFAULTS[type]
  return {
    site_id: siteId,
    component_type: type,
    label: defaults.labelHe,
    x,
    y,
    width: defaults.width,
    height: defaults.height,
    rotation: 0,
    properties: { ...defaults.properties } as BESSComponent['properties'],
  }
}
