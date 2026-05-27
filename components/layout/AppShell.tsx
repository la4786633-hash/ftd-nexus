'use client'

import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { RealtimeProvider } from '@/components/providers/RealtimeProvider'
import { useNotifications } from '@/lib/hooks/useNotifications'

export function AppShell({ children }: { children: ReactNode }) {
  const { unreadCount } = useNotifications()

  return (
    <RealtimeProvider>
      <div className="app-shell">
        <Sidebar unreadNotifications={unreadCount} />
        <div className="main-content">
          <Topbar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </RealtimeProvider>
  )
}
