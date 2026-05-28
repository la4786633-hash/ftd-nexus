'use client'

export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Kanban, School, BarChart3, Activity, Plus, Download, Filter } from 'lucide-react'
import { KanbanBoard } from '@/components/cobra/KanbanBoard'
import { CobraRadar, CobraCriteriaBar, CobraNivelBadge } from '@/components/cobra/CobraRadar'
import { useEscolas, useAtividades, useCobraAvaliacoes, usePipelineFunnel } from '@/lib/hooks/useCobra'
import { useAuth } from '@/components/providers/AuthProvider'
import { KPICard, ProgressBar, ProfilePill, StatusBadge, Avatar, Skeleton, EmptyState } from '@/components/ui/KPICard'
import { formatCurrency, formatDate, formatDateRelative } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import { useState } from 'react'

type Tab = 'pipeline' | 'escolas' | 'avaliacoes' | 'atividades'

const TABS: { id: Tab; label: string; icon: typeof Kanban }[] = [
  { id: 'pipeline', label: 'Pipeline Kanban', icon: Kanban },
  { id: 'escolas', label: 'Escolas / CRM', icon: School },
  { id: 'avaliacoes', label: 'Avaliação COBRA', icon: BarChart3 },
  { id: 'atividades', label: 'Atividades', icon: Activity },
]

export default function CobraPage() {
  const searchParams = useSearchParams()
  const tab = (searchParams.get('tab') as Tab) ?? 'pipeline'

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-white border-b border-surface-border sticky top-[52px] z-20">
        <div className="flex overflow-x-auto scrollbar-hide px-4">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <Link
                key={t.id}
                href={`/cobra?tab=${t.id}`}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-3 text-xs border-b-2 whitespace-nowrap transition-colors',
                  tab === t.id ? 'border-brand-blue text-ink-primary font-medium' : 'border-transparent text-ink-secondary hover:text-ink-primary'
                )}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden />
                {t.label}
              </Link>
            )
          })}
        </div>
      </div>

      {tab === 'pipeline' && <PipelineTab />}
      {tab === 'escolas' && <div className="page-content"><EscolasTab /></div>}
      {tab === 'avaliacoes' && <div className="page-content"><AvaliacoesTab /></div>}
      {tab === 'atividades' && <div className="page-content"><AtividadesTab /></div>}
    </div>
  )
}

// ============================================================
// PIPELINE (Kanban)
// ============================================================

function PipelineTab() {
  const { data: funnel } = usePipelineFunnel()

  const totalOpps = funnel?.reduce((a, f) => a + f.total_opps, 0) ?? 0
  const totalValor = funnel?.reduce((a, f) => a + f.valor_total, 0) ?? 0

  return (
    <div className="flex flex-col flex-1">
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-4 pt-4">
        {funnel?.map(f => (
          <div key={f.etapa_id} className="card-sm text-center border-t-2" style={{ borderTopColor: f.cor_hex }}>
            <p className="text-base font-medium text-ink-primary">{f.total_opps}</p>
            <p className="text-[9px] text-ink-secondary truncate">{f.etapa_nome}</p>
            {f.valor_total > 0 && (
              <p className="text-[9px] font-medium" style={{ color: f.cor_hex }}>{formatCurrency(f.valor_total, true)}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-xs text-ink-secondary">
          {totalOpps} oportunidades ativas · {formatCurrency(totalValor, true)} em pipeline
        </p>
        <div className="flex gap-2">
          <button className="btn-ghost btn"><Filter className="w-3 h-3" aria-hidden />Filtrar</button>
          <button className="btn-primary btn"><Plus className="w-3 h-3" aria-hidden />Nova opp.</button>
        </div>
      </div>

      <KanbanBoard />
    </div>
  )
}

// ============================================================
// ESCOLAS / CRM
// ============================================================

function EscolasTab() {
  const [search, setSearch] = useState('')
  const { data: escolas, isLoading } = useEscolas(search)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-ink-primary">Base de escolas</h2>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Buscar escola..."
            className="form-input w-48"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn-primary btn"><Plus className="w-3 h-3" aria-hidden />Nova escola</button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : !escolas?.length ? (
        <EmptyState icon={<School className="w-6 h-6" aria-hidden />} title="Nenhuma escola encontrada" description="Cadastre uma escola para iniciar o relacionamento." action={<button className="btn-primary btn"><Plus className="w-3.5 h-3.5" aria-hidden />Cadastrar escola</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {escolas.map(escola => (
            <div key={escola.id} className="card card-hover">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-brand-blue-light flex items-center justify-center text-[10px] font-medium text-brand-blue flex-shrink-0">
                  {escola.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink-primary truncate">{escola.nome}</p>
                  <p className="text-[10px] text-ink-secondary">{[escola.cidade, escola.uf].filter(Boolean).join(' · ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {escola.segmento && <span className="badge badge-info capitalize">{escola.segmento}</span>}
                {escola.porte && <span className="badge badge-neutral capitalize">{escola.porte}</span>}
                {escola.ultima_visita && (
                  <span className="text-[9px] text-ink-tertiary ml-auto">Última visita: {formatDate(escola.ultima_visita)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// AVALIACOES COBRA
// ============================================================

function AvaliacoesTab() {
  const { profile } = useAuth()
  const { data: avaliacoes, isLoading } = useCobraAvaliacoes()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-ink-primary">Avaliações COBRA</h2>
        <button className="btn-primary btn"><Plus className="w-3 h-3" aria-hidden />Nova avaliação</button>
      </div>
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !avaliacoes?.length ? (
        <EmptyState icon={<BarChart3 className="w-6 h-6" aria-hidden />} title="Nenhuma avaliação realizada" description="Realize a avaliação COBRA mensal dos consultores." />
      ) : (
        <div className="flex flex-col gap-4">
          {avaliacoes.map(aval => (
            <div key={aval.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Avatar nome={aval.consultor_nome} size="sm" />
                  <div>
                    <p className="text-xs font-medium text-ink-primary">{aval.consultor_nome}</p>
                    <p className="text-[10px] text-ink-secondary">{aval.mes_ref}/{aval.ano_ref}</p>
                  </div>
                </div>
                <CobraNivelBadge nivel={aval.nivel} pontos={aval.total_pontos} />
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex-1 flex flex-col gap-1.5">
                  {aval.notas?.map((nota: any) => (
                    <CobraCriteriaBar key={nota.criterio_id} label={nota.criterio?.nome ?? '—'} value={nota.nota} max={5} />
                  ))}
                </div>
                {aval.notas?.length >= 5 && (
                  <CobraRadar
                    notas={aval.notas.map((n: any) => ({ label: n.criterio?.nome, value: n.nota, max: 5 }))}
                    size={90}
                  />
                )}
              </div>
              {aval.lead_sugerido && (
                <div className="mt-3 px-3 py-2 bg-brand-blue-light rounded text-[10px] text-brand-blue">
                  💡 Lead sugerido: {aval.lead_sugerido}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// ATIVIDADES
// ============================================================

function AtividadesTab() {
  const { data: atividades, isLoading } = useAtividades()

  const TIPO_ICONS: Record<string, string> = {
    visita: '🏫', ligacao: '📞', email: '📧',
    reuniao: '👥', proposta: '📝', whatsapp: '💬', outros: '🔹'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-ink-primary">Atividades comerciais</h2>
        <button className="btn-primary btn"><Plus className="w-3 h-3" aria-hidden />Nova atividade</button>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : (
        <div className="card p-0">
          {atividades?.map(atv => (
            <div key={atv.id} className="flex items-center gap-3 px-4 py-3 border-b border-surface-border last:border-b-0 hover:bg-surface-secondary/50 transition-colors">
              <span className="text-lg flex-shrink-0" aria-hidden>{TIPO_ICONS[atv.tipo] ?? '🔹'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink-primary truncate">{atv.titulo}</p>
                <p className="text-[10px] text-ink-secondary">{atv.usuario?.nome} · {formatDateRelative(atv.data_atividade)}</p>
              </div>
              <StatusBadge status={atv.status === 'realizada' ? 'ok' : atv.status === 'cancelada' ? 'danger' : 'neutral'}>
                {atv.status === 'realizada' ? 'Realizada' : atv.status === 'cancelada' ? 'Cancelada' : 'Pendente'}
              </StatusBadge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
