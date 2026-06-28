import { useSiteStore } from '../../store/siteStore'

const BATTERY_TYPE_ID = 'battery-container'

export function ComponentPalette() {
  const { drawingMode, placingTypeId, startPlacing, stopPlacing } = useSiteStore()
  const isActive = drawingMode === 'place_component' && placingTypeId === BATTERY_TYPE_ID

  return (
    <div style={{
      width: 200,
      flexShrink: 0,
      background: '#f8fafc',
      borderRight: '1px solid #e2e8f0',
      padding: '12px 8px',
    }}>
      <p style={{
        fontSize: 10, color: '#94a3b8', margin: '0 0 8px 4px',
        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        Stage 1 — Components
      </p>
      <button
        onClick={() => isActive ? stopPlacing() : startPlacing(BATTERY_TYPE_ID)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '10px 12px',
          border: isActive ? '2px solid #1d4ed8' : '1.5px solid #cbd5e1',
          borderRadius: 6,
          background: isActive ? '#eff6ff' : '#fff',
          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        <span style={{
          display: 'inline-block', width: 28, height: 16,
          background: '#f97316', borderRadius: 2, opacity: 0.8, flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1917' }}>Battery Container</div>
          <div style={{ fontSize: 11, color: '#78716c' }}>5640 kWh (default)</div>
        </div>
      </button>
      {isActive && (
        <p style={{ fontSize: 11, color: '#1d4ed8', margin: '8px 4px 0', lineHeight: 1.5 }}>
          Click on the canvas to place.
          <br />Press ESC to cancel.
        </p>
      )}
    </div>
  )
}
