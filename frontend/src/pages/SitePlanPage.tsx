import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { TopBar } from '../components/Toolbar/TopBar'
import { ComponentPalette } from '../components/Toolbar/ComponentPalette'
import { PropertiesPanel } from '../components/Toolbar/PropertiesPanel'
import { SitePlanCanvas } from '../components/Canvas2D/SitePlanCanvas'
import { useSiteStore } from '../store/siteStore'
import { sitesApi, componentsApi } from '../api/client'

export function SitePlanPage() {
  const { id } = useParams<{ id: string }>()
  const { setActiveSite, setComponents } = useSiteStore()

  useEffect(() => {
    if (!id) return

    const loadSite = async () => {
      try {
        const [siteRes, compsRes] = await Promise.all([
          sitesApi.get(id),
          componentsApi.list(id),
        ])
        setActiveSite(siteRes.data)
        setComponents(compsRes.data)
      } catch (err) {
        console.warn('Failed to load site data:', err)
        // Set a placeholder site for demo purposes
        setActiveSite({
          id: id,
          name: 'אתר BESS חדש',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        setComponents([])
      }
    }

    loadSite()
  }, [id, setActiveSite, setComponents])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#0f1117',
      }}
    >
      <TopBar />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          // RTL: palette on right, canvas in center, properties on left
        }}
      >
        {/* Component palette - right side (RTL) */}
        <ComponentPalette />
        {/* Canvas - center */}
        <SitePlanCanvas />
        {/* Properties panel - left side (RTL) */}
        <PropertiesPanel />
      </div>
    </div>
  )
}
