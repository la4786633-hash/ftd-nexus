// ============================================================
// app/(dashboard)/equipe/page.tsx
// ============================================================
'use client'

import { useState } from 'react'
import { Plus, Filter, Users } from 'lucide-react'
import { useTeamMembers, useTeamDashboard, useTeamScoreboard } from '@/lib/hooks/use4dx'
import { useLatestCobraAvaliacao } from '@/lib/hooks/useCobra'
import { useAuth } from '@/components/providers/AuthProvider'
import { KPICard, ProfilePill, StatusBadge, WeeklyDots, Avatar, Skeleton, EmptyState } from '@/components/ui/KPICard'
import { ProgressBar } from '@/components/ui/KPICard'
import { CobraNivelBadge } from '@/components/cobra/CobraRadar'
import { cn } from '@/lib/utils/cn'
import type { TeamDashboardRow } from '@/lib/supabase/types'

export default function EquipePage() {
  const { data: teamData, isLoading } = useTeamDashboard()
  const [filter, setFilter] = useState<'todos' | 'critico' | 'atencao'>('todos')

  const filtered = teamData?.filter(m => {
    if (filter === 'critico') return m.status_mci === 'critico'
    if (filter === 'atencao') return m.status_mci === 'atencao'
    return true
  }) ?? []

  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-ink-primary">Minha Equipe</h2>
          <p className="text-xs text-ink-secondary mt-0.5">{teamData?.length ?? 0} consultores ativos</p>
        </div>
        <button className="btn-primary btn"><Plus className="w-3.5 h-3.5" aria-hidden />Novo membro</button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'critico', label: '🔴 Crítico' },
          { id: 'atencao', label: '⚠️ Atenção' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={cn('btn', filter === f.id ? 'btn-primary' : 'btn-ghost')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Consultor</th>
              <th>Perfil</th>
              <th className="text-right">MCI %</th>
              <th className="text-right">D2 %</th>
              <th className="text-right">COBRA</th>
              <th>Placar</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7}><Skeleton className="h-8 m-1" /></td></tr>
              ))
            ) : filtered.map(m => (
              <MemberRow key={m.consultor_id} member={m} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MemberRow({ member }: { member: TeamDashboardRow }) {
  const color = member.pct_mci >= 80 ? '#00875A' : member.pct_mci >= 50 ? '#FF991F' : '#DE350B'
  return (
    <tr>
      <td>
        <div className="flex items-center gap-2">
          <Avatar nome={member.consultor_nome} size="sm" />
          <span className="font-medium">{member.consultor_nome}</span>
        </div>
      </td>
      <td>{member.perfil && <ProfilePill perfil={member.perfil} />}</td>
      <td className="text-right font-medium" style={{ color }}>{member.pct_mci}%</td>
      <td className="text-right">{member.pct_d4}%</td>
      <td className="text-right">{member.cobra_total ? `${member.cobra_total}/25` : '—'}</td>
      <td>
        <WeeklyDots weeks={['verde', 'vermelho', 'pendente', 'pendente']} count={4} />
      </td>
      <td>
        <StatusBadge status={member.status_mci === 'atingido' || member.status_mci === 'no_caminho' ? 'ok' : member.status_mci === 'atencao' ? 'warning' : 'danger'}>
          {member.status_mci === 'atingido' ? 'Atingido' :
           member.status_mci === 'no_caminho' ? 'No caminho' :
           member.status_mci === 'atencao' ? 'Atenção' :
           member.status_mci === 'critico' ? 'Crítico' : '—'}
        </StatusBadge>
      </td>
    </tr>
  )
}
