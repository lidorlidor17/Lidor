import { BESSComponent } from '../../types'
import { calculateTotalCapacity, countByType } from '../../utils/bess3DHelpers'
import { CapacityGauge } from './CapacityGauge'

const COMPONENT_LABELS: Record<string, string> = {
  battery_container: 'Battery Containers',
  pcs: 'PCS Units',
  transformer: 'Transformers',
  control_room: 'Control Rooms',
  substation: 'Substations',
  fence: 'Fences',
  road: 'Roads',
  fire_suppression: 'Fire Suppression',
  grounding_grid: 'Grounding Grids',
}

interface Scene3DOverlayProps {
  components: BESSComponent[]
  onResetView?: () => void
  sunAngle: number
  onSunAngleChange: (angle: number) => void
  shadowsEnabled: boolean
  onShadowsToggle: (enabled: boolean) => void
  targetMwh: number
}

export function Scene3DOverlay({
  components,
  onResetView,
  sunAngle,
  onSunAngleChange,
  shadowsEnabled,
  onShadowsToggle,
  targetMwh,
}: Scene3DOverlayProps) {
  const counts = countByType(components)
  const totalMwh = calculateTotalCapacity(components)

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    background: 'rgba(17, 24, 39, 0.88)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#e5e7eb',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 13,
    padding: '12px 16px',
    pointerEvents: 'auto',
    minWidth: 200,
  }

  return (
    <>
      {/* Top-right: component counts */}
      <div
        style={{
          ...panelStyle,
          top: 16,
          right: 16,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#9ca3af',
            marginBottom: 8,
          }}
        >
          Site Components
        </div>

        {components.length === 0 ? (
          <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
            No components placed
          </div>
        ) : (
          Object.entries(counts).map(([type, count]) => (
            <div
              key={type}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 16,
                marginBottom: 4,
              }}
            >
              <span style={{ color: '#d1d5db' }}>
                {COMPONENT_LABELS[type] ?? type}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  color: '#60a5fa',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {count}
              </span>
            </div>
          ))
        )}

        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            marginTop: 10,
            paddingTop: 10,
          }}
        >
          <CapacityGauge currentMwh={totalMwh} targetMwh={targetMwh} />
        </div>
      </div>

      {/* Bottom-left: controls */}
      <div
        style={{
          ...panelStyle,
          bottom: 16,
          left: 16,
          minWidth: 220,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#9ca3af',
            marginBottom: 12,
          }}
        >
          View Controls
        </div>

        {/* Reset view button */}
        <button
          onClick={onResetView}
          style={{
            width: '100%',
            padding: '7px 12px',
            background: '#1d4ed8',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 12,
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = '#2563eb')
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background = '#1d4ed8')
          }
        >
          ↺ Reset View
        </button>

        {/* Sun angle slider */}
        <div style={{ marginBottom: 10 }}>
          <label
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
              color: '#d1d5db',
            }}
          >
            <span>☀ Sun Angle</span>
            <span style={{ color: '#fbbf24' }}>{sunAngle}°</span>
          </label>
          <input
            type="range"
            min={5}
            max={175}
            value={sunAngle}
            onChange={(e) => onSunAngleChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer' }}
          />
        </div>

        {/* Shadows toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            color: '#d1d5db',
          }}
        >
          <input
            type="checkbox"
            checked={shadowsEnabled}
            onChange={(e) => onShadowsToggle(e.target.checked)}
            style={{ accentColor: '#60a5fa', width: 15, height: 15 }}
          />
          Enable Shadows
        </label>
      </div>
    </>
  )
}
