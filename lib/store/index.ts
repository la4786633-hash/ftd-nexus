// ============================================================
// FTD NEXUS — Zustand Global Store
// Client-side state management (UI state, preferences, etc.)
// ============================================================

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ============================================================
// SIDEBAR STATE
// ============================================================

interface SidebarState {
  isCollapsed: boolean
  isMobileOpen: boolean
  expandedGroups: string[]
  toggleCollapsed: () => void
  setMobileOpen: (open: boolean) => void
  toggleGroup: (group: string) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isCollapsed: false,
      isMobileOpen: false,
      expandedGroups: ['4dx', 'cobra'],

      toggleCollapsed: () =>
        set(state => ({ isCollapsed: !state.isCollapsed })),

      setMobileOpen: (open) => set({ isMobileOpen: open }),

      toggleGroup: (group) =>
        set(state => ({
          expandedGroups: state.expandedGroups.includes(group)
            ? state.expandedGroups.filter(g => g !== group)
            : [...state.expandedGroups, group],
        })),
    }),
    {
      name: 'ftd-nexus-sidebar',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        expandedGroups: state.expandedGroups,
      }),
    }
  )
)

// ============================================================
// NOTIFICATION STATE
// ============================================================

interface NotificationState {
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
  togglePanel: () => void
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  panelOpen: false,
  setPanelOpen: (open) => set({ panelOpen: open }),
  togglePanel: () => set(state => ({ panelOpen: !state.panelOpen })),
}))

// ============================================================
// WAR ROOM ROLE STATE
// ============================================================

type WarRoomRole = 'exec' | 'coord' | 'consult'

interface WarRoomState {
  activeRole: WarRoomRole | null
  setActiveRole: (role: WarRoomRole) => void
}

export const useWarRoomStore = create<WarRoomState>()((set) => ({
  activeRole: null,
  setActiveRole: (role) => set({ activeRole: role }),
}))

// ============================================================
// PREFERENCES STATE
// ============================================================

interface PreferencesState {
  warRoomPresentationMode: boolean
  relatoriosPeriodo: 'semana' | 'mes' | 'trimestre'
  cobraPipelineView: 'kanban' | 'lista'
  setWarRoomPresentationMode: (on: boolean) => void
  setRelatoriosPeriodo: (p: 'semana' | 'mes' | 'trimestre') => void
  setCobraPipelineView: (v: 'kanban' | 'lista') => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      warRoomPresentationMode: false,
      relatoriosPeriodo: 'mes',
      cobraPipelineView: 'kanban',

      setWarRoomPresentationMode: (on) =>
        set({ warRoomPresentationMode: on }),

      setRelatoriosPeriodo: (p) =>
        set({ relatoriosPeriodo: p }),

      setCobraPipelineView: (v) =>
        set({ cobraPipelineView: v }),
    }),
    {
      name: 'ftd-nexus-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// ============================================================
// COBRA KANBAN STATE
// ============================================================

interface KanbanState {
  activeCardId: string | null
  filterConsultor: string | null
  filterSearch: string
  setActiveCardId: (id: string | null) => void
  setFilterConsultor: (id: string | null) => void
  setFilterSearch: (q: string) => void
}

export const useKanbanStore = create<KanbanState>()((set) => ({
  activeCardId: null,
  filterConsultor: null,
  filterSearch: '',

  setActiveCardId: (id) => set({ activeCardId: id }),
  setFilterConsultor: (id) => set({ filterConsultor: id }),
  setFilterSearch: (q) => set({ filterSearch: q }),
}))

// ============================================================
// CADENCIA SESSION STATE (for presentation/meeting mode)
// ============================================================

interface CadenciaSessionState {
  sessionActive: boolean
  currentStep: 0 | 1 | 2 // 0=comprometimentos, 1=placar, 2=novos
  sessionCadenciaId: string | null
  startSession: (cadenciaId: string) => void
  endSession: () => void
  setStep: (step: 0 | 1 | 2) => void
  nextStep: () => void
}

export const useCadenciaSessionStore = create<CadenciaSessionState>()((set, get) => ({
  sessionActive: false,
  currentStep: 0,
  sessionCadenciaId: null,

  startSession: (cadenciaId) =>
    set({ sessionActive: true, currentStep: 0, sessionCadenciaId: cadenciaId }),

  endSession: () =>
    set({ sessionActive: false, currentStep: 0, sessionCadenciaId: null }),

  setStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const current = get().currentStep
    if (current < 2) set({ currentStep: (current + 1) as 0 | 1 | 2 })
  },
}))
