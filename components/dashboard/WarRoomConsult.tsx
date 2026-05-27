// ============================================================
// FTD NEXUS — War Room Consultor
// Personal performance view for individual consultants
// ============================================================

'use client'

import { CheckCircle2, XCircle, Clock, Target, TrendingUp, Heart, Calendar } from 'lucide-react'
import { useActiveWIG, useLeadMeasures, useUpcomingCadencia, useTeamScoreboard } from '@/lib/hooks/use4dx'
import { useLatestCobraAvaliacao } from '@/lib/hooks/useCobra'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  KPICard, ProgressBar, WeeklyDots, ProfilePill, StatusBadge, Skeleton, EmptyState
} from '@/components/ui/KPICard'
import { CobraRadar, CobraNivelBadge } from '@/components/cobra/CobraRadar'
import { cn } from '@/lib/utils/cn'
import { formatDate, getDaysRemaining } from '@/lib/utils/formatters'
import { getMCIStatusColor, getCriterioPorPerfil, calcCobraNivel } from '@/lib/utils/calculations'
import type { PerfilConsultor } from '@/lib/supabase/types'

export function WarRoomConsult() {
  const { profile } = useAuth()
  const { data: wig, isLoading: wigLoading } = useActiveWIG()
  const { data: leads, isLoading: leadsLoading } = useLeadMeasures(wig?.id)
  const { data: cadencia } = useUpcomingCadencia()
  const { data: scoreboard } = useTeamScoreboard()
  const { data: avaliacao } = useLatestCobraAvaliacao(profile?.id)

  const myScoreboard = scoreboard?.filter(s => s.consultor_id === profile?.id) ?? []
  const myWeeks = myScoreboard
    .sort((a, b) => a.semana_num - b.semana_num)
    .slice(-4)
    .map(s => s.status)

  const hasAlerta = myWeeks.slice(-2).length === 2 && myWeeks.slice(-2).every(w => w === 'vermelho')

  const daysLeft = wig ? getDaysRemaining(wig.data_fim) : 0
  const mciColor = wig ? getMCIStatusColor(wig.pct_mci ?? 0) : '#B3BAC5'

  const criterios = getCriterioPorPerfil(profile?.perfil as PerfilConsultor)
  const cobraNotas = avaliacao?.notas?.map(n => ({
    label: n.criterio_nome,
    value: n.nota,
  })) ?? criterios.map(c => ({ label: c, value: 0 }))

  const cobraTotal = avaliacao?.total_notas ?? 0

  return (
    <div className="flex flex-col gap-4">
      {/* Personal greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-md font-medium text-ink-primary">
            Olá, {profile?.nome?.split(' ')[0]} 👋
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            {profile?.perfil && <ProfilePill perfil={profile.perfil as PerfilConsultor} />}
            {profile?.cargo && <span className="ml-2">{profile.cargo}</span>}
          </p>
        </div>
        {hasAlerta && (
          <div className="px-3 py-1.5 bg-status-danger-bg border border-status-danger/20 rounded-lg">
            <p className="text-xs font-medium text-status-danger-text">
              ⚠️ 2 semanas seguidas 🔴 — atenção!
            </p>
          </div>
        )}
      </div>

      {/* MCI Hero + Lead Measures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MCI Hero */}
        <div className="card">
          <div className="flex items-center gap-4">
            {/* Ring */}
            <div className="relative flex-shrink-0">
              <svg width="88" height="88" viewBox="0 0 88 88" aria-label={`MCI: ${wig?.pct_mci ?? 0}%`}>
                <circle cx="44" cy="44" r="36" fill="none" stroke="#F4F5F7" strokeWidth="8" />
                <circle
                  cx="44" cy="44" r="36"
                  fill="none"
                  stroke={mciColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - Math.min((wig?.pct_mci ?? 0) / 100, 1))}`}
                  transform="rotate(-90 44 44)"
                />
                <text
                  x="44" y="40"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-mono font-medium"
                  style={{ fontSize: 16, fill: mciColor, fontFamily: 'var(--font-mono)' }}
                >
                  {wig?.pct_mci ?? 0}%
                </text>
                <text
                  x="44" y="56"
                  textAnchor="middle"
                  style={{ fontSize: 9, fill: '#B3BAC5' }}
                >
                  MCI
                </text>
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              {wigLoading ? (
                <Skeleton className="h-16" />
              ) : wig ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={
                      (wig.pct_mci ?? 0) >= 100 ? 'ok' :
                      (wig.pct_mci ?? 0) >= 80 ? 'ok' :
                      (wig.pct_mci ?? 0) >= 50 ? 'warning' : 'danger'
                    }>
                      {(wig.pct_mci ?? 0) >= 100 ? '🏆 Atingido!' :
                       (wig.pct_mci ?? 0) >= 80 ? 'No caminho' :
                       (wig.pct_mci ?? 0) >= 50 ? 'Atenção' : 'Crítico'}
                    </StatusBadge>
                  </div>
                  <p className="text-[10px] text-ink-secondary italic mb-3 line-clamp-2">
                    "{wig.titulo}"
                  </p>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    <div className="text-center">
                      <p className="text-sm font-medium text-ink-primary">{wig.realizado}</p>
                      <p className="text-[9px] text-ink-tertiary">Realiz.</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-ink-primary">{wig.meta_para}</p>
                      <p className="text-[9px] text-ink-tertiary">Meta</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium" style={{ color: daysLeft < 10 ? '#DE350B' : daysLeft < 20 ? '#FF991F' : '#172B4D' }}>
                        {daysLeft}d
                      </p>
                      <p className="text-[9px] text-ink-tertiary">Prazo</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-ink-tertiary">
                    Prazo: {formatDate(wig.data_fim)} · {wig.unidade}
                  </p>
                </>
              ) : (
                <EmptyState
                  icon={<Target className="w-4 h-4" aria-hidden />}
                  title="Sem WIG ativa"
                  description="Aguarde seu coordenador criar uma meta."
                />
              )}
            </div>
          </div>
        </div>

        {/* Lead Measures */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-ink-primary">
              <TrendingUp className="w-3.5 h-3.5 inline mr-1 text-ink-tertiary" aria-hidden />
              D2 — Medidas de direção
            </h3>
          </div>
          {leadsLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : !leads?.length ? (
            <p className="text-xs text-ink-secondary text-center py-4">
              Nenhuma medida de direção cadastrada
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {leads.slice(0, 3).map(lead => {
                const pct = lead.pct_semana ?? 0
                const color = pct >= 100 ? '#00875A' : pct >= 75 ? '#FF991F' : '#DE350B'
                return (
                  <div key={lead.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-medium text-ink-primary truncate mr-2">
                        {lead.titulo}
                      </p>
                      <span className="text-xs font-medium flex-shrink-0" style={{ color }}>
                        {lead.realizado_semana ?? 0}/{lead.meta_periodo}
                      </span>
                    </div>
                    <ProgressBar value={pct} max={100} color={color} />
                    <p className="text-[9px] text-ink-tertiary mt-1">
                      Meta: {lead.meta_periodo} / {lead.frequencia}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Scoreboard + COBRA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* D3 Placar */}
        <div className="card">
          <h3 className="text-xs font-medium text-ink-primary mb-3">
            D3 — Meu placar (4 semanas)
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <WeeklyDots weeks={myWeeks} count={4} />
            <StatusBadge status={
              hasAlerta ? 'danger' :
              myWeeks.at(-1) === 'verde' ? 'ok' :
              myWeeks.at(-1) === 'vermelho' ? 'danger' : 'neutral'
            }>
              {hasAlerta ? '⚠️ Alerta' :
               myWeeks.at(-1) === 'verde' ? '🟢 Verde' :
               myWeeks.at(-1) === 'vermelho' ? '🔴 Vermelho' : 'Pendente'}
            </StatusBadge>
          </div>
          <p className="text-[10px] text-ink-secondary">
            ● Verde = D2 ≥ 100% · ● Vermelho = D2 &lt; 100%
          </p>

          {/* Upcoming cadência */}
          {cadencia && (
            <div className="mt-3 p-2.5 bg-surface-secondary rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-brand-blue flex-shrink-0" aria-hidden />
                <div>
                  <p className="text-[10px] font-medium text-ink-primary">
                    Próxima cadência: {formatDate(cadencia.data_sessao)}
                  </p>
                  <p className="text-[9px] text-ink-secondary">
                    {cadencia.titulo} · {cadencia.duracao_minutos}min
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COBRA */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-ink-primary">
              <Heart className="w-3.5 h-3.5 inline mr-1 text-brand-coral" aria-hidden />
              Meu COBRA
            </h3>
            {cobraTotal > 0 && (
              <CobraNivelBadge total={cobraTotal} />
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              {cobraNotas.map(nota => {
                const pct = (nota.value / 5) * 100
                const color = nota.value >= 4 ? '#00875A' : nota.value >= 3 ? '#FF991F' : '#DE350B'
                return (
                  <div key={nota.label} className="flex items-center gap-2">
                    <span className="text-[9px] text-ink-secondary w-16 flex-shrink-0 truncate">{nota.label}</span>
                    <div className="progress-bar flex-1">
                      <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-[9px] font-medium text-ink-primary w-5 text-right flex-shrink-0">
                      {nota.value}
                    </span>
                  </div>
                )
              })}
            </div>
            {cobraNotas.length > 0 && (
              <CobraRadar
                notas={cobraNotas}
                size={80}
                showLabels={false}
                className="flex-shrink-0"
              />
            )}
          </div>
          {cobraTotal === 0 && (
            <p className="text-[10px] text-ink-secondary text-center mt-2">
              Avaliação COBRA pendente — solicite ao coordenador
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
