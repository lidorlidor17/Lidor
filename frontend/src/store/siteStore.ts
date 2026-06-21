import { create } from 'zustand'
import { BESSComponent, BESSSite } from '../types'

interface SiteStore {
  activeSite: BESSSite | null
  components: BESSComponent[]
  setActiveSite: (site: BESSSite | null) => void
  setComponents: (components: BESSComponent[]) => void
  addComponent: (component: BESSComponent) => void
  removeComponent: (id: string) => void
  updateComponent: (id: string, updates: Partial<BESSComponent>) => void
}

export const useSiteStore = create<SiteStore>((set) => ({
  activeSite: null,
  components: [],
  setActiveSite: (site) => set({ activeSite: site }),
  setComponents: (components) => set({ components }),
  addComponent: (component) =>
    set((state) => ({ components: [...state.components, component] })),
  removeComponent: (id) =>
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
    })),
  updateComponent: (id, updates) =>
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
}))
