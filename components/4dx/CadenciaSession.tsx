// ============================================================
// FTD NEXUS — CadenciaSession
// D4 meeting mode: 3-step structured cadence session
// ============================================================

'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Clock, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react'
import { useCadencias, useUpdateCompromisso, useAddCompromisso } from '@/lib/hooks/use4dx'
import { Avatar, StatusBadge, WeeklyDots } from '@/components/ui/KPICard'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/formatters'
import { calcD4Rate } from '@/lib/utils/calculations'
import type { CadenciaWithCompromissos, CompromissoStatus } from '@/lib/supabase/types'
import { toast } from 'sonner'

interface CadenciaSessionProps {
  cadencia: CadenciaWithCompromissos
  onClose: () => void
}

const STEPS = [
  { id: 0, label: 'Comprometimentos', desc: 'Cumpriu o compromisso anterior?' },
  { id: 1, label: 'Revisar Placar', desc: 'Estamos verde ou vermelho?' },
  { id: 2, label: 'Novo Compromisso', desc: 'O que faremos diferente esta semana?' },
]

export function CadenciaSession({ cadencia, onClose }: CadenciaSessionProps) {
  const [step, setStep] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [novosCompromissos, setNovosCompromissos] = useState<Record<string, string>>({})
  const updateCompromisso = useUpdateCompromisso()
  const addCompromisso = useAddCompromisso()

  const comprometimentos = cadencia.compromissos ?? []
  const cumpridos = comprometimentos.filter(c => c.status === 'cumprido').length
  const taxaCumprimento = calcD4Rate(cumpridos, comprometimentos.length)

  async function markCompromisso(id: string, status: CompromissoStatus) {
    try {
      await updateCompromisso.mutateAsync({ id, status })
    } catch {
      toast.error('Erro ao atualizar compromisso')
    }
  }

  async function saveNovosCompromissos() {
    const entries = Object.entries(novosCompromissos).filter(([, v]) => v.trim())
    if (!entries.length) {
      toast.warning('Adicione pelo menos um compromisso antes de finalizar')
      return
    }

    try {
      await Promise.all(
        entries.map(([userId, compromisso]) =>
          addCompromisso.mutateAsync({
            cadencia_id: cadencia.id,
            usuario_id: userId,
            compromisso: compromisso.trim(),
            semana_ref: new Date().toISOString().split('T')[0],
          })
        )
      )
      toast.success(`${entries.length} compromisso(s) registrado(s)!`)
      onClose()
    } catch {
      toast.error('Erro ao salvar compromissos')
    }
  }

  return (
    <div className={cn(
      'bg-surface-page',
      fullscreen
        ? 'fixed inset-0 z-50 overflow-auto'
        : 'rounded-xl border border-surface-border overflow-hidden'
    )}>
      {/* Header */}
      <div className="bg-navy-night p-4 md:p-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-ink-on-dark/60 uppercase tracking-wide mb-0.5">
            D4 — Sessão de cadência
          </p>
          <h3 className="text-sm font-medium text-white">{cadencia.titulo}</h3>
          <p className="text-[10px] text-ink-on-dark/60 mt-0.5">
            {formatDate(cadencia.data_sessao)} · {cadencia.duracao_minutos} min
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFullscreen(f => !f)}
            className="p-1.5 text-white/60 hover:text-white transition-colors"
            aria-label={fullscreen ? 'Sair de tela cheia' : 'Tela cheia'}
          >
            {fullscreen
              ? <Minimize2 className="w-4 h-4" aria-hidden />
              : <Maximize2 className="w-4 h-4" aria-hidden />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white transition-colors"
            aria-label="Fechar sessão"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="bg-white border-b border-surface-border px-4 py-2.5 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition-colors',
              step === s.id
                ? 'bg-brand-blue text-white font-medium'
                : i < step
                ? 'text-status-ok-text bg-status-ok-bg'
                : 'text-ink-tertiary bg-surface-secondary'
            )}
          >
            {i < step ? <CheckCircle2 className="w-3 h-3" aria-hidden /> : <span>{i + 1}</span>}
            {s.label}
          </button>
        ))}
        <div className="ml-auto text-[10px] text-ink-secondary">
          Taxa: <span className="font-medium" style={{ color: taxaCumprimento >= 80 ? '#00875A' : taxaCumprimento >= 50 ? '#FF991F' : '#DE350B' }}>
            {taxaCumprimento}%
          </span>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* STEP 0: Check comprometimentos */}
        {step === 0 && (
          <div>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-ink-primary">
                ① Cumpriu o compromisso anterior?
              </h4>
              <p className="text-[10px] text-ink-secondary mt-0.5">
                Marque o status de cada consultor — seja honesto
              </p>
            </div>
            {comprometimentos.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-ink-secondary">
                  Nenhum compromisso registrado na sessão anterior
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {comprometimentos.map(comp => (
                  <div
                    key={comp.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                      comp.status === 'cumprido' ? 'bg-status-ok-bg border-status-ok/20' :
                      comp.status === 'nao_cumprido' ? 'bg-status-danger-bg border-status-danger/20' :
                      'bg-surface-secondary border-surface-border'
                    )}
                  >
                    <Avatar nome={comp.consultor?.nome} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink-primary">{comp.consultor?.nome}</p>
                      <p className="text-[10px] text-ink-secondary mt-0.5 italic">"{comp.compromisso}"</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => markCompromisso(comp.id, 'cumprido')}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          comp.status === 'cumprido'
                            ? 'bg-status-ok text-white'
                            : 'text-ink-tertiary hover:text-status-ok hover:bg-status-ok-bg'
                        )}
                        aria-label="Marcou como cumprido"
                      >
                        <CheckCircle2 className="w-4 h-4" aria-hidden />
                      </button>
                      <button
                        onClick={() => markCompromisso(comp.id, 'parcial')}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          comp.status === 'parcial'
                            ? 'bg-status-warning text-white'
                            : 'text-ink-tertiary hover:text-status-warning hover:bg-status-warning-bg'
                        )}
                        aria-label="Marcar como parcial"
                      >
                        <Clock className="w-4 h-4" aria-hidden />
                      </button>
                      <button
                        onClick={() => markCompromisso(comp.id, 'nao_cumprido')}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          comp.status === 'nao_cumprido'
                            ? 'bg-status-danger text-white'
                            : 'text-ink-tertiary hover:text-status-danger hover:bg-status-danger-bg'
                        )}
                        aria-label="Marcar como não cumprido"
                      >
                        <XCircle className="w-4 h-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 1: Scoreboard review */}
        {step === 1 && (
          <div>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-ink-primary">
                ② Revisar o placar — estamos ganhando?
              </h4>
              <p className="text-[10px] text-ink-secondary mt-0.5">
                Verde = D2 ≥ 100% · Vermelho = D2 &lt; 100%
              </p>
            </div>
            <div className="p-4 bg-surface-secondary rounded-lg text-center">
              <p className="text-xs text-ink-secondary">
                Revise o placar do time no painel D3 — Scoreboard e discuta os resultados da semana antes de prosseguir.
              </p>
              <div className="mt-3 flex justify-center">
                <div className="flex gap-3">
                  <div className="text-center px-4 py-3 bg-white rounded-lg border border-surface-border">
                    <p className="text-xl font-medium text-status-ok">{cumpridos}</p>
                    <p className="text-[9px] text-ink-secondary">Cumpriram</p>
                  </div>
                  <div className="text-center px-4 py-3 bg-white rounded-lg border border-surface-border">
                    <p className="text-xl font-medium text-status-danger">{comprometimentos.length - cumpridos}</p>
                    <p className="text-[9px] text-ink-secondary">Não cumpriram</p>
                  </div>
                  <div className="text-center px-4 py-3 bg-white rounded-lg border border-surface-border">
                    <p className="text-xl font-medium" style={{ color: taxaCumprimento >= 80 ? '#00875A' : '#DE350B' }}>{taxaCumprimento}%</p>
                    <p className="text-[9px] text-ink-secondary">Taxa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: New commitments */}
        {step === 2 && (
          <div>
            <div className="mb-4">
              <h4 className="text-sm font-medium text-ink-primary">
                ③ Novo compromisso — o consultor propõe
              </h4>
              <p className="text-[10px] text-ink-secondary mt-0.5">
                Cada consultor se compromete com uma ação específica para a próxima semana
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {cadencia.participantes?.map(p => (
                <div key={p.id} className="flex items-start gap-3">
                  <Avatar nome={p.nome} size="sm" className="mt-2" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-ink-primary mb-1.5">{p.nome}</p>
                    <input
                      type="text"
                      placeholder={`Compromisso de ${p.nome?.split(' ')[0]}...`}
                      value={novosCompromissos[p.id] ?? ''}
                      onChange={e => setNovosCompromissos(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-border">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="btn btn-ghost disabled:opacity-40"
          >
            Anterior
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="btn btn-primary"
            >
              Próximo passo
              <ChevronRight className="w-3.5 h-3.5" aria-hidden />
            </button>
          ) : (
            <button
              onClick={saveNovosCompromissos}
              className="btn btn-primary"
              disabled={addCompromisso.isPending}
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
              {addCompromisso.isPending ? 'Salvando...' : 'Finalizar sessão'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
