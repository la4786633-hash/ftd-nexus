'use client'

export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { WarRoomExec } from '@/components/dashboard/WarRoomExec'
import { WarRoomCoord } from '@/components/dashboard/WarRoomCoord'
import { WarRoomConsult } from '@/components/dashboard/WarRoomConsult'
import { cn } from '@/lib/utils/cn'
import type { UserRole } from '@/lib/supabase/types'

type RoleView = 'exec' | 'coord' | 'consult'

const ROLE_LABELS: Record<RoleView, string> = {
  exec: 'Executivo',
  coord: 'Coordenador',
  consult: 'Consultor',
}

function getDefaultRole(role?: UserRole): RoleView {
  if (!role) return 'consult'
  if (['admin', 'gerente'].includes(role)) return 'exec'
  if (role === 'coordenador') return 'coord'
  return 'consult'
}

export default function WarRoomPage() {
  const { profile } = useAuth()
  const searchParams = useSearchParams()
  const presentationMode = searchParams.get('mode') === 'presentation'

  const defaultRole = getDefaultRole(profile?.role)
  const [activeRole, setActiveRole] = useState<RoleView>(defaultRole)

  const isAboveConsultor = profile?.role
    ? ['admin', 'gerente', 'coordenador'].includes(profile.role)
    : false

  return (
    <div className="flex flex-col flex-1">
      {/* Role switcher — only for coordinator and above */}
      {isAboveConsultor && (
        <div className="bg-white border-b border-surface-border px-3 py-1.5 flex items-center gap-1">
          <span className="text-[10px] text-ink-tertiary mr-2">Visão:</span>
          {(Object.keys(ROLE_LABELS) as RoleView[]).map(role => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={cn(
                'text-xs px-3 py-1 rounded transition-all',
                activeRole === role
                  ? 'bg-brand-blue text-white font-medium'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-secondary'
              )}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="page-content">
        {activeRole === 'exec' && <WarRoomExec presentationMode={presentationMode} />}
        {activeRole === 'coord' && <WarRoomCoord />}
        {activeRole === 'consult' && <WarRoomConsult />}
      </div>
    </div>
  )
}
