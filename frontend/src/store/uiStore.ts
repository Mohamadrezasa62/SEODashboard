import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  activeProject: string | null
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void
  setActiveProject: (projectId: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeProject: null,

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

  toggleSidebarCollapsed: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setActiveProject: (activeProject) => set({ activeProject }),
}))