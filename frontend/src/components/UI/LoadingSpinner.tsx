export function LoadingSpinner({ message = 'טוען...' }: { message?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '32px' }}>
      <div style={{
        width: '40px', height: '40px',
        border: '3px solid #3a4060',
        borderTop: '3px solid #f0c040',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <span style={{ color: '#94a3b8' }}>{message}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
