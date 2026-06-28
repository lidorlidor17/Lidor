import { useEffect } from 'react'
import { useSiteStore } from '../../store/siteStore'
import { componentTypesApi } from '../../api/client'

const TYPE_SUBTITLES: Record<string, string> = {
  'battery-container': '5,640 kWh (default)',
  'pcs-inverter': '3,450 kW (default)',
  'transformer': '5,000 kVA (default)',
  'rmu': 'Ring Main Unit',
  'electrical-panel': '400 V / 250 A',
  'network-switch': '8×RJ45 + 2×ST',
  'ems-plc-dio-controller': 'EMS / PLC / DIO',
}

export function ComponentPalette() {
  const { drawingMode, placingTypeId, startPlacing, stopPlacing, componentTypes, setComponentTypes } = useSiteStore()

  useEffect(() => {
    componentTypesApi.list().then((r) => setComponentTypes(r.data)).catch(() => {})
  }, [setComponentTypes])

  return (
    <div style={{
      width: 210,
      flexShrink: 0,
      background: '#f8fafc',
      borderRight: '1px solid #e2e8f0',
      padding: '12px 8px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <p style={{
        fontSize: 10, color: '#94a3b8', margin: '0 0 6px 4px',
        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        Components
      </p>

      {componentTypes.map((ct) => {
        const isActive = drawingMode === 'place_component' && placingTypeId === ct.id
        return (
          <button
            key={ct.id}
            onClick={() => isActive ? stopPlacing() : startPlacing(ct.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '8px 10px',
              border: isActive ? `2px solid ${ct.default_color}` : '1.5px solid #cbd5e1',
              borderRadius: 6,
              background: isActive ? `${ct.default_color}18` : '#fff',
              cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            }}
          >
            <span style={{
              display: 'inline-block', width: 24, height: 14,
              background: ct.default_color, borderRadius: 2, opacity: 0.85, flexShrink: 0,
            }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1c1917', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ct.name}
              </div>
              <div style={{ fontSize: 10, color: '#78716c' }}>
                {TYPE_SUBTITLES[ct.id] ?? ct.category}
              </div>
            </div>
          </button>
        )
      })}

      {drawingMode === 'place_component' && (
        <p style={{ fontSize: 11, color: '#1d4ed8', margin: '4px 4px 0', lineHeight: 1.5 }}>
          Click on the canvas to place.
          <br />Press ESC to cancel.
        </p>
      )}

      {componentTypes.length === 0 && (
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px' }}>
          Loading…
        </p>
      )}
    </div>
  )
}
