type BadgeColor = 'green' | 'blue' | 'yellow' | 'red' | 'grey'

export function Badge({ label, color = 'grey' }: { label: string; color?: BadgeColor }) {
  const colors: Record<BadgeColor, { bg: string; text: string }> = {
    green: { bg: '#166534', text: '#86efac' },
    blue: { bg: '#1e3a5f', text: '#93c5fd' },
    yellow: { bg: '#78350f', text: '#fcd34d' },
    red: { bg: '#7f1d1d', text: '#fca5a5' },
    grey: { bg: '#374151', text: '#d1d5db' },
  }
  const { bg, text } = colors[color]
  return (
    <span style={{
      background: bg, color: text,
      padding: '2px 8px', borderRadius: '9999px',
      fontSize: '12px', fontWeight: 'bold',
    }}>
      {label}
    </span>
  )
}
