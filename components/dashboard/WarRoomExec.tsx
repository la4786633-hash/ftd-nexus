'use client'

import { TrendingUp, TrendingDown, Users, Target, CheckCircle2, AlertTriangle, Trophy } from 'lucide-react'
import { useTeamDashboard } from '@/lib/hooks/use4dx'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { KPICard } from '@/components/ui/KPICard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { WeeklyDots } from '@/components/ui/WeeklyDots'
import { ProfilePill } from '@/components/ui/ProfilePill'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/lib/utils/cn'

interface WarRoomExecProps {
  presentationMode?: boolean
}

const MOCK_TEAMS = [
  { nome: 'Adenisia', mci: 45, consultores: 6, perfis: 'Híbr. + Farm.', trend: 2 },
  { nome: 'Luciano', mci: 49, consultores: 5, perfis: 'Farmers', trend: -3 },
  { nome: 'Marina', mci: 67, consultores: 5, perfis: 'Hunters', trend: 5 },
  { nome: 'Mileide', mci: 78, consultores: 3, perfis: 'Inside Sales', trend: 8 },
]

export function WarRoomExec({ presentationMode }: WarRoomExecProps) {
  const { data: teamData, isLoading } = useTeamDashboard()
  const { notifications } = useNotifications()

  const mciMedia = teamData?.length
    ? Math.round(teamData.reduce((acc, t) => acc + (t.pct_mci ?? 0), 0) / teamData.length)
    : 57

  const cadenciasOk = 4
  const cobraMedia = 17

  const alerts = notifications?.filter(n => !n.lida).slice(0, 4) ?? []

  return (
    <div className="flex flex-col gap-4">
      {/* Regional header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-md font-medium text-ink-primary">Regional Centro-Norte</h2>
          <p className="text-xs text-ink-secondary">Semana 1 · Janeiro 2027 · 4 times · 20 consultores</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-secondary">
          <span className="w-2 h-2 rounded-full bg-status-ok animate-pulse" aria-hidden />
          Tempo real
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          label="MCI Regional"
          value={`${mciMedia}%`}
          trend="⚠️ Abaixo do esperado"
          trendType="warning"
          color="warning"
          icon={<Target className="w-4 h-4" aria-hidden />}
        />
        <KPICard
          label="D2 Lead Médio"
          value="77%"
          trend="↑ 4% vs. semana ant."
          trendType="ok"
          color="warning"
          icon={<TrendingUp className="w-4 h-4" aria-hidden />}
        />
        <KPICard
          label="D4 Cadências"
          value={`${cadenciasOk}/4`}
          trend="100% realizadas"
          trendType="ok"
          color="ok"
          icon={<CheckCircle2 className="w-4 h-4" aria-hidden />}
        />
        <KPICard
          label="COBRA Médio"
          value={`${cobraMedia}/25`}
          trend="4 times avaliados"
          trendType="neutral"
          color="info"
          icon={<Users className="w-4 h-4" aria-hidden />}
        />
      </div>

      {/* Teams + Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Teams comparison */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium text-ink-primary">Times — MCI comparativo</h3>
            <span className="text-[10px] text-ink-secondary">Sem. 1 · Jan/27</span>
          </div>
          <div className="flex flex-col gap-4">
            {MOCK_TEAMS.map(team => {
              const statusColor = team.mci >= 80 ? 'ok' : team.mci >= 60 ? 'warning' : 'danger'
              return (
                <div key={team.nome}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium text-white flex-shrink-0"
                        style={{ background: team.mci >= 80 ? '#00875A' : team.mci >= 60 ? '#FF991F' : '#DE350B' }}
                        aria-hidden
                      >
                        {team.nome.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-medium text-ink-primary">{team.nome}</span>
                        <span className="text-[10px] text-ink-tertiary ml-1.5">{team.consultores} · {team.perfis}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {team.trend > 0 ? (
                        <TrendingUp className="w-3 h-3 text-status-ok" aria-hidden />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-status-danger" aria-hidden />
                      )}
                      <span
                        className={cn(
                          'text-xs font-medium',
                          statusColor === 'ok' ? 'text-status-ok' : statusColor === 'warning' ? 'text-status-warning' : 'text-status-danger'
                        )}
                      >
                        {team.mci}%
                      </span>
                    </div>
                  </div>
                  <ProgressBar
                    value={team.mci}
                    max={100}
                    color={statusColor === 'ok' ? '#00875A' : statusColor === 'warning' ? '#FF991F' : '#DE350B'}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium text-ink-primary">Alertas regionais</h3>
            {alerts.length > 0 && (
              <span className="badge badge-danger">{alerts.length} críticos</span>
            )}
          </div>
          <div className="flex flex-col divide-y divide-surface-border">
            <AlertItem
              icon={<AlertTriangle className="w-4 h-4 text-status-danger flex-shrink-0" aria-hidden />}
              title="Sinair — 2ª semana 🔴"
              description="Time Luciano · Intervenção recomendada"
              type="danger"
            />
            <AlertItem
              icon={<AlertTriangle className="w-4 h-4 text-status-danger flex-shrink-0" aria-hidden />}
              title="Andre — D2 = 0 realizadas"
              description="Time Luciano · Zero atividade na semana"
              type="danger"
            />
            <AlertItem
              icon={<Target className="w-4 h-4 text-status-warning flex-shrink-0" aria-hidden />}
              title="COBRA liberado — 4 times"
              description="Avaliação mensal · Prazo: 31 Jan"
              type="warning"
            />
            <AlertItem
              icon={<Trophy className="w-4 h-4 text-status-ok flex-shrink-0" aria-hidden />}
              title="Camila (Mileide) — MCI 100%!"
              description="Inside Sales · Meta de renovação batida"
              type="ok"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function AlertItem({
  icon, title, description, type
}: {
  icon: React.ReactNode
  title: string
  description: string
  type: 'danger' | 'warning' | 'ok'
}) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      {icon}
      <div>
        <p
          className={cn(
            'text-xs font-medium',
            type === 'danger' ? 'text-status-danger-text' :
            type === 'warning' ? 'text-status-warning-text' : 'text-status-ok-text'
          )}
        >
          {title}
        </p>
        <p className="text-[10px] text-ink-secondary mt-0.5">{description}</p>
      </div>
    </div>
  )
}
