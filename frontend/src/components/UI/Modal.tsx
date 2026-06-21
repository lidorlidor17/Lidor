import { ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}

export function Modal({ isOpen, onClose, title, children, width = 500 }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#1a1d2e',
        border: '1px solid #3a4060',
        borderRadius: '12px',
        width: `${width}px`,
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#f0c040' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e2e8f0', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
