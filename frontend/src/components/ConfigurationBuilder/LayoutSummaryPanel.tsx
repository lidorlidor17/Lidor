// ---- Types ----------------------------------------------------------------

export interface BESSComponentLike {
  component_type: string
  properties?: {
    capacity_kwh?: number
    power_kw?: number
    quantity?: number
    [key: string]: unknown
  }
}

export interface LayoutSummaryPanelProps {
  components: BESSComponentLike[]
  targetMwh: number
  targetMw: number
}

// ---- Helpers --------------------------------------------------------------

function computeSummary(components: BESSComponentLike[]) {
  let totalCapacityKwh = 0
  let totalPowerKw = 0
  let numBatteries = 0
  let numPcs = 0

  for (const c of components) {
    const props = c.properties ?? {}
    const qty = typeof props.quantity === 'number' ? props.quantity : 1

    if (c.component_type === 'battery_container') {
      const capKwh = typeof props.capacity_kwh === 'number' ? props.capacity_kwh : 250
      const pwrKw = typeof props.power_kw === 'number' ? props.power_kw : 125
      totalCapacityKwh += capKwh * qty
      totalPowerKw += pwrKw * qty
      numBatteries += qty
    } else if (c.component_type === 'pcs') {
      const pwrKw = typeof props.power_kw === 'number' ? props.power_kw : 0
      totalPowerKw += pwrKw * qty
      numPcs += qty
    }
  }

  return {
    totalCapacityMwh: totalCapacityKwh / 1000,
    totalPowerMw: totalPowerKw / 1000,
    numBatteries,
    numPcs,
  }
}

// ---- Shared Styles --------------------------------------------------------

const COLORS = {
  bg: '#1a1d2e',
  surface: '#252a3a',
  border: '#3a4060',
  text: '#e2e8f0',
  textMuted: '#9ca3af',
  textDim: '#6b7280',
  accentLight: '#60a5fa',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
}

// ---- Sub-components -------------------------------------------------------

function StatRow({
  icon,
  label,
  value,
  unit,
  status,
}: {
  icon: string
  label: string
  value: string | number
  unit: string
  status: 'ok' | 'warn' | 'error' | 'info'
}) {
  const statusColor =
    status === 'ok'
      ? COLORS.success
      : status === 'warn'
      ? COLORS.warning
      : status === 'error'
      ? COLORS.error
      : COLORS.accentLight

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 0',
        borderBottom: `1px solid ${COLORS.border}`,
        direction: 'rtl',
      }}
    >
      <span style={{ fontSize: '14px', color: statusColor, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: '12px', color: COLORS.textMuted }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 700, color: statusColor }}>
        {value}
        <span style={{ fontSize: '10px', fontWeight: 400, color: COLORS.textDim, marginRight: '3px' }}>
          {unit}
        </span>
      </span>
    </div>
  )
}

function WarningBadge({ text }: { text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        padding: '6px 8px',
        background: '#2a1f10',
        border: `1px solid ${COLORS.warning}44`,
        borderRadius: '6px',
        fontSize: '11px',
        color: COLORS.warning,
        direction: 'rtl',
        marginTop: '6px',
      }}
    >
      <span style={{ flexShrink: 0 }}>⚠</span>
      <span>{text}</span>
    </div>
  )
}

// ---- Main LayoutSummaryPanel ---------------------------------------------

export function LayoutSummaryPanel({ components, targetMwh, targetMw }: LayoutSummaryPanelProps) {
  const { totalCapacityMwh, totalPowerMw, numBatteries, numPcs } = computeSummary(components)

  const capacityShortfall = targetMwh > 0 && totalCapacityMwh < targetMwh * 0.95
  const powerShortfall = targetMw > 0 && totalPowerMw < targetMw * 0.95
  const capacityExcess = targetMwh > 0 && totalCapacityMwh > targetMwh * 1.2

  const capacityStatus = capacityShortfall ? 'error' : capacityExcess ? 'warn' : 'ok'
  const powerStatus = powerShortfall ? 'error' : 'ok'

  const hasComponents = components.length > 0

  return (
    <div
      style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '10px',
        padding: '14px',
        direction: 'rtl',
        minWidth: '200px',
      }}
    >
      {/* Header */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: COLORS.textDim,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '10px',
        }}
      >
        סיכום פריסה
      </div>

      {!hasComponents ? (
        <div style={{ fontSize: '12px', color: COLORS.textDim, textAlign: 'center', padding: '12px 0' }}>
          אין רכיבים על הקנבס
        </div>
      ) : (
        <>
          <StatRow
            icon={numBatteries > 0 ? '✓' : '○'}
            label="מכלי סוללות"
            value={numBatteries}
            unit="יחידות"
            status={numBatteries > 0 ? 'ok' : 'info'}
          />
          <StatRow
            icon={numPcs > 0 ? '✓' : '○'}
            label="יחידות PCS"
            value={numPcs}
            unit="יחידות"
            status={numPcs > 0 ? 'ok' : 'info'}
          />
          <StatRow
            icon={capacityStatus === 'ok' ? '✓' : capacityStatus === 'warn' ? '⚠' : '✗'}
            label="קיבולת כוללת"
            value={totalCapacityMwh.toFixed(2)}
            unit="MWh"
            status={capacityStatus}
          />
          <StatRow
            icon={powerStatus === 'ok' ? '✓' : '✗'}
            label="הספק כולל"
            value={totalPowerMw.toFixed(2)}
            unit="MW"
            status={powerStatus}
          />

          {/* Target comparison */}
          {(targetMwh > 0 || targetMw > 0) && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px',
                background: COLORS.surface,
                borderRadius: '6px',
                fontSize: '11px',
                color: COLORS.textDim,
              }}
            >
              <div style={{ marginBottom: '4px', fontWeight: 600, color: COLORS.textMuted }}>
                יעדים
              </div>
              {targetMwh > 0 && (
                <div>
                  קיבולת: {totalCapacityMwh.toFixed(1)} / {targetMwh} MWh
                  {' '}
                  ({totalCapacityMwh >= targetMwh ? '+' : ''}{((totalCapacityMwh / targetMwh - 1) * 100).toFixed(0)}%)
                </div>
              )}
              {targetMw > 0 && (
                <div>
                  הספק: {totalPowerMw.toFixed(1)} / {targetMw} MW
                  {' '}
                  ({totalPowerMw >= targetMw ? '+' : ''}{((totalPowerMw / targetMw - 1) * 100).toFixed(0)}%)
                </div>
              )}
            </div>
          )}

          {/* Warnings */}
          {capacityShortfall && (
            <WarningBadge
              text={`קיבולת מתוכננת (${totalCapacityMwh.toFixed(1)} MWh) נמוכה מהיעד (${targetMwh} MWh)`}
            />
          )}
          {powerShortfall && (
            <WarningBadge
              text={`הספק מתוכנן (${totalPowerMw.toFixed(1)} MW) נמוך מהיעד (${targetMw} MW)`}
            />
          )}
          {capacityExcess && !capacityShortfall && (
            <WarningBadge
              text={`קיבולת מתוכננת גבוהה ב-20%+ מהיעד - שקול לצמצם`}
            />
          )}
        </>
      )}
    </div>
  )
}
