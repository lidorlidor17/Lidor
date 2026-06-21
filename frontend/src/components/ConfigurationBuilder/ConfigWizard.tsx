import { useState } from 'react'
import axios from 'axios'

const api = axios.create({
  baseURL: (import.meta as { env: Record<string, string> }).env.VITE_API_URL || 'http://localhost:8000',
})

// ---- Types ----------------------------------------------------------------

interface WizardConfig {
  target_capacity_mwh: number
  target_power_mw: number
  site_width_m: number
  site_height_m: number
  battery_model: string
  pcs_model: string
  layout_style: string
}

interface GeneratedComponent {
  component_type: string
  label: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  properties: Record<string, unknown>
}

interface LayoutSummary {
  total_capacity_mwh: number
  total_power_mw: number
  num_battery_containers: number
  num_pcs_units: number
  site_utilization_percent: number
}

interface GeneratedLayout {
  components: GeneratedComponent[]
  summary: LayoutSummary
  notes: string[]
}

export interface ConfigWizardProps {
  siteId: string
  onClose: () => void
  onApply: (components: GeneratedComponent[]) => void
}

// ---- Constants ------------------------------------------------------------

const BATTERY_MODELS = [
  {
    id: 'CATL EnerOne Plus',
    name: 'CATL EnerOne Plus',
    capacity_kwh: 372,
    power_kw: 372,
    description: 'מכל CATL עם קיבולת 372 kWh',
  },
  {
    id: 'BYD Battery-Box Premium HVS',
    name: 'BYD Battery-Box Premium HVS',
    capacity_kwh: 256,
    power_kw: 128,
    description: 'מכל BYD עם קיבולת 256 kWh',
  },
  {
    id: 'Sungrow ST2752UX',
    name: 'Sungrow ST2752UX',
    capacity_kwh: 2752,
    power_kw: 1375,
    description: 'מכל Sungrow גדול 2.752 MWh לפרויקטים גדולים',
  },
]

const PCS_MODELS = [
  {
    id: 'SMA Sunny Central Storage 2500',
    name: 'SMA Sunny Central Storage 2500',
    power_kw: 2500,
    description: 'מהפך SMA בהספק 2.5 MW',
  },
  {
    id: 'ABB PCS100 BESS-e 1250',
    name: 'ABB PCS100 BESS-e 1250',
    power_kw: 1250,
    description: 'מהפך ABB בהספק 1.25 MW',
  },
]

// ---- Shared Styles --------------------------------------------------------

const COLORS = {
  bg: '#1a1d2e',
  surface: '#252a3a',
  surfaceHover: '#2d3348',
  border: '#3a4060',
  borderActive: '#3b82f6',
  text: '#e2e8f0',
  textMuted: '#9ca3af',
  textDim: '#6b7280',
  accent: '#3b82f6',
  accentLight: '#60a5fa',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
}

const inputStyle: React.CSSProperties = {
  background: '#1a1d2e',
  border: `1px solid ${COLORS.border}`,
  borderRadius: '6px',
  color: COLORS.text,
  padding: '8px 10px',
  fontSize: '13px',
  width: '100%',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: COLORS.textMuted,
  marginBottom: '4px',
}

// ---- Step 1: Requirements ------------------------------------------------

function Step1Requirements({
  config,
  onChange,
}: {
  config: WizardConfig
  onChange: (updates: Partial<WizardConfig>) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={labelStyle}>קיבולת יעד (MWh)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="number"
            min={0.1}
            step={0.5}
            value={config.target_capacity_mwh}
            onChange={(e) => onChange({ target_capacity_mwh: parseFloat(e.target.value) || 0 })}
            style={{ ...inputStyle, width: '100px' }}
          />
          <input
            type="range"
            min={1}
            max={500}
            step={1}
            value={config.target_capacity_mwh}
            onChange={(e) => onChange({ target_capacity_mwh: parseFloat(e.target.value) })}
            style={{ flex: 1, accentColor: COLORS.accent }}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>הספק יעד (MW)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="number"
            min={0.1}
            step={0.5}
            value={config.target_power_mw}
            onChange={(e) => onChange({ target_power_mw: parseFloat(e.target.value) || 0 })}
            style={{ ...inputStyle, width: '100px' }}
          />
          <input
            type="range"
            min={0.5}
            max={250}
            step={0.5}
            value={config.target_power_mw}
            onChange={(e) => onChange({ target_power_mw: parseFloat(e.target.value) })}
            style={{ flex: 1, accentColor: COLORS.accent }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>רוחב אתר (מ')</label>
          <input
            type="number"
            min={50}
            step={10}
            value={config.site_width_m}
            onChange={(e) => onChange({ site_width_m: parseFloat(e.target.value) || 0 })}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>גובה אתר (מ')</label>
          <input
            type="number"
            min={50}
            step={10}
            value={config.site_height_m}
            onChange={(e) => onChange({ site_height_m: parseFloat(e.target.value) || 0 })}
            style={inputStyle}
          />
        </div>
      </div>

      <div
        style={{
          background: '#1e2840',
          border: `1px solid #2a3a60`,
          borderRadius: '8px',
          padding: '12px',
          fontSize: '12px',
          color: COLORS.textMuted,
          lineHeight: 1.6,
        }}
      >
        <div style={{ fontWeight: 600, color: COLORS.accentLight, marginBottom: '4px' }}>
          יחס C-Rate משוער
        </div>
        {config.target_power_mw > 0 && config.target_capacity_mwh > 0
          ? `C-Rate = ${(config.target_power_mw / config.target_capacity_mwh).toFixed(2)}C`
          : 'הכנס ערכי קיבולת והספק'}
      </div>
    </div>
  )
}

// ---- Step 2: Component Selection ----------------------------------------

function ModelCard({
  name,
  description,
  badge,
  isSelected,
  onClick,
}: {
  name: string
  description: string
  badge: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: isSelected ? '#1e3a5f' : COLORS.surface,
        border: `2px solid ${isSelected ? COLORS.borderActive : COLORS.border}`,
        borderRadius: '8px',
        padding: '12px',
        cursor: 'pointer',
        color: COLORS.text,
        textAlign: 'right',
        width: '100%',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <span
          style={{
            background: isSelected ? COLORS.borderActive : '#2a3050',
            color: isSelected ? '#fff' : COLORS.textMuted,
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '20px',
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? COLORS.accentLight : COLORS.text }}>
            {name}
          </div>
          <div style={{ fontSize: '11px', color: COLORS.textDim, marginTop: '3px' }}>{description}</div>
        </div>
      </div>
    </button>
  )
}

function Step2Components({
  config,
  onChange,
}: {
  config: WizardConfig
  onChange: (updates: Partial<WizardConfig>) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={{ ...labelStyle, marginBottom: '8px' }}>דגם מכל סוללות</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {BATTERY_MODELS.map((m) => (
            <ModelCard
              key={m.id}
              name={m.name}
              description={m.description}
              badge={`${m.capacity_kwh} kWh`}
              isSelected={config.battery_model === m.id}
              onClick={() => onChange({ battery_model: m.id })}
            />
          ))}
        </div>
      </div>

      <div>
        <label style={{ ...labelStyle, marginBottom: '8px' }}>דגם PCS / מהפך</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {PCS_MODELS.map((m) => (
            <ModelCard
              key={m.id}
              name={m.name}
              description={m.description}
              badge={`${m.power_kw} kW`}
              isSelected={config.pcs_model === m.id}
              onClick={() => onChange({ pcs_model: m.id })}
            />
          ))}
        </div>
      </div>

      <div>
        <label style={{ ...labelStyle, marginBottom: '8px' }}>סגנון פריסה</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['grid', 'row'] as const).map((style) => (
            <button
              key={style}
              onClick={() => onChange({ layout_style: style })}
              style={{
                flex: 1,
                padding: '10px',
                background: config.layout_style === style ? '#1e3a5f' : COLORS.surface,
                border: `2px solid ${config.layout_style === style ? COLORS.borderActive : COLORS.border}`,
                borderRadius: '8px',
                cursor: 'pointer',
                color: config.layout_style === style ? COLORS.accentLight : COLORS.text,
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {style === 'grid' ? 'רשת (Grid)' : 'שורה (Row)'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---- Step 3: Preview ----------------------------------------------------

function Step3Preview({
  layout,
  isGenerating,
  error,
  onApply,
}: {
  layout: GeneratedLayout | null
  isGenerating: boolean
  error: string | null
  onApply: () => void
}) {
  if (isGenerating) {
    return (
      <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: '40px 0' }}>
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>⏳</div>
        <div>מחשב פריסה אוטומטית...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          background: '#2a1020',
          border: `1px solid ${COLORS.error}`,
          borderRadius: '8px',
          padding: '16px',
          color: COLORS.error,
          fontSize: '13px',
        }}
      >
        <strong>שגיאה:</strong> {error}
      </div>
    )
  }

  if (!layout) {
    return (
      <div style={{ textAlign: 'center', color: COLORS.textMuted, padding: '40px 0' }}>
        לא נוצרה פריסה
      </div>
    )
  }

  const { summary, notes } = layout

  const statItems = [
    { label: 'מכלי סוללות', value: summary.num_battery_containers, unit: 'יחידות' },
    { label: 'יחידות PCS', value: summary.num_pcs_units, unit: 'יחידות' },
    { label: 'קיבולת כוללת', value: summary.total_capacity_mwh, unit: 'MWh' },
    { label: 'הספק כולל', value: summary.total_power_mw, unit: 'MW' },
    { label: 'ניצולת שטח', value: summary.site_utilization_percent, unit: '%' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        {statItems.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <div style={{ fontSize: '11px', color: COLORS.textDim, marginBottom: '4px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: COLORS.accentLight }}>
              {stat.value}
              <span style={{ fontSize: '12px', fontWeight: 400, color: COLORS.textMuted, marginLeft: '4px' }}>
                {stat.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {notes.length > 0 && (
        <div
          style={{
            background: '#1e2820',
            border: `1px solid #2a4030`,
            borderRadius: '8px',
            padding: '12px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: COLORS.success, marginBottom: '8px' }}>
            הערות ואזהרות
          </div>
          <ul style={{ margin: 0, padding: '0 18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {notes.map((note, i) => (
              <li key={i} style={{ fontSize: '12px', color: COLORS.textMuted, lineHeight: 1.5 }}>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ fontSize: '12px', color: COLORS.textDim, textAlign: 'center' }}>
        {layout.components.length} רכיבים יוצבו על הקנבס
      </div>

      <button
        onClick={onApply}
        style={{
          background: COLORS.accent,
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 700,
          padding: '12px',
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#2563eb')}
        onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.accent)}
      >
        החל על הקנבס
      </button>
    </div>
  )
}

// ---- Progress Bar --------------------------------------------------------

function ProgressBar({ step, total }: { step: number; total: number }) {
  const STEPS = ['דרישות', 'רכיבים', 'תצוגה מקדימה']
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        {STEPS.map((label, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              flex: 1,
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background:
                  i + 1 < step
                    ? COLORS.success
                    : i + 1 === step
                    ? COLORS.accent
                    : COLORS.border,
                color: i + 1 <= step ? '#fff' : COLORS.textDim,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                transition: 'all 0.2s ease',
              }}
            >
              {i + 1 < step ? '✓' : i + 1}
            </div>
            <div
              style={{
                fontSize: '10px',
                color: i + 1 === step ? COLORS.text : COLORS.textDim,
                fontWeight: i + 1 === step ? 600 : 400,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: '3px', background: COLORS.border, borderRadius: '2px' }}>
        <div
          style={{
            height: '100%',
            background: COLORS.accent,
            borderRadius: '2px',
            width: `${((step - 1) / (total - 1)) * 100}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}

// ---- Main Wizard Component -----------------------------------------------

const TOTAL_STEPS = 3

const DEFAULT_CONFIG: WizardConfig = {
  target_capacity_mwh: 10,
  target_power_mw: 5,
  site_width_m: 200,
  site_height_m: 150,
  battery_model: 'CATL EnerOne Plus',
  pcs_model: 'SMA Sunny Central Storage 2500',
  layout_style: 'grid',
}

export function ConfigWizard({ onClose, onApply }: ConfigWizardProps) {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<WizardConfig>(DEFAULT_CONFIG)
  const [generatedLayout, setGeneratedLayout] = useState<GeneratedLayout | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (updates: Partial<WizardConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }))
  }

  const handleNext = async () => {
    if (step === 2) {
      // Moving to step 3 → generate layout
      setIsGenerating(true)
      setError(null)
      try {
        const res = await api.post<GeneratedLayout>('/api/layout/generate', config)
        setGeneratedLayout(res.data)
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string }
        setError(
          axiosErr?.response?.data?.detail ||
            axiosErr?.message ||
            'שגיאה ביצירת הפריסה'
        )
      } finally {
        setIsGenerating(false)
      }
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1))
  }

  const handleApply = () => {
    if (generatedLayout) {
      onApply(generatedLayout.components)
      onClose()
    }
  }

  const handleStartOver = () => {
    setStep(1)
    setConfig(DEFAULT_CONFIG)
    setGeneratedLayout(null)
    setError(null)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: '12px',
          padding: '28px',
          width: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          direction: 'rtl',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.textDim,
              cursor: 'pointer',
              fontSize: '18px',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: COLORS.text }}>
            אשף הגדרת פריסת BESS
          </h2>
        </div>

        <ProgressBar step={step} total={TOTAL_STEPS} />

        {/* Step Content */}
        <div style={{ minHeight: '300px' }}>
          {step === 1 && <Step1Requirements config={config} onChange={handleChange} />}
          {step === 2 && <Step2Components config={config} onChange={handleChange} />}
          {step === 3 && (
            <Step3Preview
              layout={generatedLayout}
              isGenerating={isGenerating}
              error={error}
              onApply={handleApply}
            />
          )}
        </div>

        {/* Navigation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            {step > 1 && (
              <button
                onClick={handleBack}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  color: COLORS.text,
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                הקודם
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleStartOver}
                style={{
                  background: 'none',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '6px',
                  color: COLORS.textMuted,
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                התחל מחדש
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                color: COLORS.textMuted,
                fontSize: '12px',
                fontWeight: 600,
                padding: '8px 16px',
                cursor: 'pointer',
              }}
            >
              ביטול
            </button>
            {step < TOTAL_STEPS && (
              <button
                onClick={handleNext}
                style={{
                  background: COLORS.accent,
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '8px 20px',
                  cursor: 'pointer',
                }}
              >
                הבא
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
