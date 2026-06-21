import axios from 'axios'
import type { BESSSite, BESSComponent, DrawingData, CapacityResult } from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

export const sitesApi = {
  list: () => api.get<BESSSite[]>('/api/sites'),
  get: (id: string) => api.get<BESSSite>(`/api/sites/${id}`),
  create: (data: Partial<BESSSite>) => api.post<BESSSite>('/api/sites', data),
  update: (id: string, data: Partial<BESSSite>) => api.put<BESSSite>(`/api/sites/${id}`, data),
  delete: (id: string) => api.delete(`/api/sites/${id}`),
  updateDrawing: (id: string, drawingData: DrawingData) =>
    api.put(`/api/sites/${id}/drawing`, { drawing_data: drawingData }),
}

export const componentsApi = {
  list: (siteId: string) => api.get<BESSComponent[]>(`/api/sites/${siteId}/components`),
  add: (siteId: string, comp: Partial<BESSComponent>) =>
    api.post<BESSComponent>(`/api/sites/${siteId}/components`, comp),
  update: (siteId: string, compId: string, data: Partial<BESSComponent>) =>
    api.put<BESSComponent>(`/api/sites/${siteId}/components/${compId}`, data),
  delete: (siteId: string, compId: string) =>
    api.delete(`/api/sites/${siteId}/components/${compId}`),
  bulkUpdate: (siteId: string, comps: Partial<BESSComponent>[]) =>
    api.post(`/api/sites/${siteId}/components/bulk`, comps),
}

export const calculationsApi = {
  capacity: (components: BESSComponent[], siteAreaM2: number) =>
    api.post<CapacityResult>('/api/calculations/capacity', {
      components,
      site_area_m2: siteAreaM2,
    }),
  landUse: (components: BESSComponent[], siteAreaM2: number) =>
    api.post('/api/calculations/land-use', {
      components,
      site_area_m2: siteAreaM2,
    }),
  costEstimate: (components: BESSComponent[], siteAreaM2: number) =>
    api.post('/api/calculations/cost-estimate', {
      components,
      site_area_m2: siteAreaM2,
    }),
  cableSizing: (powerKw: number, voltageV: number, distanceM: number, powerFactor = 0.95) =>
    api.post('/api/calculations/cable-sizing', {
      power_kw: powerKw,
      voltage_v: voltageV,
      distance_m: distanceM,
      power_factor: powerFactor,
    }),
}

export interface ReportOptions {
  title?: string
  author?: string
  project_number?: string
  include_component_list?: boolean
  include_cost_estimate?: boolean
  include_calculations?: boolean
}

export const reportsApi = {
  generate: (siteId: string, options: ReportOptions = {}) =>
    api.post(`/api/reports/generate/${siteId}`, options, { responseType: 'blob' }),
}
