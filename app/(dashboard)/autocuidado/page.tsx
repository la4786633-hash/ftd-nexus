// ============================================================
// app/(dashboard)/autocuidado/page.tsx
// Self-care, personal development and COBRA self-assessment
// ============================================================

'use client'

import { useState } from 'react'
import { Heart, Sparkles, CheckCircle2, Circle, Save, TrendingUp, BookOpen, Star } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useLatestCobraAvaliacao, useSaveCobraAvaliacao } from '@/lib/hooks/useCobra'
import { CobraRadar, CobraNivelBadge } from '@/components/cobra/CobraRadar'
import { KPICard, StatusBadge, Skeleton } from '@/components/ui/KPICard'
import { cn } from '@/lib/utils/cn'
import {
  getCriterioPorPerfil, calcCobraTotal, calcCobraNivel, calcCobraNivelColor,
  getCriterioLowestNota
} from '@/lib/utils/calculations'
import type { PerfilConsultor } from '@/lib/supabase/types'
import { toast } from 'sonner'

// Mock habits data (replace with real data when persistence is added)
const HABITS = [
  { id: 'leads', label: 'Registrou leads D2', icon: TrendingUp },
  { id: 'cadencia', label: 'Participou da cadência', icon: CheckCircle2 },
  { id: 'pipeline', label: 'Atualizou pipeline COBRA', icon: Heart },
  { id: 'reflexao', label: 'Reflexão semanal feita', icon: BookOpen },
  { id: 'estudo', label: 'Estudou produto FTD', icon: Star },
]

export default function AutocuidadoPage() {
  const { profile } = useAuth()
  const { data: avaliacao, isLoading } = useLatestCobraAvaliacao(profile?.id)
  const saveAvaliacao = useSaveCobraAvaliacao()

  const criterios = getCriterioPorPerfil(profile?.perfil as PerfilConsultor)

  // Initialize notas from existing data or zeros
  const [notas, setNotas] = useState<Record<string, number>>(() => {
    if (avaliacao?.notas) {
      return avaliacao.notas.reduce((acc, n) => {
        acc[n.criterio_nome] = n.nota
        return acc
      }, {} as Record<string, number>)
    }
    return Object.fromEntries(criterios.map(c => [c, 0]))
  })

  const [reflexao, setReflexao] = useState('')
  const [plano, setPlano] = useState('')
  const [checkedHabits, setCheckedHabits] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const totalNotas = calcCobraTotal(Object.values(notas))
  const nivel = calcCobraNivel(totalNotas)
  const nivelColor = calcCobraNivelColor(totalNotas)
  const lowestCriterio = getCriterioLowestNota(notas, criterios)

  const radarNotas = criterios.map(c => ({ label: c, value: notas[c] ?? 0 }))

  function updateNota(criterio: string, nota: number) {
    setNotas(prev => ({ ...prev, [criterio]: nota }))
  }

  function toggleHabit(id: string) {
    setCheckedHabits(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    try {
      await saveAvaliacao.mutateAsync({
        consultor_id: profile.id,
        grupo_id: profile.grupo_id!,
        notas: criterios.map(c => ({ criterio_nome: c, nota: notas[c] ?? 0 })),
      })
      toast.success('Autoavaliação salva com sucesso!')
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="page-content">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-medium text-ink-primary flex items-center gap-2">
            <Heart className="w-4 h-4 text-brand-coral" aria-hidden />
            Autocuidado — Desenvolvimento pessoal
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Autoavaliação COBRA · Plano de desenvolvimento · Hábitos da semana
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          <Save className="w-3.5 h-3.5" aria-hidden />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* COBRA Self Assessment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-medium text-ink-primary">
                Autoavaliação COBRA
              </h3>
              <p className="text-[10px] text-ink-secondary mt-0.5">
                Notas de 0 a 5 — seja honesto consigo mesmo
              </p>
            </div>
            <CobraNivelBadge total={totalNotas} />
          </div>

          <div className="flex flex-col gap-4">
            {criterios.map(criterio => {
              const nota = notas[criterio] ?? 0
              const isLowest = criterio === lowestCriterio && nota < 4
              return (
                <div key={criterio}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn(
                      'text-xs font-medium',
                      isLowest ? 'text-status-danger-text' : 'text-ink-primary'
                    )}>
                      {criterio}
                      {isLowest && (
                        <span className="ml-1 text-[9px] bg-status-danger-bg text-status-danger-text px-1.5 py-0.5 rounded-full">
                          ↓ foco aqui
                        </span>
                      )}
                    </span>
                    <span className="text-xs font-medium text-ink-secondary">{nota}/5</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onClick={() => updateNota(criterio, n)}
                        className={cn(
                          'flex-1 h-7 rounded text-xs font-medium transition-all',
                          nota >= n
                            ? nota >= 4 ? 'bg-status-ok text-white'
                              : nota >= 3 ? 'bg-status-warning text-white'
                              : 'bg-status-danger text-white'
                            : 'bg-surface-secondary text-ink-tertiary hover:bg-surface-tertiary'
                        )}
                        aria-label={`${criterio}: nota ${n}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Score summary */}
          <div
            className="mt-4 p-3 rounded-lg border"
            style={{ background: `${nivelColor}11`, borderColor: `${nivelColor}33` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium" style={{ color: nivelColor }}>
                  Total: {totalNotas}/25
                </p>
                <p className="text-[10px]" style={{ color: nivelColor }}>{nivel}</p>
              </div>
              <CobraRadar notas={radarNotas} size={60} showLabels={false} />
            </div>
          </div>
        </div>

        {/* IA Suggestion + Development Plan */}
        <div className="flex flex-col gap-4">
          {/* IA Insight */}
          {lowestCriterio && (
            <div className="card border-brand-blue/20">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-xs font-medium text-ink-primary mb-1">
                    Sugestão de desenvolvimento
                  </p>
                  <p className="text-[10px] text-ink-secondary leading-relaxed">
                    Sua nota mais baixa é em <strong className="font-medium text-ink-primary">{lowestCriterio}</strong>.
                    {' '}Use esse critério como base para o seu próximo Lead Measure D2.
                    Dedique 2-3 ações específicas nessa área esta semana.
                  </p>
                  <div className="mt-2 px-2 py-1.5 bg-brand-blue-light/50 rounded text-[10px] text-brand-blue font-medium">
                    💡 Lead Measure sugerido: "Realizar 3 ações de {lowestCriterio.toLowerCase()} esta semana"
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Development Plan */}
          <div className="card flex-1">
            <h3 className="text-xs font-medium text-ink-primary mb-3">
              Plano de desenvolvimento
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] font-medium text-ink-secondary block mb-1.5">
                  Foco do mês
                </label>
                <input
                  type="text"
                  placeholder="Ex: Melhorar relacionamento com escolas parceiras"
                  value={plano}
                  onChange={e => setPlano(e.target.value)}
                  className="form-input"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-ink-secondary block mb-1.5">
                  Reflexão semanal
                </label>
                <textarea
                  placeholder="O que aprendi esta semana? O que posso fazer diferente?"
                  value={reflexao}
                  onChange={e => setReflexao(e.target.value)}
                  rows={4}
                  className="form-input resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Habits */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-medium text-ink-primary">
            Hábitos da semana
          </h3>
          <span className="text-[10px] text-ink-secondary">
            {checkedHabits.size}/{HABITS.length} concluídos
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {HABITS.map(habit => {
            const checked = checkedHabits.has(habit.id)
            const Icon = habit.icon
            return (
              <button
                key={habit.id}
                onClick={() => toggleHabit(habit.id)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all',
                  checked
                    ? 'bg-status-ok-bg border-status-ok/30 text-status-ok-text'
                    : 'bg-surface-secondary border-surface-border text-ink-secondary hover:border-surface-border-strong'
                )}
              >
                {checked
                  ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                  : <Circle className="w-3.5 h-3.5 flex-shrink-0 opacity-40" aria-hidden />}
                <span className="text-[10px] font-medium">{habit.label}</span>
              </button>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="progress-bar h-2">
            <div
              className="progress-fill transition-all duration-500"
              style={{
                width: `${(checkedHabits.size / HABITS.length) * 100}%`,
                backgroundColor: checkedHabits.size === HABITS.length ? '#00875A' : '#1565C0',
              }}
            />
          </div>
          {checkedHabits.size === HABITS.length && (
            <p className="text-[10px] text-status-ok-text font-medium mt-1 text-center">
              🏆 Semana completa! Excelente disciplina!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
