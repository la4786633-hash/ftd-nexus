'use client'

import { useState, useMemo } from 'react'
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  usePipelineKanban, useCobraEtapas, useMoveOportunidade,
  useCloseOportunidade
} from '@/lib/hooks/useCobra'
import { ProfilePill } from '@/components/ui/KPICard'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/utils/formatters'
import { Plus, GripVertical, School, MapPin, Calendar, MoreHorizontal, Trophy, X } from 'lucide-react'
import type { CobraOportunidadeWithRelations, CobraEtapa } from '@/lib/supabase/types'

// ============================================================
// KANBAN BOARD
// ============================================================

export function KanbanBoard() {
  const { data: etapas = [], isLoading: etapasLoading } = useCobraEtapas()
  const { data: opps = [], isLoading: oppsLoading } = usePipelineKanban()
  const moveOpp = useMoveOportunidade()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const oppsByEtapa = useMemo(() => {
    return etapas.reduce((acc, etapa) => {
      acc[etapa.id] = opps.filter(o => o.etapa_id === etapa.id)
      return acc
    }, {} as Record<string, CobraOportunidadeWithRelations[]>)
  }, [etapas, opps])

  const activeOpp = useMemo(
    () => opps.find(o => o.id === activeId),
    [opps, activeId]
  )

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || active.id === over.id) return

    const oppId = active.id as string
    const targetEtapaId = over.data?.current?.etapaId ?? over.id as string

    // Find current etapa
    const currentOpp = opps.find(o => o.id === oppId)
    if (!currentOpp || currentOpp.etapa_id === targetEtapaId) return

    moveOpp.mutate({ oppId, novaEtapaId: targetEtapaId })
  }

  if (etapasLoading || oppsLoading) {
    return (
      <div className="flex gap-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 min-w-0">
            <div className="h-8 bg-surface-secondary animate-pulse rounded-t-md mb-0.5" />
            <div className="h-48 bg-surface-secondary animate-pulse rounded-b-md" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 p-4 overflow-x-auto pb-6 scrollbar-hide">
        {etapas.map(etapa => (
          <KanbanColumn
            key={etapa.id}
            etapa={etapa}
            opps={oppsByEtapa[etapa.id] ?? []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeOpp && (
          <OpportunityCard opp={activeOpp} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  )
}

// ============================================================
// KANBAN COLUMN
// ============================================================

interface KanbanColumnProps {
  etapa: CobraEtapa
  opps: CobraOportunidadeWithRelations[]
}

function KanbanColumn({ etapa, opps }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: etapa.id,
    data: { etapaId: etapa.id },
  })

  const totalValor = opps.reduce((acc, o) => acc + (o.valor_estimado ?? 0), 0)

  return (
    <div className="kanban-column min-w-[200px] max-w-[220px]">
      {/* Column Header */}
      <div
        className="kanban-header"
        style={{
          backgroundColor: `${etapa.cor_hex}18`,
          color: etapa.cor_hex,
          borderColor: `${etapa.cor_hex}40`,
          border: `1px solid ${etapa.cor_hex}40`,
          borderBottom: 'none',
        }}
      >
        <div className="flex items-center justify-between">
          <span>{etapa.nome}</span>
          <span className="text-[10px] opacity-70 font-normal ml-1">{opps.length}</span>
        </div>
        {totalValor > 0 && (
          <p className="text-[9px] opacity-60 font-normal mt-0.5">{formatCurrency(totalValor)}</p>
        )}
      </div>

      {/* Column Body */}
      <div
        ref={setNodeRef}
        className={cn('kanban-body transition-colors', isOver && 'bg-brand-blue/5 border-brand-blue/20')}
      >
        <SortableContext items={opps.map(o => o.id)} strategy={verticalListSortingStrategy}>
          {opps.map(opp => (
            <SortableCard key={opp.id} opp={opp} etapaId={etapa.id} />
          ))}
        </SortableContext>

        <button
          className="w-full flex items-center gap-1 px-2 py-1.5 text-[10px] text-ink-tertiary hover:text-ink-secondary hover:bg-white/60 rounded transition-colors"
          aria-label={`Adicionar oportunidade em ${etapa.nome}`}
        >
          <Plus className="w-3 h-3" aria-hidden />
          Nova opp.
        </button>
      </div>
    </div>
  )
}

// ============================================================
// SORTABLE CARD (dnd-kit wrapper)
// ============================================================

function SortableCard({ opp, etapaId }: { opp: CobraOportunidadeWithRelations; etapaId: string }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging
  } = useSortable({
    id: opp.id,
    data: { etapaId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <OpportunityCard opp={opp} dragHandleListeners={listeners} />
    </div>
  )
}

// ============================================================
// OPPORTUNITY CARD
// ============================================================

interface OpportunityCardProps {
  opp: CobraOportunidadeWithRelations
  isDragging?: boolean
  dragHandleListeners?: Record<string, any>
}

export function OpportunityCard({ opp, isDragging, dragHandleListeners }: OpportunityCardProps) {
  const closeOpp = useCloseOportunidade()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className={cn(
        'kanban-card group',
        isDragging && 'shadow-dropdown rotate-1',
      )}
      style={{ borderLeftColor: opp.etapa?.cor_hex }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-medium text-ink-primary leading-tight flex-1">
          {opp.escola?.nome ?? opp.titulo}
        </p>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {dragHandleListeners && (
            <button
              {...dragHandleListeners}
              className="p-0.5 text-ink-tertiary hover:text-ink-secondary cursor-grab active:cursor-grabbing"
              aria-label="Arrastar"
            >
              <GripVertical className="w-3 h-3" aria-hidden />
            </button>
          )}
          <div className="relative">
            <button
              className="p-0.5 text-ink-tertiary hover:text-ink-secondary"
              onClick={() => setMenuOpen(p => !p)}
              aria-label="Opções"
            >
              <MoreHorizontal className="w-3 h-3" aria-hidden />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-5 bg-white border border-surface-border rounded-md shadow-dropdown z-10 min-w-[140px] py-1">
                <button
                  className="w-full px-3 py-1.5 text-[10px] text-left text-status-ok-text hover:bg-status-ok-bg flex items-center gap-1.5"
                  onClick={() => { closeOpp.mutate({ id: opp.id, status: 'ganho' }); setMenuOpen(false) }}
                >
                  <Trophy className="w-3 h-3" aria-hidden />
                  Marcar como ganho
                </button>
                <button
                  className="w-full px-3 py-1.5 text-[10px] text-left text-status-danger-text hover:bg-status-danger-bg flex items-center gap-1.5"
                  onClick={() => { closeOpp.mutate({ id: opp.id, status: 'perdido' }); setMenuOpen(false) }}
                >
                  <X className="w-3 h-3" aria-hidden />
                  Marcar como perdido
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-1.5 flex flex-col gap-0.5">
        {opp.escola?.cidade && (
          <div className="flex items-center gap-1 text-[9px] text-ink-tertiary">
            <MapPin className="w-2.5 h-2.5" aria-hidden />
            {opp.escola.cidade}
          </div>
        )}
        <div className="flex items-center gap-1 text-[9px] text-ink-tertiary">
          <School className="w-2.5 h-2.5" aria-hidden />
          {opp.consultor?.nome}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between gap-1">
        {opp.consultor?.perfil && (
          <ProfilePill perfil={opp.consultor.perfil} />
        )}
        {opp.valor_estimado && (
          <span className="text-[9px] font-medium text-ink-primary">
            {formatCurrency(opp.valor_estimado)}
          </span>
        )}
      </div>
    </div>
  )
}
