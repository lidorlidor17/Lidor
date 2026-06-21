import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Battery, Zap, Calendar, X } from 'lucide-react'
import { useSiteStore } from '../store/siteStore'
import { sitesApi } from '../api/client'
import type { BESSSite } from '../types'

interface NewSiteForm {
  name: string
  location: string
  target_capacity_mwh: string
  target_power_mw: string
  description: string
}

function SiteCard({ site, onClick }: { site: BESSSite; onClick: () => void }) {
  const date = new Date(site.updated_at).toLocaleDateString('he-IL')

  return (
    <button
      onClick={onClick}
      style={{
        background: '#252a3a',
        border: '1px solid #3a4060',
        borderRadius: '10px',
        padding: '18px',
        cursor: 'pointer',
        textAlign: 'right',
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = '1px solid #3b82f6'
        e.currentTarget.style.background = '#2d3348'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = '1px solid #3a4060'
        e.currentTarget.style.background = '#252a3a'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            background: '#16a34a22',
            border: '1px solid #16a34a44',
            borderRadius: '6px',
            padding: '6px 8px',
            fontSize: '20px',
          }}
        >
          🔋
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>{site.name}</div>
          {site.description && (
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
              {site.description}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {site.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{site.location}</span>
            <MapPin size={11} color="#6b7280" />
          </div>
        )}
        {site.target_capacity_mwh && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>
              {site.target_capacity_mwh} MWh
            </span>
            <Battery size={11} color="#22c55e" />
          </div>
        )}
        {site.target_power_mw && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>
              {site.target_power_mw} MW
            </span>
            <Zap size={11} color="#3b82f6" />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '10px', color: '#4b5563' }}>{date}</span>
          <Calendar size={10} color="#4b5563" />
        </div>
      </div>
    </button>
  )
}

interface NewSiteModalProps {
  onClose: () => void
  onCreated: (site: BESSSite) => void
}

function NewSiteModal({ onClose, onCreated }: NewSiteModalProps) {
  const [form, setForm] = useState<NewSiteForm>({
    name: '',
    location: '',
    target_capacity_mwh: '',
    target_power_mw: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('שם האתר הוא שדה חובה')
      return
    }
    setLoading(true)
    setError('')

    try {
      const res = await sitesApi.create({
        name: form.name.trim(),
        location: form.location.trim() || undefined,
        description: form.description.trim() || undefined,
        target_capacity_mwh: form.target_capacity_mwh ? parseFloat(form.target_capacity_mwh) : undefined,
        target_power_mw: form.target_power_mw ? parseFloat(form.target_power_mw) : undefined,
      })
      onCreated(res.data)
    } catch (_err) {
      // If API not available, create a local site for demo
      const demoSite: BESSSite = {
        id: `demo-${Date.now()}`,
        name: form.name.trim(),
        location: form.location.trim() || undefined,
        description: form.description.trim() || undefined,
        target_capacity_mwh: form.target_capacity_mwh ? parseFloat(form.target_capacity_mwh) : undefined,
        target_power_mw: form.target_power_mw ? parseFloat(form.target_power_mw) : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      onCreated(demoSite)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    background: '#252a3a',
    border: '1px solid #3a4060',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '13px',
    outline: 'none',
    marginTop: '4px',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: 600,
    marginBottom: '0',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#1a1d2e',
          border: '1px solid #3a4060',
          borderRadius: '12px',
          padding: '28px',
          width: '420px',
          maxWidth: '95vw',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>
            ⚡ אתר BESS חדש
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>שם האתר *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="לדוגמה: אתר אגירה נגב דרום"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>מיקום</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="לדוגמה: באר שבע, ישראל"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>קיבולת יעד (MWh)</label>
              <input
                type="number"
                value={form.target_capacity_mwh}
                onChange={(e) => setForm((f) => ({ ...f, target_capacity_mwh: e.target.value }))}
                placeholder="לדוגמה: 100"
                min="0"
                step="0.1"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>הספק יעד (MW)</label>
              <input
                type="number"
                value={form.target_power_mw}
                onChange={(e) => setForm((f) => ({ ...f, target_power_mw: e.target.value }))}
                placeholder="לדוגמה: 50"
                min="0"
                step="0.1"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>תיאור</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="תיאור קצר של הפרויקט..."
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {error && (
            <div style={{ color: '#f87171', fontSize: '12px', textAlign: 'right' }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', marginTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 18px',
                background: '#252a3a',
                border: '1px solid #3a4060',
                borderRadius: '6px',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 20px',
                background: '#1d4ed8',
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                color: '#fff',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                flex: 1,
              }}
            >
              {loading ? 'יוצר...' : 'צור אתר'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { sites, setSites } = useSiteStore()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSites = async () => {
      try {
        const res = await sitesApi.list()
        setSites(res.data)
      } catch (_err) {
        // API not available - show empty state
        setSites([])
      } finally {
        setLoading(false)
      }
    }
    loadSites()
  }, [setSites])

  const handleSiteCreated = (site: BESSSite) => {
    setSites([site, ...sites])
    setShowModal(false)
    navigate(`/site/${site.id}`)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f1117',
        padding: '0',
        direction: 'rtl',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#1a1d2e',
          borderBottom: '1px solid #2a3050',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 18px',
            background: '#1d4ed8',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          <Plus size={15} />
          אתר חדש
        </button>
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#f0c040' }}>
          ⚡ BESS Planner
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          padding: '60px 32px 40px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #1a1d2e 0%, #0f1117 100%)',
          borderBottom: '1px solid #2a3050',
        }}
      >
        <div style={{ fontSize: '36px', fontWeight: 900, color: '#e2e8f0', marginBottom: '12px' }}>
          ⚡ תכנון אתרי אגירת חשמל BESS
        </div>
        <div
          style={{
            fontSize: '16px',
            color: '#6b7280',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          תוכנה לשרטוט, מידול וחישוב אתרי אגירת חשמל בסוללות
        </div>

        {/* Feature chips */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            marginTop: '24px',
            flexWrap: 'wrap',
          }}
        >
          {['שרטוט 2D', 'תצוגת 3D', 'חישוב קיבולת', 'יצוא דוחות', 'ממשק בעברית'].map((f) => (
            <span
              key={f}
              style={{
                padding: '4px 12px',
                background: '#252a3a',
                border: '1px solid #3a4060',
                borderRadius: '20px',
                fontSize: '12px',
                color: '#94a3b8',
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Sites grid */}
      <div style={{ padding: '32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#4b5563' }}>
            {sites.length} אתרים
          </span>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>
            האתרים שלי
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#4b5563', padding: '60px' }}>
            טוען אתרים...
          </div>
        ) : sites.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 32px',
              background: '#252a3a',
              borderRadius: '12px',
              border: '1px dashed #3a4060',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔋</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>
              אין אתרים עדיין
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '20px' }}>
              צור אתר BESS חדש כדי להתחיל לתכנן
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 22px',
                background: '#1d4ed8',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              <Plus size={16} />
              צור אתר חדש
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {sites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                onClick={() => navigate(`/site/${site.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewSiteModal onClose={() => setShowModal(false)} onCreated={handleSiteCreated} />
      )}
    </div>
  )
}
