import { useCallback } from 'react'
import { Trash2 } from 'lucide-react'
import { useSiteStore } from '../../store/siteStore'
import { componentsApi } from '../../api/client'
import type { ComponentType } from '../../types'

const COMPONENT_NAMES_HE: Record<ComponentType, string> = {
  battery_container: 'מכל סוללה',
  pcs: 'PCS / אינוורטר',
  transformer: 'שנאי',
  control_room: 'חדר בקרה',
  substation: 'תחנת משנה',
  fence: 'גדר',
  road: 'דרך גישה',
  text_annotation: 'טקסט',
  boundary: 'גבול אתר',
}

const COMPONENT_COLORS_DISPLAY: Record<ComponentType, string> = {
  battery_container: '#16a34a',
  pcs: '#3b82f6',
  transformer: '#f97316',
  control_room: '#6b7280',
  substation: '#ef4444',
  fence: '#94a3b8',
  road: '#4b5563',
  text_annotation: '#f0c040',
  boundary: '#ef4444',
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '3px', fontWeight: 600 }}>
      {children}
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  readOnly = false,
}: {
  label: string
  value: string | number
  onChange?: (val: string) => void
  type?: string
  readOnly?: boolean
}) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        style={{
          width: '100%',
          padding: '6px 8px',
          background: readOnly ? '#1a1d2e' : '#252a3a',
          border: '1px solid #3a4060',
          borderRadius: '4px',
          color: readOnly ? '#6b7280' : '#e2e8f0',
          fontSize: '12px',
          outline: 'none',
        }}
      />
    </div>
  )
}

export function PropertiesPanel() {
  const {
    selectedComponentId,
    components,
    activeSite,
    updateComponent,
    removeComponent,
  } = useSiteStore()

  const selectedComp = components.find((c) => c.id === selectedComponentId)

  const handleLabelChange = useCallback(
    (val: string) => {
      if (!selectedComp) return
      updateComponent(selectedComp.id, { label: val })
    },
    [selectedComp, updateComponent]
  )

  const handlePropChange = useCallback(
    (key: string, val: string) => {
      if (!selectedComp) return
      const numVal = parseFloat(val)
      updateComponent(selectedComp.id, {
        properties: {
          ...selectedComp.properties,
          [key]: isNaN(numVal) ? val : numVal,
        },
      })
    },
    [selectedComp, updateComponent]
  )

  const handleDelete = useCallback(() => {
    if (!selectedComp || !activeSite) return
    removeComponent(selectedComp.id)
    componentsApi.delete(activeSite.id, selectedComp.id).catch(console.warn)
  }, [selectedComp, activeSite, removeComponent])

  const { activeSite: site, components: allComps, scale } = useSiteStore()

  const totalBattery = allComps
    .filter((c) => c.component_type === 'battery_container')
    .reduce((sum, c) => sum + (c.properties.capacity_kwh ?? 0), 0)

  const totalPCS = allComps
    .filter((c) => c.component_type === 'pcs')
    .reduce((sum, c) => sum + (c.properties.power_kw ?? 0), 0)

  return (
    <div
      style={{
        width: '260px',
        flexShrink: 0,
        background: '#1a1d2e',
        borderRight: '1px solid #2a3050',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {selectedComp ? (
          <>
            {/* Component type header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '1px solid #2a3050',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '2px',
                  background: COMPONENT_COLORS_DISPLAY[selectedComp.component_type],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>
                {COMPONENT_NAMES_HE[selectedComp.component_type]}
              </span>
            </div>

            <InputField
              label="תווית"
              value={selectedComp.label}
              onChange={handleLabelChange}
            />

            {/* Type-specific fields */}
            {selectedComp.component_type === 'battery_container' && (
              <>
                <InputField
                  label="קיבולת (kWh)"
                  value={selectedComp.properties.capacity_kwh ?? ''}
                  type="number"
                  onChange={(v) => handlePropChange('capacity_kwh', v)}
                />
                <InputField
                  label="הספק (kW)"
                  value={selectedComp.properties.power_kw ?? ''}
                  type="number"
                  onChange={(v) => handlePropChange('power_kw', v)}
                />
                <InputField
                  label="כמות"
                  value={selectedComp.properties.quantity ?? ''}
                  type="number"
                  onChange={(v) => handlePropChange('quantity', v)}
                />
              </>
            )}

            {selectedComp.component_type === 'pcs' && (
              <>
                <InputField
                  label="הספק (kW)"
                  value={selectedComp.properties.power_kw ?? ''}
                  type="number"
                  onChange={(v) => handlePropChange('power_kw', v)}
                />
                <InputField
                  label="כמות"
                  value={selectedComp.properties.quantity ?? ''}
                  type="number"
                  onChange={(v) => handlePropChange('quantity', v)}
                />
              </>
            )}

            {selectedComp.component_type === 'transformer' && (
              <InputField
                label="מתח (kV)"
                value={selectedComp.properties.voltage_kv ?? ''}
                type="number"
                onChange={(v) => handlePropChange('voltage_kv', v)}
              />
            )}

            {['control_room', 'substation', 'fence', 'road', 'boundary', 'text_annotation'].includes(
              selectedComp.component_type
            ) && (
              <div style={{ marginBottom: '10px' }}>
                <FieldLabel>הערות</FieldLabel>
                <textarea
                  value={selectedComp.properties.notes ?? ''}
                  onChange={(e) => handlePropChange('notes', e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    background: '#252a3a',
                    border: '1px solid #3a4060',
                    borderRadius: '4px',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* Position / Size (read-only) */}
            <div
              style={{
                marginTop: '8px',
                paddingTop: '10px',
                borderTop: '1px solid #2a3050',
                marginBottom: '10px',
              }}
            >
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 700, marginBottom: '8px' }}>
                מיקום וגודל (מטרים)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <InputField label="X" value={(selectedComp.x * scale).toFixed(1)} readOnly />
                <InputField label="Y" value={(selectedComp.y * scale).toFixed(1)} readOnly />
                <InputField label="רוחב" value={(selectedComp.width * scale).toFixed(1)} readOnly />
                <InputField label="גובה" value={(selectedComp.height * scale).toFixed(1)} readOnly />
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                padding: '8px',
                background: '#3b1a1a',
                border: '1px solid #7f1d1d',
                borderRadius: '6px',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                marginTop: '4px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#4c1f1f' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#3b1a1a' }}
            >
              <Trash2 size={14} />
              מחק רכיב
            </button>
          </>
        ) : (
          // Site info when nothing selected
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#e2e8f0',
                marginBottom: '14px',
                paddingBottom: '10px',
                borderBottom: '1px solid #2a3050',
              }}
            >
              {site?.name ?? 'אתר BESS'}
            </div>

            <div style={{ marginBottom: '10px' }}>
              <FieldLabel>מיקום</FieldLabel>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>{site?.location ?? '—'}</div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <FieldLabel>קנ"מ</FieldLabel>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>1:{Math.round(1 / scale)}</div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <FieldLabel>קיבולת יעד</FieldLabel>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {site?.target_capacity_mwh ? `${site.target_capacity_mwh} MWh` : '—'}
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <FieldLabel>הספק יעד</FieldLabel>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {site?.target_power_mw ? `${site.target_power_mw} MW` : '—'}
              </div>
            </div>

            <div
              style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #2a3050',
              }}
            >
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 700, marginBottom: '8px' }}>
                סיכום תכן
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>סה"כ רכיבים</span>
                <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600 }}>{allComps.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>מכלי סוללה</span>
                <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>
                  {allComps.filter((c) => c.component_type === 'battery_container').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>קיבולת מצטברת</span>
                <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>
                  {totalBattery > 0 ? `${(totalBattery / 1000).toFixed(2)} MWh` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>הספק PCS</span>
                <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>
                  {totalPCS > 0 ? `${(totalPCS / 1000).toFixed(2)} MW` : '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
