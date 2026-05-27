// ============================================================
// FTD NEXUS — Business Logic Calculations
// MCI, COBRA, D2, D3, D4 calculation helpers
// ============================================================

import type { PlacarStatus, PerfilConsultor } from '@/lib/supabase/types'

// ============================================================
// MCI / WIG CALCULATIONS
// ============================================================

export function calcMCIPct(realizado: number, meta: number): number {
  if (meta <= 0) return 0
  return Math.round((realizado / meta) * 1000) / 10
}

export function getMCIStatus(
  pct: number
): 'atingido' | 'no_caminho' | 'atencao' | 'critico' {
  if (pct >= 100) return 'atingido'
  if (pct >= 80) return 'no_caminho'
  if (pct >= 50) return 'atencao'
  return 'critico'
}

export function getMCIStatusColor(pct: number): string {
  if (pct >= 100) return '#00875A'
  if (pct >= 80) return '#00875A'
  if (pct >= 50) return '#FF991F'
  return '#DE350B'
}

export function getMCIStatusLabel(pct: number): string {
  const s = getMCIStatus(pct)
  return {
    atingido: 'Atingido!',
    no_caminho: 'No caminho',
    atencao: 'Atenção',
    critico: 'Crítico',
  }[s]
}

export function calcRiskLevel(
  pctMCI: number,
  daysRemaining: number,
  totalDays: number
): 'ok' | 'warning' | 'critical' {
  const timeElapsed = totalDays > 0 ? (totalDays - daysRemaining) / totalDays : 0
  const expectedProgress = timeElapsed * 100
  if (pctMCI >= 100) return 'ok'
  if (pctMCI < expectedProgress * 0.6) return 'critical'
  if (pctMCI < expectedProgress * 0.8) return 'warning'
  return 'ok'
}

export function calcTeamMCIMedia(pcts: number[]): number {
  if (pcts.length === 0) return 0
  return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
}

// ============================================================
// D2 — LEAD MEASURES
// ============================================================

export function calcD2Pct(realizado: number, meta: number): number {
  if (meta <= 0) return 0
  return Math.round((realizado / meta) * 100)
}

export function getD2StatusColor(pct: number): string {
  if (pct >= 100) return '#00875A'
  if (pct >= 75) return '#FF991F'
  return '#DE350B'
}

// ============================================================
// D3 — SCOREBOARD
// ============================================================

export function getScoreboardStatus(pctD2: number): PlacarStatus {
  return pctD2 >= 100 ? 'verde' : 'vermelho'
}

export function hasConsecutiveRed(
  weeks: (PlacarStatus | 'pendente')[]
): boolean {
  for (let i = 0; i < weeks.length - 1; i++) {
    if (weeks[i] === 'vermelho' && weeks[i + 1] === 'vermelho') return true
  }
  return false
}

export function countGreenWeeks(weeks: (PlacarStatus | 'pendente')[]): number {
  return weeks.filter(w => w === 'verde').length
}

export function countRedWeeks(weeks: (PlacarStatus | 'pendente')[]): number {
  return weeks.filter(w => w === 'vermelho').length
}

export function getScoreboardStatusLabel(status: PlacarStatus | 'pendente'): string {
  return status === 'verde' ? 'Verde 🟢' : status === 'vermelho' ? 'Vermelho 🔴' : 'Pendente'
}

// ============================================================
// D4 — CADÊNCIAS
// ============================================================

export function calcD4Rate(cumpridos: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((cumpridos / total) * 100)
}

export function getD4RateLabel(rate: number): string {
  if (rate >= 80) return 'Excelente'
  if (rate >= 60) return 'Bom'
  if (rate >= 40) return 'Regular'
  return 'Crítico'
}

// ============================================================
// COBRA CALCULATIONS
// ============================================================

export function calcCobraTotal(notas: number[]): number {
  return notas.reduce((a, b) => a + b, 0)
}

export function calcCobraNivel(total: number): string {
  if (total >= 23) return 'Excelente'
  if (total >= 19) return 'Muito bom'
  if (total >= 16) return 'Bom, ajustar'
  if (total >= 11) return 'Baixo, atenção'
  return 'Crítico'
}

export function calcCobraNivelColor(total: number): string {
  if (total >= 23) return '#00875A'
  if (total >= 19) return '#00875A'
  if (total >= 16) return '#FF991F'
  if (total >= 11) return '#FF991F'
  return '#DE350B'
}

export function calcCobraNotaPct(nota: number, max = 5): number {
  return Math.round((nota / max) * 100)
}

// Criteria labels by profile type
export const COBRA_CRITERIOS_FARMER = [
  'Renovação',
  'Relacionamento',
  'Expansão',
  'Consistência',
  'Consultoria',
]

export const COBRA_CRITERIOS_HUNTER = [
  'Captação',
  'Prospecção',
  'Conversão',
  'Consistência',
  'Postura',
]

export function getCriterioPorPerfil(perfil: PerfilConsultor | null | undefined): string[] {
  if (perfil === 'hunter') return COBRA_CRITERIOS_HUNTER
  return COBRA_CRITERIOS_FARMER // farmer, hibrido, inside_sales
}

export function getCriterioLowestNota(
  notas: Record<string, number>,
  criterios: string[]
): string | null {
  if (Object.keys(notas).length === 0) return null
  let lowest = Infinity
  let lowestCriterio: string | null = null
  for (const criterio of criterios) {
    const nota = notas[criterio] ?? 0
    if (nota < lowest) {
      lowest = nota
      lowestCriterio = criterio
    }
  }
  return lowestCriterio
}

// ============================================================
// PIPELINE CALCULATIONS
// ============================================================

export function calcPipelineTotal(
  opps: Array<{ valor_estimado: number | null; probabilidade: number | null }>
): { total: number; ponderado: number } {
  const total = opps.reduce((a, o) => a + (o.valor_estimado ?? 0), 0)
  const ponderado = opps.reduce(
    (a, o) => a + ((o.valor_estimado ?? 0) * (o.probabilidade ?? 0)) / 100,
    0
  )
  return { total, ponderado }
}

export function calcConversionRate(ganhos: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((ganhos / total) * 100)
}

export function calcAverageDealSize(
  opps: Array<{ valor_estimado: number | null; status: string }>
): number {
  const ganhos = opps.filter(o => o.status === 'ganho' && o.valor_estimado)
  if (ganhos.length === 0) return 0
  return ganhos.reduce((a, o) => a + (o.valor_estimado ?? 0), 0) / ganhos.length
}

// ============================================================
// INITIALS
// ============================================================

export function getInitials(nome?: string | null): string {
  if (!nome) return '?'
  return nome
    .split(' ')
    .filter(n => n.length > 0)
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}
