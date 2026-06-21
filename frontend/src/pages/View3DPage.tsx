import { useCallback, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { useSiteStore } from '../store/siteStore'
import { BESSScene3DCanvas } from '../components/Canvas3D/BESSScene3D'
import { Scene3DOverlay } from '../components/Canvas3D/Scene3DOverlay'

// Default pixels-per-meter scale for the 2D canvas
const DEFAULT_SCALE = 0.05

export function View3DPage() {
  const { id } = useParams<{ id: string }>()
  const { activeSite, components } = useSiteStore()

  const [sunAngle, setSunAngle] = useState(60)
  const [shadowsEnabled, setShadowsEnabled] = useState(true)

  // We use a ref to pass reset-view signal to the Canvas via re-render key trick
  const [resetKey, setResetKey] = useState(0)
  const handleResetView = useCallback(() => {
    setResetKey((k) => k + 1)
  }, [])

  // If no active site, redirect home
  if (!activeSite || (id && activeSite.id !== id)) {
    return <Navigate to="/" replace />
  }

  const scale = DEFAULT_SCALE
  const targetMwh = activeSite.target_capacity_mwh ?? 10

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        background: '#0f172a',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '10px 20px',
          background: '#111827',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <Link
          to={`/site/${activeSite.id}`}
          style={{
            color: '#60a5fa',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
          }}
        >
          ← Back to 2D Plan
        </Link>

        <div
          style={{
            height: 20,
            width: 1,
            background: 'rgba(255,255,255,0.15)',
          }}
        />

        <span
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: '#e5e7eb',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {activeSite.name}
        </span>

        <div style={{ flexGrow: 1 }} />

        <span
          style={{
            fontWeight: 700,
            fontSize: 16,
            color: '#a78bfa',
            letterSpacing: '0.02em',
          }}
        >
          3D Visualization
        </span>
      </header>

      {/* ── Main 3D canvas + overlays ───────────────────────────────── */}
      <div
        style={{
          flexGrow: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Three.js canvas */}
        <BESSScene3DCanvas
          key={resetKey}
          components={components}
          scale={scale}
          sunAngle={sunAngle}
          shadowsEnabled={shadowsEnabled}
        />

        {/* HTML overlays positioned absolutely over the canvas */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
        >
          <Scene3DOverlay
            components={components}
            onResetView={handleResetView}
            sunAngle={sunAngle}
            onSunAngleChange={setSunAngle}
            shadowsEnabled={shadowsEnabled}
            onShadowsToggle={setShadowsEnabled}
            targetMwh={targetMwh}
          />
        </div>
      </div>
    </div>
  )
}
