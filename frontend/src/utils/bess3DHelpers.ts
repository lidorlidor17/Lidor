import { BESSComponent } from '../types'

/**
 * Convert canvas pixel coordinates to 3D world coordinates.
 * Canvas: origin top-left, y goes down
 * 3D:     origin center, y goes up, z goes toward viewer
 */
export function canvasTo3D(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  scale: number
): [number, number, number] {
  const worldX = (x - canvasWidth / 2) * scale
  const worldZ = (y - canvasHeight / 2) * scale
  return [worldX, 0, worldZ]
}

export interface Dims3D {
  w: number
  h: number
  d: number
}

/**
 * Get 3D box dimensions (in metres) for a given BESS component type.
 */
export function getComponent3DDimensions(componentType: string): Dims3D {
  const dims: Record<string, Dims3D> = {
    battery_container: { w: 6, h: 2.5, d: 2.4 },
    pcs: { w: 2, h: 2, d: 1 },
    transformer: { w: 2, h: 2, d: 2 },
    control_room: { w: 8, h: 4, d: 6 },
    substation: { w: 6, h: 3, d: 4 },
    fence: { w: 0.2, h: 2, d: 0.2 },
    road: { w: 1, h: 0.1, d: 1 },
    fire_suppression: { w: 3, h: 1.5, d: 3 },
    grounding_grid: { w: 4, h: 0.05, d: 4 },
  }
  return dims[componentType] ?? { w: 2, h: 2, d: 2 }
}

/**
 * Calculate total battery capacity in MWh from placed components.
 */
export function calculateTotalCapacity(components: BESSComponent[]): number {
  return (
    components
      .filter((c) => c.component_type === 'battery_container')
      .reduce(
        (sum, c) =>
          sum +
          (c.properties?.capacity_kwh ?? 250) *
            (c.properties?.quantity ?? 1),
        0
      ) / 1000
  )
}

/**
 * Get the hex color for a component type.
 */
export function getComponentColor(componentType: string): string {
  const colors: Record<string, string> = {
    battery_container: '#1a6b2a',
    pcs: '#1e40af',
    transformer: '#92400e',
    control_room: '#4b5563',
    substation: '#991b1b',
    fence: '#6b7280',
    road: '#374151',
    fire_suppression: '#b45309',
    grounding_grid: '#374151',
  }
  return colors[componentType] ?? '#555555'
}

/**
 * Count components by type.
 */
export function countByType(
  components: BESSComponent[]
): Record<string, number> {
  return components.reduce<Record<string, number>>((acc, c) => {
    acc[c.component_type] = (acc[c.component_type] ?? 0) + 1
    return acc
  }, {})
}
