import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSiteStore } from '../store/siteStore'
import { projectsApi } from '../api/client'
import type { Project } from '../types'

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const date = new Date(project.updated_at).toLocaleDateString()
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '16px 18px',
        background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8,
        cursor: 'pointer', fontFamily: 'inherit',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#1d4ed8'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(29,78,216,0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#e2e8f0'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ display: 'inline-block', width: 20, height: 12, background: '#f97316', borderRadius: 2, opacity: 0.8 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1c1917' }}>{project.name}</span>
      </div>
      {project.description && (
        <p style={{ fontSize: 12, color: '#78716c', margin: '0 0 8px' }}>{project.description}</p>
      )}
      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Updated {date}</p>
    </button>
  )
}

function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Project) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await projectsApi.create(name.trim(), description.trim())
      onCreated(res.data)
    } catch {
      setError('Could not create project. Make sure the backend is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: 13,
    border: '1px solid #cbd5e1', borderRadius: 6, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 380, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: 'sans-serif' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1c1917', margin: '0 0 18px' }}>New Project</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Project name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Negev South BESS" style={inputStyle} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#64748b', fontWeight: 600, display: 'block', marginBottom: 4 }}>Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" style={inputStyle} />
          </div>
          {error && <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '7px 16px', fontSize: 13, border: '1px solid #cbd5e1', borderRadius: 6, background: '#f8fafc', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '7px 20px', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 6, background: '#1d4ed8', color: '#fff', cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { projects, setProjects } = useSiteStore()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await projectsApi.list()
        setProjects(res.data)
      } catch {
        setApiError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [setProjects])

  const handleCreated = (project: Project) => {
    setProjects([project, ...projects])
    setShowModal(false)
    navigate(`/site/${project.id}`)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1e293b', color: '#f1f5f9', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <strong style={{ fontSize: 16 }}>BESS Layout Tool</strong>
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, background: '#f97316', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' }}
        >
          + New Project
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1c1917', marginBottom: 6 }}>Projects</h1>
        <p style={{ fontSize: 13, color: '#78716c', marginBottom: 28 }}>
          Stage 1 — place Battery Containers on a canvas, saved to SQLite.
        </p>

        {apiError && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, marginBottom: 20, fontSize: 13, color: '#dc2626' }}>
            Backend not reachable at <code>http://localhost:8000</code>. Start the server with <code>uvicorn app.main:app --reload</code>.
          </div>
        )}

        {loading ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</p>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔋</div>
            <p style={{ fontSize: 14, marginBottom: 16 }}>No projects yet.</p>
            <button
              onClick={() => setShowModal(true)}
              style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, background: '#1d4ed8', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer' }}
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onClick={() => navigate(`/site/${p.id}`)} />
            ))}
          </div>
        )}
      </div>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </div>
  )
}
