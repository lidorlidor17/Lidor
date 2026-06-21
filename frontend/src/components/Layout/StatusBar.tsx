import { useSiteStore } from '../../store/siteStore'
import { COMPONENT_DEFAULTS } from '../../utils/componentDefaults'

export function StatusBar() {
  const {
    components,
    selectedComponentId,
    selectedComponentType,
    drawingMode,
    scale,
    mousePosition,
  } = useSiteStore()

  const selectedComponent = selectedComponentId
    ? components.find((c) => c.id === selectedComponentId)
    : null

  // Determine mode label
  let modeLabel = 'Select'
  if (drawingMode === 'place_component' && selectedComponentType) {
    const defaults = COMPONENT_DEFAULTS[selectedComponentType]
    modeLabel = defaults
      ? `Place: ${defaults.label}`
      : `Place: ${selectedComponentType}`
  } else if (drawingMode === 'draw_boundary') {
    modeLabel = 'Draw Boundary'
  } else if (drawingMode === 'draw_road') {
    modeLabel = 'Draw Road'
  } else if (drawingMode === 'text') {
    modeLabel = 'Text'
  }

  // Scale display: meters per pixel → e.g. 0.5 m/px → "1:500"
  // If 1 px = 0.5 m then the drawing scale is 1:500 (i.e. 1 unit on screen = 500 units in reality, in mm)
  // scale is in m/px, so ratio = scale * 1000 (to convert m → mm) = scale * 1000
  const scaleRatio = scale > 0 ? Math.round(scale * 1000) : 500

  // Mouse coordinates in meters
  const mx = mousePosition ? (mousePosition.x * scale).toFixed(1) : '0.0'
  const my = mousePosition ? (mousePosition.y * scale).toFixed(1) : '0.0'

  return (
    <div
      className="flex items-center gap-4 px-4 py-1.5 bg-gray-800 text-gray-300 text-xs border-t border-gray-700 select-none"
      role="status"
      aria-label="Status bar"
    >
      {/* Coordinates */}
      <span className="font-mono text-gray-400">
        X: {mx} m &nbsp; Y: {my} m
      </span>

      <span className="text-gray-600">|</span>

      {/* Selected component info */}
      {selectedComponent ? (
        <span>
          <span className="text-gray-500">נבחר:</span>{' '}
          <span className="text-white font-medium">
            {selectedComponent.label}
            {selectedComponent.properties?.capacity_kwh
              ? ` (${selectedComponent.properties.capacity_kwh}kWh)`
              : selectedComponent.properties?.power_kw
              ? ` (${selectedComponent.properties.power_kw}kW)`
              : ''}
          </span>
        </span>
      ) : (
        <span className="text-gray-500 italic">אין בחירה</span>
      )}

      <span className="text-gray-600">|</span>

      {/* Component count */}
      <span>
        <span className="text-gray-500">רכיבים:</span>{' '}
        <span className="text-white font-medium">{components.length}</span>
      </span>

      <span className="text-gray-600">|</span>

      {/* Scale */}
      <span>
        <span className="text-gray-500">קנה מידה:</span>{' '}
        <span className="text-white font-medium">1:{scaleRatio}</span>
      </span>

      <span className="text-gray-600">|</span>

      {/* Mode */}
      <span>
        <span className="text-gray-500">מצב:</span>{' '}
        <span
          className={`font-medium ${
            drawingMode === 'place_component'
              ? 'text-blue-400'
              : drawingMode === 'select'
              ? 'text-green-400'
              : 'text-yellow-400'
          }`}
        >
          {modeLabel}
        </span>
      </span>
    </div>
  )
}
