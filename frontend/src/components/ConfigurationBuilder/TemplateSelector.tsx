import { useState, useEffect } from 'react'
import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta as { env: Record<string, string> }).env.VITE_API_URL || 'http://localhost:8000',
})

// ---- Types ----------------------------------------------------------------

export interface BESSTemplate {
  id: string
  name: string
  description: string
  target_capacity_mwh: number
  target_power_mw: number
  typical_site_area_m2: number
  battery_model: string
  pcs_model: string
}

export interface TemplateSelectorProps {
  onSelectTemplate: (template: BESSTemplate) => void
}

// ---- Shared Styles --------------------------------------------------------

const COLORS = {
  bg: '#1a1d2e',
  surface: '#252a3a',
  surfaceHover: '#2d3348',
  border: '#3a4060',
  borderHover: '#4a5070',
  text: '#e2e8f0',
  textMuted: '#9ca3af',
  textDim: '#6b7280',
  accent: '#3b82f6',
  accentLight: '#60a5fa',
  success: '#10b981',
}

// ---- Template Card -------------------------------------------------------

function TemplateCard({
  template,
  onSelect,
}: {
  template: BESSTemplate
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)

  const sizeLabel =
    template.target_capacity_mwh <= 15
      ? 'קטן'
      : template.target_capacity_mwh <= 75
      ? 'בינוני'
      : 'גדול'

  const sizeColor =
    template.target_capacity_mwh <= 15
      ? '#10b981'
      : template.target_capacity_mwh <= 75
      ? '#f59e0b'
      : '#ef4444'

  return (
    <div
      style={{
        background: hovered ? COLORS.surfaceHover : COLORS.surface,
        border: `1px solid ${hovered ? COLORS.borderHover : COLORS.border}`,
        borderRadius: '10px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        direction: 'rtl',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '20px',
            background: `${sizeColor}22`,
            color: sizeColor,
            border: `1px solid ${sizeColor}44`,
          }}
        >
          {sizeLabel}
        </span>
        <h3
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 700,
            color: COLORS.text,
            textAlign: 'right',
          }}
        >
          {template.name}
        </h3>
      </div>

      {/* Description */}
      <p
        style={{
          margin: '0 0 12px 0',
          fontSize: '12px',
          color: COLORS.textMuted,
          lineHeight: 1.5,
          textAlign: 'right',
        }}
      >
        {template.description}
      </p>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', justifyContent: 'flex-end' }}>
        <span style={badgeStyle('#1e3a5f', COLORS.accentLight)}>
          {template.target_capacity_mwh} MWh
        </span>
        <span style={badgeStyle('#1e3a5f', COLORS.accentLight)}>
          {template.target_power_mw} MW
        </span>
        <span style={badgeStyle('#1e2820', COLORS.success)}>
          {(template.typical_site_area_m2 / 1000).toFixed(0)}k m²
        </span>
      </div>

      {/* Battery / PCS model info */}
      <div
        style={{
          fontSize: '10px',
          color: COLORS.textDim,
          borderTop: `1px solid ${COLORS.border}`,
          paddingTop: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          textAlign: 'right',
        }}
      >
        <div>סוללה: {template.battery_model}</div>
        <div>PCS: {template.pcs_model}</div>
      </div>

      {/* CTA */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        style={{
          marginTop: '12px',
          width: '100%',
          background: hovered ? COLORS.accent : '#1e3a5f',
          border: `1px solid ${COLORS.accent}`,
          borderRadius: '6px',
          color: hovered ? '#fff' : COLORS.accentLight,
          fontSize: '12px',
          fontWeight: 700,
          padding: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        השתמש בתבנית
      </button>
    </div>
  )
}

function badgeStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg,
    color,
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '20px',
  }
}

// ---- Main TemplateSelector -----------------------------------------------

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<BESSTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    api
      .get<BESSTemplate[]>('/api/layout/templates')
      .then((res) => {
        if (!cancelled) {
          setTemplates(res.data)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const e = err as { message?: string }
          setFetchError(e?.message || 'שגיאה בטעינת התבניות')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          color: COLORS.textMuted,
          fontSize: '13px',
        }}
      >
        טוען תבניות...
      </div>
    )
  }

  if (fetchError) {
    return (
      <div
        style={{
          background: '#2a1020',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '16px',
          color: '#ef4444',
          fontSize: '13px',
          direction: 'rtl',
        }}
      >
        <strong>שגיאה:</strong> {fetchError}
      </div>
    )
  }

  return (
    <div style={{ direction: 'rtl' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: COLORS.textDim,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '16px',
        }}
      >
        תבניות סטנדרטיות
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '12px',
        }}
      >
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} onSelect={() => onSelectTemplate(t)} />
        ))}
      </div>
    </div>
  )
}
