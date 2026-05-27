import { getWeek, getMonth, getYear, format, parseISO, differenceInDays, isAfter, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ============================================================
// DATE UTILITIES
// ============================================================

export function getCurrentWeek(): number {
  return getWeek(new Date(), { locale: ptBR, weekStartsOn: 1 })
}

export function getCurrentMonth(): number {
  return getMonth(new Date()) + 1
}

export function getCurrentYear(): number {
  return getYear(new Date())
}

export function getWeekOfMonth(date: Date = new Date()): number {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  return Math.ceil((date.getDate() + firstDayOfMonth.getDay()) / 7)
}

export function getCurrentWeekOfMonth(): number {
  return getWeekOfMonth(new Date())
}

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: ptBR })
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm")
}

export function formatDateShort(date: string | Date): string {
  return formatDate(date, 'dd MMM')
}

export function formatDateRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const diff = differenceInDays(now, d)

  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  if (diff < 7) return `${diff} dias atrás`
  if (diff < 30) return `${Math.floor(diff / 7)} semanas atrás`
  return formatDate(date, 'dd/MM/yyyy')
}

export function getDaysRemaining(endDate: string | Date): number {
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
  return Math.max(0, differenceInDays(end, new Date()))
}

export function isOverdue(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isBefore(d, new Date())
}

export function getWeekRange(week: number, year: number): { start: Date; end: Date } {
  const jan1 = new Date(year, 0, 1)
  const daysOffset = (week - 1) * 7
  const start = new Date(jan1.getTime() + daysOffset * 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
  return { start, end }
}

// ============================================================
// FORMATTERS
// ============================================================

export function formatCurrency(value: number | null | undefined, compact = false): string {
  if (value == null) return 'R$ —'
  if (compact && value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`
  }
  if (compact && value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}k`
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '—%'
  return `${value.toFixed(decimals).replace('.', ',')}%`
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatPerfilLabel(perfil: string | null | undefined): string {
  const map: Record<string, string> = {
    hibrido: 'Híbrido',
    farmer: 'Farmer',
    hunter: 'Hunter',
    inside_sales: 'Inside Sales',
  }
  return map[perfil ?? ''] ?? perfil ?? '—'
}

export function formatRoleLabel(role: string | null | undefined): string {
  const map: Record<string, string> = {
    admin: 'Administrador',
    gerente: 'Gerente',
    coordenador: 'Coordenador',
    consultor: 'Consultor',
    viewer: 'Visualizador',
  }
  return map[role ?? ''] ?? role ?? '—'
}

// ============================================================
// CALCULATIONS
// ============================================================

export function calcMCIPct(realizado: number, meta: number): number {
  if (meta <= 0) return 0
  return Math.round((realizado / meta) * 1000) / 10
}

export function getMCIStatusColor(pct: number): string {
  if (pct >= 100) return '#00875A'
  if (pct >= 80) return '#FF991F'
  if (pct >= 50) return '#FF991F'
  return '#DE350B'
}

export function getMCIStatus(pct: number): 'atingido' | 'no_caminho' | 'atencao' | 'critico' | 'sem_meta' {
  if (pct >= 100) return 'atingido'
  if (pct >= 80) return 'no_caminho'
  if (pct >= 50) return 'atencao'
  return 'critico'
}

export function calcCobraNivel(total: number): string {
  if (total >= 23) return 'Excelente'
  if (total >= 19) return 'Muito bom'
  if (total >= 16) return 'Bom, ajustar'
  if (total >= 11) return 'Baixo, atenção'
  return 'Crítico'
}

export function calcD4Rate(cumpridos: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((cumpridos / total) * 100)
}

export function calcTeamMCIMedia(pcts: number[]): number {
  if (pcts.length === 0) return 0
  return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length)
}

export function getScoreboardStatusFromD2(pctD2: number): 'verde' | 'vermelho' {
  return pctD2 >= 100 ? 'verde' : 'vermelho'
}

export function hasConsecutiveRed(weeks: ('verde' | 'vermelho' | 'pendente')[]): boolean {
  for (let i = 0; i < weeks.length - 1; i++) {
    if (weeks[i] === 'vermelho' && weeks[i + 1] === 'vermelho') return true
  }
  return false
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
