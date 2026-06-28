import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ComponentPalette } from '../components/Toolbar/ComponentPalette'
import { SitePlanCanvas } from '../components/Canvas2D/SitePlanCanvas'
import { useSiteStore } from '../store/siteStore'
import { projectsApi, componentsApi } from '../api/client'

export function SitePlanPage() {
  const { id } = useParams<{ id: string }>()
  const { setActiveProject, setComponents, activeProject, showGrid, toggleGrid,
    drawingMode, stopPlacing, selectedComponentId, setSelectedComponentId,
    components, removeComponent } = useSiteStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const [projRes, compsRes] = await Promise.all([
          projectsApi.get(id),
          componentsApi.list(id),
        ])
        setActiveProject(projRes.data)
        setComponents(compsRes.data)
      } catch {
        setError('Could not load project. Make sure the backend is running.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, setActiveProject, setComponents])

  // Resize canvas to fill container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(() => {
      setCanvasSize({ width: el.clientWidth, height: el.clientHeight })
    })
    obs.observe(el)
    setCanvasSize({ width: el.clientWidth, height: el.clientHeight })
    return () => obs.disconnect()
  }, [])

  const handleDeleteSelected = async () => {
    if (!id || !selectedComponentId) return
    await componentsApi.delete(id, selectedComponentId)
    removeComponent(selectedComponentId)
    setSelectedComponentId(null)
  }

  const selectedComp = components.find((c) => c.id === selectedComponentId)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#64748b' }}>
        Loading project…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#dc2626' }}>
        {error}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', fontFamily: 'sans-serif' }}>
      {/* Top bar */}
      <div style={{
        height: 44, flexShrink: 0,
        background: '#1e293b', color: '#f1f5f9',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16,
        borderBottom: '1px solid #334155',
      }}>
        <strong style={{ fontSize: 14 }}>BESS Layout Tool</strong>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>— {activeProject?.name}</span>
        <span style={{ flex: 1 }} />
        <button
          onClick={toggleGrid}
          style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, border: '1px solid #475569', background: showGrid ? '#334155' : 'transparent', color: '#f1f5f9', cursor: 'pointer' }}
        >
          {showGrid ? 'Grid: ON' : 'Grid: OFF'}
        </button>
        {drawingMode === 'place_component' && (
          <button
            onClick={stopPlacing}
            style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, border: '1px solid #475569', background: '#334155', color: '#f1f5f9', cursor: 'pointer' }}
          >
            ESC — Cancel
          </button>
        )}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left sidebar: component palette */}
        <ComponentPalette />

        {/* Canvas */}
        <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', background: '#f8fafc' }}>
          {id && (
            <SitePlanCanvas
              projectId={id}
              width={canvasSize.width}
              height={canvasSize.height}
            />
          )}
        </div>

        {/* Right sidebar: properties */}
        <div style={{
          width: 220, flexShrink: 0,
          background: '#f8fafc', borderLeft: '1px solid #e2e8f0',
          padding: '12px 10px', overflowY: 'auto',
        }}>
          <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Properties
          </p>
          {selectedComp ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1917', marginBottom: 6 }}>
                {selectedComp.name}
              </div>
              <div style={{ fontSize: 11, color: '#78716c', marginBottom: 12 }}>
                Type: {selectedComp.component_type_id}
              </div>
              <div style={{ fontSize: 11, color: '#78716c', marginBottom: 2 }}>
                Position: ({Math.round(selectedComp.x)}, {Math.round(selectedComp.y)})
              </div>
              <div style={{ fontSize: 11, color: '#78716c', marginBottom: 12 }}>
                Size: {selectedComp.width} × {selectedComp.height}
              </div>
              {selectedComp.field_values.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {selectedComp.field_values.map((fv) => (
                    <div key={fv.field_key} style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{fv.label}: </span>
                      <span style={{ fontSize: 11, color: '#1c1917', fontWeight: 500 }}>
                        {fv.value || '—'}{fv.unit ? ` ${fv.unit}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={handleDeleteSelected}
                style={{
                  width: '100%', padding: '6px 0', fontSize: 12,
                  background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 4,
                  color: '#dc2626', cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              Click a component to select it.
            </p>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        height: 26, flexShrink: 0,
        background: '#f1f5f9', borderTop: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 16,
        fontSize: 11, color: '#64748b',
      }}>
        <span>{components.length} component{components.length !== 1 ? 's' : ''}</span>
        <span>Mode: {drawingMode}</span>
        {selectedComp && <span>Selected: {selectedComp.name}</span>}
      </div>
    </div>
  )
}
