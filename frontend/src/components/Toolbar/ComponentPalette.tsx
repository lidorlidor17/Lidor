import { useSiteStore } from '../../store/siteStore'
import type { ComponentType } from '../../types'

interface PaletteItem {
  type: ComponentType
  label: string
  icon: string
  description?: string
}

const BESS_COMPONENTS: PaletteItem[] = [
  { type: 'battery_container', label: 'מכל סוללה', icon: '🔋', description: '250kWh' },
  { type: 'pcs', label: 'PCS / אינוורטר', icon: '⚡', description: 'ממיר הספק' },
  { type: 'transformer', label: 'שנאי', icon: '🔌', description: 'טרנספורמטור' },
  { type: 'control_room', label: 'חדר בקרה', icon: '🖥️', description: 'SCADA' },
  { type: 'substation', label: 'תחנת משנה', icon: '🏗️', description: 'Substation' },
]

const INFRASTRUCTURE: PaletteItem[] = [
  { type: 'fence', label: 'גדר / גבול', icon: '🚧', description: 'Fence' },
  { type: 'road', label: 'דרך גישה', icon: '🛣️', description: 'Access Road' },
  { type: 'boundary', label: 'גבול אתר', icon: '📐', description: 'Site Boundary' },
]

const TOOLS_ITEMS: Array<{ mode: 'select' | 'text'; label: string; icon: string }> = [
  { mode: 'select', label: 'בחירה', icon: '↖️' },
  { mode: 'text', label: 'טקסט', icon: '✏️' },
]

interface PaletteCardProps {
  item: PaletteItem
  isActive: boolean
  onClick: () => void
}

function PaletteCard({ item, isActive, onClick }: PaletteCardProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '8px 10px',
        background: isActive ? '#1e3a5f' : '#252a3a',
        border: `1px solid ${isActive ? '#3b82f6' : '#3a4060'}`,
        borderRadius: '6px',
        cursor: 'pointer',
        color: isActive ? '#60a5fa' : '#e2e8f0',
        textAlign: 'right',
        transition: 'all 0.15s ease',
        marginBottom: '4px',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = '#2d3348'
          e.currentTarget.style.borderColor = '#4a5070'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = '#252a3a'
          e.currentTarget.style.borderColor = '#3a4060'
        }
      }}
    >
      <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
      <div style={{ flex: 1, textAlign: 'right' }}>
        <div style={{ fontSize: '12px', fontWeight: 600 }}>{item.label}</div>
        {item.description && (
          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '1px' }}>
            {item.description}
          </div>
        )}
      </div>
    </button>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: '10px',
        fontWeight: 700,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '10px 4px 6px',
        borderBottom: '1px solid #2a3050',
        marginBottom: '6px',
      }}
    >
      {title}
    </div>
  )
}

export function ComponentPalette() {
  const { drawingMode, selectedComponentType, setDrawingMode, setSelectedComponentType } = useSiteStore()

  const handleSelectComponent = (type: ComponentType) => {
    setSelectedComponentType(type)
    setDrawingMode('place_component')
  }

  const handleSelectMode = (mode: 'select' | 'text') => {
    setDrawingMode(mode)
    setSelectedComponentType(null)
  }

  return (
    <div
      style={{
        width: '220px',
        flexShrink: 0,
        background: '#1a1d2e',
        borderLeft: '1px solid #2a3050',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        <SectionHeader title="רכיבי BESS" />
        {BESS_COMPONENTS.map((item) => (
          <PaletteCard
            key={item.type}
            item={item}
            isActive={drawingMode === 'place_component' && selectedComponentType === item.type}
            onClick={() => handleSelectComponent(item.type)}
          />
        ))}

        <SectionHeader title="תשתית" />
        {INFRASTRUCTURE.map((item) => (
          <PaletteCard
            key={item.type}
            item={item}
            isActive={drawingMode === 'place_component' && selectedComponentType === item.type}
            onClick={() => handleSelectComponent(item.type)}
          />
        ))}

        <SectionHeader title="כלים" />
        {TOOLS_ITEMS.map((tool) => (
          <button
            key={tool.mode}
            onClick={() => handleSelectMode(tool.mode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '8px 10px',
              background: drawingMode === tool.mode ? '#1e3a5f' : '#252a3a',
              border: `1px solid ${drawingMode === tool.mode ? '#3b82f6' : '#3a4060'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              color: drawingMode === tool.mode ? '#60a5fa' : '#e2e8f0',
              textAlign: 'right',
              marginBottom: '4px',
            }}
          >
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{tool.icon}</span>
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
