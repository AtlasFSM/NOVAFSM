import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  jobsViewMode: 'kanban' | 'table';
  setJobsViewMode: (mode: 'kanban' | 'table') => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      jobsViewMode: 'kanban',
      setJobsViewMode: (mode) => set({ jobsViewMode: mode }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'novafsm-ui-storage',
    }
  )
);
