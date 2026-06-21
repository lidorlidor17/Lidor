/**
 * Calculate the area of a polygon from a flat array of [x, y, x, y, ...] pixel
 * coordinates. Uses the Shoelace (Gauss) formula. Returns area in m².
 *
 * @param points - flat array of pixel coordinates [x0,y0, x1,y1, ...]
 * @param scale  - meters per pixel (e.g. 0.5 means 1 px = 0.5 m)
 */
export function polygonAreaM2(points: number[], scale: number): number {
  const n = points.length
  if (n < 6) return 0 // need at least 3 vertices (6 values)

  let area = 0
  for (let i = 0; i < n; i += 2) {
    const j = (i + 2) % n
    area += points[i] * points[j + 1]
    area -= points[j] * points[i + 1]
  }

  const areaPx2 = Math.abs(area / 2)
  return areaPx2 * scale * scale
}

/**
 * Euclidean distance between two pixel-space points, converted to meters.
 *
 * @param x1 - x of first point (pixels)
 * @param y1 - y of first point (pixels)
 * @param x2 - x of second point (pixels)
 * @param y2 - y of second point (pixels)
 * @param scale - meters per pixel
 */
export function distanceM(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  scale: number,
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy) * scale
}

/**
 * Format an area value for display.
 * - >= 10,000 m² → hectares (ha) with 2 decimal places
 * - < 10,000 m²  → square metres (m²) rounded to nearest integer
 */
export function formatArea(areaM2: number): string {
  if (areaM2 >= 10_000) {
    return `${(areaM2 / 10_000).toFixed(2)} ha`
  }
  return `${Math.round(areaM2).toLocaleString()} m²`
}

/**
 * Format a power value for display.
 * - >= 1,000 kW → MW with 2 decimal places
 * - < 1,000 kW  → kW with 1 decimal place
 */
export function formatPower(kw: number): string {
  if (kw >= 1_000) {
    return `${(kw / 1_000).toFixed(2)} MW`
  }
  return `${kw.toFixed(1)} kW`
}

/**
 * Format an energy value for display.
 * - >= 1,000 kWh → MWh with 2 decimal places
 * - < 1,000 kWh  → kWh with 1 decimal place
 */
export function formatEnergy(kwh: number): string {
  if (kwh >= 1_000) {
    return `${(kwh / 1_000).toFixed(2)} MWh`
  }
  return `${kwh.toFixed(1)} kWh`
}
