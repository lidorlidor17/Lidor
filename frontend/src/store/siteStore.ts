import { create } from 'zustand'
import type { Project, ComponentInstance, DrawingMode, ComponentTypeDefinition } from '../types'

interface SiteStore {
  projects: Project[]
  activeProject: Project | null
  components: ComponentInstance[]
  componentTypes: ComponentTypeDefinition[]
  drawingMode: DrawingMode
  placingTypeId: string | null
  selectedComponentId: string | null
  showGrid: boolean

  setProjects: (projects: Project[]) => void
  setActiveProject: (project: Project | null) => void
  setComponents: (components: ComponentInstance[]) => void
  setComponentTypes: (types: ComponentTypeDefinition[]) => void
  addComponent: (comp: ComponentInstance) => void
  updateComponent: (id: string, updates: Partial<ComponentInstance>) => void
  removeComponent: (id: string) => void
  startPlacing: (typeId: string) => void
  stopPlacing: () => void
  setSelectedComponentId: (id: string | null) => void
  toggleGrid: () => void
}

export const useSiteStore = create<SiteStore>((set) => ({
  projects: [],
  activeProject: null,
  components: [],
  componentTypes: [],
  drawingMode: 'select',
  placingTypeId: null,
  selectedComponentId: null,
  showGrid: true,

  setProjects: (projects) => set({ projects }),
  setActiveProject: (project) => set({ activeProject: project }),
  setComponents: (components) => set({ components }),
  setComponentTypes: (types) => set({ componentTypes: types }),
  addComponent: (comp) => set((s) => ({ components: [...s.components, comp] })),
  updateComponent: (id, updates) =>
    set((s) => ({
      components: s.components.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeComponent: (id) =>
    set((s) => ({ components: s.components.filter((c) => c.id !== id) })),
  startPlacing: (typeId) => set({ drawingMode: 'place_component', placingTypeId: typeId }),
  stopPlacing: () => set({ drawingMode: 'select', placingTypeId: null }),
  setSelectedComponentId: (id) => set({ selectedComponentId: id }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
}))
