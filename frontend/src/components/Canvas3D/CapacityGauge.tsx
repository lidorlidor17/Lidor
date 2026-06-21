interface CapacityGaugeProps {
  currentMwh: number
  targetMwh: number
}

/**
 * SVG semicircle gauge showing used vs target capacity in MWh.
 * Green < 80 %, yellow 80–100 %, red > 100 %.
 */
export function CapacityGauge({ currentMwh, targetMwh }: CapacityGaugeProps) {
  const radius = 54
  const cx = 80
  const cy = 80
  const strokeWidth = 12

  // Clamp ratio between 0 and 1.5 so the gauge doesn't loop
  const ratio = targetMwh > 0 ? Math.min(currentMwh / targetMwh, 1.5) : 0
  const pct = Math.min(ratio, 1) // visual fill capped at 100 %

  // Semicircle arc parameters (left → right through top)
  const startAngle = -180 // degrees
  const endAngle = 0

  function polarToCartesian(angle: number): [number, number] {
    const rad = ((angle - 90) * Math.PI) / 180
    return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)]
  }

  function describeArc(from: number, to: number): string {
    const [sx, sy] = polarToCartesian(from)
    const [ex, ey] = polarToCartesian(to)
    const largeArc = to - from > 180 ? 1 : 0
    return `M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArc} 1 ${ex} ${ey}`
  }

  // Arc sweep for fill: from -180° to (-180 + 180*pct)°
  const fillEnd = startAngle + 180 * pct
  const fillArc =
    pct > 0 ? describeArc(startAngle, fillEnd) : null

  let color = '#22c55e' // green
  if (ratio > 1) color = '#ef4444' // red over capacity
  else if (ratio >= 0.8) color = '#eab308' // yellow 80–100 %

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <svg
        width={160}
        height={100}
        viewBox="0 0 160 100"
        aria-label={`Capacity gauge: ${currentMwh.toFixed(1)} of ${targetMwh.toFixed(1)} MWh`}
      >
        {/* Background track */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="#374151"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        {fillArc && (
          <path
            d={fillArc}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.3s, stroke-dasharray 0.3s' }}
          />
        )}
        {/* Centre text: percentage */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fontSize={16}
          fontWeight="bold"
          fill={color}
          fontFamily="monospace"
        >
          {targetMwh > 0 ? `${Math.round(ratio * 100)}%` : '--'}
        </text>
        {/* Labels at ends */}
        <text x={12} y={cy + 4} fontSize={9} fill="#9ca3af" textAnchor="middle">
          0
        </text>
        <text x={148} y={cy + 4} fontSize={9} fill="#9ca3af" textAnchor="middle">
          {targetMwh > 0 ? `${targetMwh.toFixed(0)}` : ''}
        </text>
      </svg>

      {/* Digital readout */}
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 13,
          color: color,
          letterSpacing: '0.04em',
        }}
      >
        {currentMwh.toFixed(1)} MWh
        {targetMwh > 0 && (
          <span style={{ color: '#6b7280' }}>
            {' '}
            / {targetMwh.toFixed(1)} MWh target
          </span>
        )}
      </div>
    </div>
  )
}
