import axios from 'axios'
import type { Project, ComponentInstance } from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

export const projectsApi = {
  list: () => api.get<Project[]>('/api/projects'),
  get: (id: string) => api.get<Project>(`/api/projects/${id}`),
  create: (name: string, description = '') =>
    api.post<Project>('/api/projects', { name, description }),
}

export const componentsApi = {
  list: (projectId: string) =>
    api.get<ComponentInstance[]>(`/api/projects/${projectId}/components`),

  add: (projectId: string, payload: {
    component_type_id: string
    name: string
    x: number
    y: number
    width?: number
    height?: number
  }) => api.post<ComponentInstance>(`/api/projects/${projectId}/components`, payload),

  updatePosition: (projectId: string, compId: string, x: number, y: number) =>
    api.patch<ComponentInstance>(`/api/projects/${projectId}/components/${compId}`, { x, y }),

  delete: (projectId: string, compId: string) =>
    api.delete(`/api/projects/${projectId}/components/${compId}`),
}
