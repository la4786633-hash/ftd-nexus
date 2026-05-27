'use client'

import { useTeamDashboard, useTeamScoreboard, useUpcomingCadencia } from '@/lib/hooks/use4dx'
import { useLatestCobraAvaliacao } from '@/lib/hooks/useCobra'
import { useAuth } from '@/components/providers/AuthProvider'
import { KPICard } from '@/components/ui/KPICard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { WeeklyDots } from '@/components/ui/WeeklyDots'
import { ProfilePill } from '@/components/ui/ProfilePill'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CobraRadar } from '@/components/cobra/CobraRadar'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils/cn'
import { Target, TrendingUp, CheckCircle2, Users, AlertTriangle, Clock, Check, X } from 'lucide-react'
import type { TeamDashboardRow } from '@/lib/supabase/types'

// ============================================================
// COORDINATOR VIEW
// ============================================================

export function WarRoomCoord() {
  const { data: teamData, isLoading } = useTeamDashboard()
  const { data: scoreboardData } = useTeamScoreboard()
  const { data: proxCadencia } = useUpcomingCadencia()

  const mciMedia = teamData?.length
    ? Math.round(teamData.reduce((acc, t) => acc + (t.pct_mci ?? 0), 0) / teamData.length)
    : 0

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          label="D1 MCI Médio"
          value={`${mciMedia}%`}
          trend={mciMedia >= 80 ? '✅ No caminho' : '↓ Precisa ação'}
          trendType={mciMedia >= 80 ? 'ok' : mciMedia >= 50 ? 'warning' : 'danger'}
          color={mciMedia >= 80 ? 'ok' : mciMedia >= 50 ? 'warning' : 'danger'}
          icon={<Target className="w-4 h-4" aria-hidden />}
        />
        <KPICard
          label="D2 Leads"
          value="73%"
          trend="3 de 5 no verde"
          trendType="warning"
          color="warning"
          icon={<TrendingUp className="w-4 h-4" aria-hidden />}
        />
        <KPICard
          label="D4 Cadência"
          value="100%"
          trend={proxCadencia ? `Próx: ${format(parseISO(proxCadencia.data_sessao), 'EEE dd/MM', { locale: ptBR })}` : 'Nenhuma agendada'}
          trendType="ok"
          color="ok"
          icon={<CheckCircle2 className="w-4 h-4" aria-hidden />}
        />
        <KPICard
          label="COBRA"
          value="16/25"
          trend="Bom, ajustar"
          trendType="neutral"
          color="info"
          icon={<Users className="w-4 h-4" aria-hidden />}
        />
      </div>

      {/* Team MCI + Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium text-ink-primary">D1 MCI — Time</h3>
            <span className="text-[10px] text-ink-secondary">Sem. 1</span>
          </div>
          <div className="flex flex-col gap-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-surface-page animate-pulse rounded" />
              ))
            ) : (
              teamData?.map(member => (
                <MemberMCIRow key={member.consultor_id} member={member} />
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium text-ink-primary">Placar D3 — 4 semanas</h3>
            <span className="text-[10px] text-ink-secondary">● Verde ● Vermelho ● Pendente</span>
          </div>
          <ScoreboardGrid teamData={teamData} scoreboardData={scoreboardData} />
        </div>
      </div>

      {/* Upcoming cadence */}
      {proxCadencia && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-ink-primary">D4 Próxima cadência</h3>
            <span className="badge badge-ok">Confirmada</span>
          </div>
          <div className="flex gap-4 items-start">
            <div className="text-center px-4 py-3 bg-surface-secondary rounded-lg flex-shrink-0">
              <p className="text-sm font-medium text-ink-primary">
                {format(parseISO(proxCadencia.data_sessao), 'EEE', { locale: ptBR }).replace('.', '')}
              </p>
              <p className="text-base font-medium text-brand-blue">
                {format(parseISO(proxCadencia.data_sessao), 'dd MMM', { locale: ptBR })}
              </p>
              <p className="text-[10px] text-ink-secondary">
                {format(parseISO(proxCadencia.data_sessao), 'HH:mm')}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-ink-secondary mb-3">
                3 passos: (1) Cumpriu? → (2) Revisar placar → (3) Novo compromisso
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {proxCadencia.compromissos?.map(comp => (
                  <CompromissoItem key={comp.id} compromisso={comp} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MemberMCIRow({ member }: { member: TeamDashboardRow }) {
  const color = member.pct_mci >= 80 ? '#00875A' : member.pct_mci >= 50 ? '#FF991F' : '#DE350B'
  const ttype = member.pct_mci >= 80 ? 'ok' : member.pct_mci >= 50 ? 'warning' : 'danger'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-ink-primary">{member.consultor_nome}</span>
          {member.perfil && <ProfilePill perfil={member.perfil} />}
        </div>
        <StatusBadge status={ttype as 'ok' | 'warning' | 'danger'}>
          {member.pct_mci}%
        </StatusBadge>
      </div>
      <ProgressBar value={member.pct_mci} max={100} color={color} />
    </div>
  )
}

function ScoreboardGrid({ teamData, scoreboardData }: { teamData?: TeamDashboardRow[]; scoreboardData?: any[] }) {
  return (
    <div className="flex flex-col divide-y divide-surface-border">
      {teamData?.map(member => {
        const memberScores = scoreboardData
          ?.filter(s => s.consultor_id === member.consultor_id)
          .sort((a, b) => a.semana_num - b.semana_num)
          .slice(-4) ?? []

        const hasAlert = memberScores.filter(s => s.status === 'vermelho').length >= 2
        return (
          <div key={member.consultor_id} className="flex items-center justify-between py-2">
            <span className="text-xs font-medium text-ink-primary flex-1">{member.consultor_nome}</span>
            <WeeklyDots weeks={memberScores.map(s => s.status)} count={4} />
            <div className="ml-3">
              {hasAlert ? (
                <span className="badge badge-danger">⚠️ Alerta</span>
              ) : member.status_mci === 'no_caminho' ? (
                <span className="badge badge-warning">Atenção</span>
              ) : member.status_mci === 'critico' ? (
                <span className="badge badge-danger">Crítico</span>
              ) : (
                <span className="badge badge-ok">OK</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CompromissoItem({ compromisso }: { compromisso: any }) {
  const isOk = compromisso.status === 'cumprido'
  const isNot = compromisso.status === 'nao_cumprido'

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px]',
        isOk ? 'bg-status-ok-bg text-status-ok-text' :
        isNot ? 'bg-status-danger-bg text-status-danger-text' :
        'bg-status-warning-bg text-status-warning-text'
      )}
    >
      {isOk ? <Check className="w-3 h-3 flex-shrink-0" aria-hidden /> :
       isNot ? <X className="w-3 h-3 flex-shrink-0" aria-hidden /> :
       <Clock className="w-3 h-3 flex-shrink-0" aria-hidden />}
      <span className="truncate">{compromisso.consultor?.nome} — {
        isOk ? 'Cumpriu' : isNot ? 'Não cumpriu' : 'Parcial'
      }</span>
    </div>
  )
}

// ============================================================
// CONSULTANT VIEW
// ============================================================

export function WarRoomConsult() {
  const { profile } = useAuth()
  const { data: avaliacao } = useLatestCobraAvaliacao()

  return (
    <div className="flex flex-col gap-4">
      {/* MCI Ring + Lead Measures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MCI */}
        <div className="card flex items-center gap-4">
          <MCIRing pct={40} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-primary">{profile?.nome}</p>
            <p className="text-xs text-ink-secondary mt-0.5">15 escolas · Prazo: 30 Jan</p>
            <div className="mt-3">
              <p className="text-[10px] text-ink-secondary mb-1.5">6 de 15 realizadas</p>
              <ProgressBar value={6} max={15} color="#DE350B" />
            </div>
            <div className="mt-2.5 text-[10px] px-2.5 py-1.5 bg-status-danger-bg rounded text-status-danger-text flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" aria-hidden />
              Prazo: 25 dias restantes
            </div>
          </div>
        </div>

        {/* D2 Lead Measures */}
        <div className="card">
          <h3 className="text-xs font-medium text-ink-primary mb-3">D2 Minhas medidas de direção</h3>
          <div className="flex flex-col gap-3 mb-4">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-ink-primary">Visitas de relacionamento</span>
                <span className="text-xs font-medium text-status-danger">2/6</span>
              </div>
              <ProgressBar value={2} max={6} color="#DE350B" />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-ink-primary">Prospecções novas</span>
                <span className="text-xs font-medium text-status-danger">1/3</span>
              </div>
              <ProgressBar value={1} max={3} color="#DE350B" />
            </div>
          </div>
          <div className="bg-surface-secondary rounded-md p-3">
            <p className="text-[10px] font-medium text-ink-primary mb-1">Compromisso desta semana</p>
            <p className="text-[10px] text-ink-secondary leading-relaxed">
              "Visitar E. São Francisco e fechar proposta de renovação até quinta."
            </p>
            <p className="text-[9px] text-ink-tertiary mt-1.5">
              Cadência: Sex 17h · Luciano conduz
            </p>
          </div>
        </div>
      </div>

      {/* COBRA Score */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-medium text-ink-primary">Meu COBRA — Jan/2027</h3>
          <span className="badge badge-warning">
            {avaliacao?.total_pontos ?? 16}/25 · {avaliacao?.nivel ?? 'Bom, ajustar'}
          </span>
        </div>
        <div className="flex gap-6 items-start">
          <div className="flex-1 flex flex-col gap-2">
            {avaliacao?.notas?.map((nota: any) => (
              <div key={nota.criterio_id} className="flex items-center gap-3">
                <span className="text-[10px] text-ink-secondary w-24 flex-shrink-0">{nota.criterio?.nome}</span>
                <div className="progress-bar flex-1">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(nota.nota / 5) * 100}%`,
                      background: nota.nota >= 4 ? '#00875A' : nota.nota >= 3 ? '#1565C0' : '#DE350B'
                    }}
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium w-6 text-right',
                    nota.nota >= 4 ? 'text-status-ok' : nota.nota >= 3 ? 'text-brand-blue' : 'text-status-danger'
                  )}
                >
                  {nota.nota}/5
                </span>
              </div>
            )) ?? (
              <div className="text-xs text-ink-secondary">Avaliação não realizada este mês.</div>
            )}
          </div>
          {avaliacao?.notas && (
            <CobraRadar
              notas={avaliacao.notas.map((n: any) => ({ label: n.criterio?.nome, value: n.nota, max: 5 }))}
              size={100}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function MCIRing({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#00875A' : pct >= 50 ? '#FF991F' : '#DE350B'
  const bgColor = pct >= 80 ? '#E3FCEF' : pct >= 50 ? '#FFFAE6' : '#FFEBE6'
  const circumference = 2 * Math.PI * 30
  const strokeDashoffset = circumference - (pct / 100) * circumference

  return (
    <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center" role="img" aria-label={`MCI ${pct}%`}>
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 72 72" aria-hidden>
        <circle cx="36" cy="36" r="30" fill="none" stroke={bgColor} strokeWidth="6" />
        <circle
          cx="36" cy="36" r="30" fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-lg font-medium leading-none" style={{ color }}>{pct}%</p>
        <p className="text-[9px] text-ink-tertiary mt-0.5">MCI</p>
      </div>
    </div>
  )
}
