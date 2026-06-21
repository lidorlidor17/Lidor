import { useState, useCallback } from 'react'
import { Save, FileText, Grid, Layers } from 'lucide-react'
import { useSiteStore } from '../../store/siteStore'
import { sitesApi } from '../../api/client'

export function TopBar() {
  const {
    activeSite,
    setActiveSite,
    scale,
    setScale,
    viewMode,
    setViewMode,
    showGrid,
    toggleGrid,
    components,
  } = useSiteStore()

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [editingScale, setEditingScale] = useState(false)
  const [scaleValue, setScaleValue] = useState('')
  const [saving, setSaving] = useState(false)

  const handleNameClick = () => {
    setNameValue(activeSite?.name ?? '')
    setEditingName(true)
  }

  const handleNameBlur = useCallback(async () => {
    setEditingName(false)
    if (!activeSite || !nameValue.trim()) return
    const updated = { ...activeSite, name: nameValue.trim() }
    setActiveSite(updated)
    try {
      await sitesApi.update(activeSite.id, { name: nameValue.trim() })
    } catch (err) {
      console.warn('Failed to update site name:', err)
    }
  }, [activeSite, nameValue, setActiveSite])

  const handleScaleClick = () => {
    setScaleValue(String(Math.round(1 / scale)))
    setEditingScale(true)
  }

  const handleScaleBlur = () => {
    setEditingScale(false)
    const val = parseInt(scaleValue)
    if (!isNaN(val) && val > 0) {
      setScale(1 / val)
    }
  }

  const handleSave = useCallback(async () => {
    if (!activeSite || saving) return
    setSaving(true)
    try {
      await sitesApi.update(activeSite.id, {
        drawing_data: activeSite.drawing_data ?? { scale, origin: { x: 0, y: 0 } },
      })
    } catch (err) {
      console.warn('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }, [activeSite, saving, scale])

  const handleReports = useCallback(async () => {
    if (!activeSite) return
    alert(`יצירת דוח לאתר: ${activeSite.name}\n(הפונקציה תהיה זמינה עם חיבור לשרת)`)
  }, [activeSite])

  return (
    <div
      style={{
        height: '52px',
        background: '#0f1117',
        borderBottom: '1px solid #2a3050',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '12px',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontSize: '16px',
          fontWeight: 800,
          color: '#f0c040',
          letterSpacing: '-0.02em',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        ⚡ BESS Planner
      </div>

      <div style={{ width: '1px', height: '24px', background: '#2a3050' }} />

      {/* Site name - center */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {editingName ? (
          <input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNameBlur() }}
            style={{
              background: '#252a3a',
              border: '1px solid #3b82f6',
              borderRadius: '4px',
              padding: '4px 10px',
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: 600,
              outline: 'none',
              minWidth: '200px',
              textAlign: 'center',
            }}
          />
        ) : (
          <button
            onClick={handleNameClick}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e2e8f0',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '4px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#252a3a' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            title="לחץ לעריכת שם"
          >
            {activeSite?.name ?? 'אתר ללא שם'}
          </button>
        )}
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Component count badge */}
        <div
          style={{
            fontSize: '11px',
            color: '#6b7280',
            background: '#252a3a',
            padding: '3px 8px',
            borderRadius: '12px',
            border: '1px solid #3a4060',
          }}
        >
          {components.length} רכיבים
        </div>

        {/* Scale */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#252a3a',
            border: '1px solid #3a4060',
            borderRadius: '4px',
            padding: '3px 8px',
          }}
        >
          <span style={{ fontSize: '10px', color: '#6b7280' }}>קנ"מ</span>
          {editingScale ? (
            <input
              autoFocus
              value={scaleValue}
              onChange={(e) => setScaleValue(e.target.value)}
              onBlur={handleScaleBlur}
              onKeyDown={(e) => { if (e.key === 'Enter') handleScaleBlur() }}
              style={{
                width: '50px',
                background: 'transparent',
                border: 'none',
                color: '#f0c040',
                fontSize: '11px',
                fontWeight: 700,
                outline: 'none',
                textAlign: 'center',
              }}
            />
          ) : (
            <button
              onClick={handleScaleClick}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f0c040',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              1:{Math.round(1 / scale)}
            </button>
          )}
        </div>

        {/* Grid toggle */}
        <button
          onClick={toggleGrid}
          title={showGrid ? 'הסתר רשת' : 'הצג רשת'}
          style={{
            background: showGrid ? '#1e3a5f' : '#252a3a',
            border: `1px solid ${showGrid ? '#3b82f6' : '#3a4060'}`,
            borderRadius: '4px',
            color: showGrid ? '#60a5fa' : '#6b7280',
            cursor: 'pointer',
            padding: '5px 7px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Grid size={15} />
        </button>

        {/* 2D/3D toggle */}
        <button
          onClick={() => setViewMode(viewMode === '2d' ? '3d' : '2d')}
          style={{
            background: '#252a3a',
            border: '1px solid #3a4060',
            borderRadius: '4px',
            color: '#e2e8f0',
            cursor: 'pointer',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Layers size={13} />
          {viewMode === '2d' ? '3D' : '2D'}
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? '#1e3a5f' : '#1d4ed8',
            border: '1px solid #3b82f6',
            borderRadius: '4px',
            color: '#fff',
            cursor: saving ? 'wait' : 'pointer',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Save size={13} />
          {saving ? 'שומר...' : 'שמור'}
        </button>

        {/* Reports */}
        <button
          onClick={handleReports}
          style={{
            background: '#252a3a',
            border: '1px solid #3a4060',
            borderRadius: '4px',
            color: '#e2e8f0',
            cursor: 'pointer',
            padding: '5px 12px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <FileText size={13} />
          דוחות
        </button>
      </div>
    </div>
  )
}
