'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Target, TrendingUp, BarChart3, Users, Plus, Download } from 'lucide-react'
import { useWIGs, useLeadMeasures, useTeamScoreboard, useCadencias, useUpcomingCadencia } from '@/lib/hooks/use4dx'
import { useAuth } from '@/components/providers/AuthProvider'
import { KPICard, ProgressBar, WeeklyDots, ProfilePill, StatusBadge, Skeleton, EmptyState } from '@/components/ui/KPICard'
import { cn } from '@/lib/utils/cn'
import { formatDate, getDaysRemaining, formatCurrency } from '@/lib/utils/formatters'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Tab = 'wigs' | 'leads' | 'scoreboard' | 'cadencias'

const TABS: { id: Tab; label: string; icon: typeof Target }[] = [
  { id: 'wigs', label: 'D1 — WIGs / MCIs', icon: Target },
  { id: 'leads', label: 'D2 — Lead Measures', icon: TrendingUp },
  { id: 'scoreboard', label: 'D3 — Placar', icon: BarChart3 },
  { id: 'cadencias', label: 'D4 — Cadências', icon: Users },
]

export default function FourDXPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = (searchParams.get('tab') as Tab) ?? 'wigs'

  return (
    <div className="flex flex-col flex-1">
      {/* Tabs */}
      <div className="bg-white border-b border-surface-border sticky top-[52px] z-20">
        <div className="flex overflow-x-auto scrollbar-hide px-4">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <Link
                key={t.id}
                href={`/4dx?tab=${t.id}`}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-3 text-xs border-b-2 whitespace-nowrap transition-colors',
                  tab === t.id
                    ? 'border-brand-blue text-ink-primary font-medium'
                    : 'border-transparent text-ink-secondary hover:text-ink-primary'
                )}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden />
                {t.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="page-content">
        {tab === 'wigs' && <WIGsTab />}
        {tab === 'leads' && <LeadsTab />}
        {tab === 'scoreboard' && <ScoreboardTab />}
        {tab === 'cadencias' && <CadenciasTab />}
      </div>
    </div>
  )
}

// ============================================================
// WIGs TAB
// ============================================================

function WIGsTab() {
  const { data: wigs, isLoading } = useWIGs()
  const { profile } = useAuth()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    )
  }

  if (!wigs?.length) {
    return (
      <EmptyState
        icon={<Target className="w-6 h-6" aria-hidden />}
        title="Nenhuma WIG cadastrada"
        description="Crie a Meta Crucialmente Importante do seu time para começar."
        action={
          <button className="btn-primary btn">
            <Plus className="w-3.5 h-3.5" aria-hidden /> Criar WIG
          </button>
        }
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-medium text-ink-primary">Metas Crucialmente Importantes</h2>
          <p className="text-xs text-ink-secondary mt-0.5">Uma MCI por consultor — foco total no que mais importa</p>
        </div>
        <button className="btn-primary btn">
          <Plus className="w-3.5 h-3.5" aria-hidden /> Nova WIG
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wigs.map(wig => <WIGCard key={wig.id} wig={wig} />)}
      </div>
    </div>
  )
}

function WIGCard({ wig }: { wig: any }) {
  const daysLeft = getDaysRemaining(wig.data_fim)
  const color = wig.pct_mci >= 80 ? '#00875A' : wig.pct_mci >= 50 ? '#FF991F' : '#DE350B'
  const statusType = wig.pct_mci >= 80 ? 'ok' : wig.pct_mci >= 50 ? 'warning' : 'danger'

  return (
    <div className={cn('card border-t-2')} style={{ borderTopColor: color }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div>
            <p className="text-xs font-medium text-ink-primary">{wig.consultor?.nome ?? 'Time'}</p>
            {wig.consultor?.perfil && <ProfilePill perfil={wig.consultor.perfil} />}
          </div>
        </div>
        <StatusBadge status={statusType as any}>
          {wig.pct_mci >= 80 ? 'No caminho' : wig.pct_mci >= 50 ? 'Atenção' : 'Crítico'}
        </StatusBadge>
      </div>

      <p className="text-[10px] text-ink-secondary mb-3 italic">"{wig.titulo}"</p>

      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center">
          <p className="text-lg font-medium" style={{ color }}>{wig.pct_mci}%</p>
          <p className="text-[9px] text-ink-tertiary">MCI</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-ink-primary">{wig.realizado}</p>
          <p className="text-[9px] text-ink-tertiary">Realiz.</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-ink-primary">{wig.meta_para}</p>
          <p className="text-[9px] text-ink-tertiary">Meta</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium" style={{ color: daysLeft < 10 ? '#DE350B' : daysLeft < 20 ? '#FF991F' : '#172B4D' }}>
            {daysLeft}d
          </p>
          <p className="text-[9px] text-ink-tertiary">Prazo</p>
        </div>
      </div>

      <ProgressBar value={wig.pct_mci} max={100} color={color} height="h-2" />

      <div className="mt-2 text-[10px] text-ink-secondary">
        Prazo: {formatDate(wig.data_fim)} · {wig.unidade}
      </div>
    </div>
  )
}

// ============================================================
// LEADS TAB
// ============================================================

function LeadsTab() {
  const { data: wigs } = useWIGs()
  const firstWig = wigs?.[0]
  const { data: leads, isLoading } = useLeadMeasures(firstWig?.id)

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-ink-primary">Medidas de Direção — D2</h2>
        <button className="btn-primary btn"><Plus className="w-3.5 h-3.5" aria-hidden />Nova medida</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leads?.map(lead => <LeadCard key={lead.id} lead={lead} />)}
      </div>
    </div>
  )
}

function LeadCard({ lead }: { lead: any }) {
  const color = lead.pct_semana >= 100 ? '#00875A' : lead.pct_semana >= 75 ? '#FF991F' : '#DE350B'
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-ink-primary">{lead.titulo}</p>
        <span className="text-xs font-medium" style={{ color }}>{lead.pct_semana}%</span>
      </div>
      {lead.consultor?.nome && (
        <p className="text-[10px] text-ink-secondary mb-2">{lead.consultor.nome}</p>
      )}
      <ProgressBar value={lead.pct_semana} max={100} color={color} />
      <p className="text-[10px] text-ink-tertiary mt-1.5">Meta: {lead.meta_periodo} / {lead.frequencia}</p>
    </div>
  )
}

// ============================================================
// SCOREBOARD TAB
// ============================================================

function ScoreboardTab() {
  const { data: scoreboard, isLoading } = useTeamScoreboard()

  if (isLoading) return <Skeleton className="h-64" />

  const grouped = scoreboard?.reduce((acc, s) => {
    if (!acc[s.consultor_id]) acc[s.consultor_id] = { nome: s.consultor_nome, perfil: s.perfil, weeks: [] }
    acc[s.consultor_id].weeks.push(s)
    return acc
  }, {} as Record<string, any>)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-ink-primary">D3 Placar Visual — Scoreboard</h2>
        <p className="text-[10px] text-ink-secondary">● Verde = D2 ≥ 100% · ● Vermelho = D2 &lt; 100%</p>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th className="text-left">Consultor</th>
              <th className="text-left">Perfil</th>
              {[1,2,3,4,5].map(w => <th key={w} className="text-center">Sem.{w}</th>)}
              <th className="text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(grouped ?? {}).map((c: any) => {
              const weeks = c.weeks.sort((a: any, b: any) => a.semana_num - b.semana_num)
              const lastTwo = weeks.slice(-2)
              const hasAlert = lastTwo.length === 2 && lastTwo.every((w: any) => w.status === 'vermelho')
              return (
                <tr key={c.nome}>
                  <td className="font-medium">{c.nome}</td>
                  <td>{c.perfil && <ProfilePill perfil={c.perfil} />}</td>
                  {[1,2,3,4,5].map(i => {
                    const w = weeks.find((s: any) => s.semana_num === i)
                    return (
                      <td key={i} className="text-center">
                        <div className={cn('w-2.5 h-2.5 rounded-full mx-auto', w?.status === 'verde' ? 'bg-status-ok' : w?.status === 'vermelho' ? 'bg-status-danger' : 'bg-surface-border')} />
                      </td>
                    )
                  })}
                  <td>
                    {hasAlert ? <StatusBadge status="danger">⚠️ Alerta</StatusBadge> :
                     weeks.at(-1)?.status === 'verde' ? <StatusBadge status="ok">Verde</StatusBadge> :
                     weeks.at(-1)?.status === 'vermelho' ? <StatusBadge status="danger">Vermelho</StatusBadge> :
                     <StatusBadge status="neutral">Pendente</StatusBadge>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// CADENCIAS TAB
// ============================================================

function CadenciasTab() {
  const { data: cadencias, isLoading } = useCadencias()

  if (isLoading) return <Skeleton className="h-64" />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-ink-primary">D4 Cadências — WIG Sessions</h2>
        <button className="btn-primary btn"><Plus className="w-3.5 h-3.5" aria-hidden />Nova cadência</button>
      </div>
      <div className="flex flex-col gap-3">
        {cadencias?.map(cad => <CadenciaCard key={cad.id} cadencia={cad} />)}
      </div>
    </div>
  )
}

function CadenciaCard({ cadencia }: { cadencia: any }) {
  const isAgendada = cadencia.status === 'agendada'
  const isRealizada = cadencia.status === 'realizada'

  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className="text-center px-3 py-2 bg-surface-secondary rounded-lg flex-shrink-0">
          <p className="text-sm font-medium text-ink-primary">
            {format(parseISO(cadencia.data_sessao), 'EEE', { locale: ptBR }).replace('.', '')}
          </p>
          <p className="text-sm font-medium text-brand-blue">
            {format(parseISO(cadencia.data_sessao), 'dd/MM', { locale: ptBR })}
          </p>
          <p className="text-[9px] text-ink-secondary">
            {format(parseISO(cadencia.data_sessao), 'HH:mm')}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium text-ink-primary">{cadencia.titulo}</p>
            <StatusBadge status={isRealizada ? 'ok' : isAgendada ? 'info' : 'neutral'}>
              {isRealizada ? 'Realizada' : isAgendada ? 'Agendada' : 'Cancelada'}
            </StatusBadge>
            {cadencia.taxa_cumprimento != null && (
              <span className="text-[10px] text-ink-secondary ml-auto">
                Taxa: {cadencia.taxa_cumprimento}%
              </span>
            )}
          </div>
          <p className="text-[10px] text-ink-tertiary mb-2">
            Facilitador: {cadencia.facilitador?.nome} · {cadencia.duracao_minutos} min
          </p>
          {cadencia.compromissos?.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {cadencia.compromissos.slice(0, 4).map((comp: any) => (
                <div
                  key={comp.id}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded text-[10px]',
                    comp.status === 'cumprido' ? 'bg-status-ok-bg text-status-ok-text' :
                    comp.status === 'nao_cumprido' ? 'bg-status-danger-bg text-status-danger-text' :
                    'bg-status-warning-bg text-status-warning-text'
                  )}
                >
                  <span className="truncate">{comp.consultor?.nome}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
