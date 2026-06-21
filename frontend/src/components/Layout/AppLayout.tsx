import { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
  showSidebar?: boolean
}

export function AppLayout({ children, showSidebar = false }: AppLayoutProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0f1117',
      color: '#e2e8f0',
      fontFamily: "'Segoe UI', Arial, sans-serif",
      direction: 'rtl'
    }}>
      {children}
    </div>
  )
}
