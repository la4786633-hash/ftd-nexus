// ============================================================
// FTD NEXUS — Date Utilities
// All date helpers used across the application
// ============================================================

import {
  getWeek, getMonth, getYear, format, parseISO,
  differenceInDays, isAfter, isBefore, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, addWeeks, subWeeks, addDays
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ============================================================
// CURRENT DATE HELPERS
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

// ============================================================
// FORMAT HELPERS
// ============================================================

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
  if (diff < 0) return `Em ${Math.abs(diff)} dias`
  if (diff < 7) return `${diff} dias atrás`
  if (diff < 30) return `${Math.floor(diff / 7)} semanas atrás`
  return formatDate(date, 'dd/MM/yyyy')
}

export function formatMonthYear(date: string | Date): string {
  return formatDate(date, "MMMM 'de' yyyy")
}

// ============================================================
// RANGE HELPERS
// ============================================================

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

export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date()
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 }),
  }
}

export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  return { start: startOfMonth(now), end: endOfMonth(now) }
}

export function getPreviousWeekRange(): { start: Date; end: Date } {
  const now = new Date()
  const prevWeekStart = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), 1)
  return {
    start: prevWeekStart,
    end: endOfWeek(prevWeekStart, { weekStartsOn: 1 }),
  }
}

export function getNextWeekDates(count = 7): Date[] {
  const start = new Date()
  return Array.from({ length: count }, (_, i) => addDays(start, i))
}

export function isSameWeek(date: string | Date, referenceDate?: Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  const ref = referenceDate ?? new Date()
  const weekStart = startOfWeek(ref, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(ref, { weekStartsOn: 1 })
  return isAfter(d, weekStart) && isBefore(d, weekEnd)
}

// ============================================================
// WEEK LABEL (Sem. 1, Sem. 2, etc.)
// ============================================================

export function getWeekLabel(semana: number, total = 5): string {
  return `Sem.${semana}`
}

export function getWeekLabelFull(semana: number, year: number): string {
  const { start, end } = getWeekRange(semana, year)
  return `${format(start, 'dd/MM')} – ${format(end, 'dd/MM')}`
}

// ============================================================
// PARSE HELPERS
// ============================================================

export function parseDate(date: string): Date {
  return parseISO(date)
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function toISODateTime(date: Date): string {
  return date.toISOString()
}
