import { create } from 'zustand'
import type { BESSSite, BESSComponent, DrawingMode, ComponentType, MousePosition } from '../types'

interface SiteStore {
  sites: BESSSite[]
  activeSite: BESSSite | null
  components: BESSComponent[]
  drawingMode: DrawingMode
  selectedComponentType: ComponentType | null
  selectedComponentId: string | null
  scale: number   // meters per pixel, default 0.5
  viewMode: '2d' | '3d'
  showGrid: boolean
  mousePosition: MousePosition | null

  // Actions
  setActiveSite: (site: BESSSite | null) => void
  setSites: (sites: BESSSite[]) => void
  setComponents: (components: BESSComponent[]) => void
  addComponent: (comp: BESSComponent) => void
  updateComponent: (id: string, updates: Partial<BESSComponent>) => void
  removeComponent: (id: string) => void
  setDrawingMode: (mode: DrawingMode) => void
  setSelectedComponentType: (type: ComponentType | null) => void
  setSelectedComponentId: (id: string | null) => void
  setScale: (scale: number) => void
  setViewMode: (mode: '2d' | '3d') => void
  toggleGrid: () => void
  setMousePosition: (pos: MousePosition | null) => void
}

export const useSiteStore = create<SiteStore>((set) => ({
  sites: [],
  activeSite: null,
  components: [],
  drawingMode: 'select',
  selectedComponentType: null,
  selectedComponentId: null,
  scale: 0.5,
  viewMode: '2d',
  showGrid: true,
  mousePosition: null,

  setActiveSite: (site) => set({ activeSite: site }),
  setSites: (sites) => set({ sites }),
  setComponents: (components) => set({ components }),
  addComponent: (comp) => set((s) => ({ components: [...s.components, comp] })),
  updateComponent: (id, updates) =>
    set((s) => ({
      components: s.components.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeComponent: (id) =>
    set((s) => ({ components: s.components.filter((c) => c.id !== id) })),
  setDrawingMode: (mode) => set({ drawingMode: mode }),
  setSelectedComponentType: (type) => set({ selectedComponentType: type }),
  setSelectedComponentId: (id) => set({ selectedComponentId: id }),
  setScale: (scale) => set({ scale }),
  setViewMode: (mode) => set({ viewMode: mode }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  setMousePosition: (pos) => set({ mousePosition: pos }),
}))
