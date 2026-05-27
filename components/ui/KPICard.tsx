'use client'

import { cn } from '@/lib/utils/cn'
import type { PerfilConsultor, PlacarStatus } from '@/lib/supabase/types'

// ============================================================
// KPI CARD
// ============================================================

interface KPICardProps {
  label: string
  value: string | number
  trend?: string
  trendType?: 'ok' | 'warning' | 'danger' | 'neutral'
  color?: 'ok' | 'warning' | 'danger' | 'info' | 'neutral'
  icon?: React.ReactNode
  className?: string
}

const colorMap = {
  ok: '#00875A',
  warning: '#FF991F',
  danger: '#DE350B',
  info: '#1565C0',
  neutral: '#B3BAC5',
}

export function KPICard({ label, value, trend, trendType = 'neutral', color = 'neutral', icon, className }: KPICardProps) {
  return (
    <div
      className={cn('kpi-card', className)}
      style={{ borderTopColor: colorMap[color] }}
    >
      <div className="flex items-start justify-between">
        <p className="kpi-label">{label}</p>
        {icon && <span className="text-ink-tertiary">{icon}</span>}
      </div>
      <p
        className="kpi-value"
        style={{ color: colorMap[color] }}
        aria-label={`${label}: ${value}`}
      >
        {value}
      </p>
      {trend && (
        <p
          className={cn(
            'kpi-trend',
            trendType === 'ok' && 'text-status-ok-text',
            trendType === 'warning' && 'text-status-warning-text',
            trendType === 'danger' && 'text-status-danger-text',
          )}
        >
          {trend}
        </p>
      )}
    </div>
  )
}

// ============================================================
// PROGRESS BAR
// ============================================================

interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  showLabel?: boolean
  className?: string
  height?: string
}

export function ProgressBar({ value, max = 100, color = '#1565C0', showLabel = false, className, height = 'h-1.5' }: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn(`progress-bar ${height}`, className)} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div
        className="progress-fill"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ============================================================
// WEEKLY DOTS (Scoreboard)
// ============================================================

interface WeeklyDotsProps {
  weeks: (PlacarStatus | string | undefined)[]
  count?: number
}

export function WeeklyDots({ weeks, count = 4 }: WeeklyDotsProps) {
  const slots = Array.from({ length: count }, (_, i) => weeks[i] ?? 'pendente')

  return (
    <div className="flex gap-1" aria-label={`Placar: ${slots.map(s => s === 'verde' ? '🟢' : s === 'vermelho' ? '🔴' : '⚪').join(' ')}`}>
      {slots.map((status, i) => (
        <div
          key={i}
          className={cn(
            'placar-dot',
            status === 'verde' ? 'placar-verde' : status === 'vermelho' ? 'placar-vermelho' : 'placar-pendente'
          )}
          aria-hidden
        />
      ))}
    </div>
  )
}

// ============================================================
// PROFILE PILL
// ============================================================

const PERFIL_LABELS: Record<PerfilConsultor, string> = {
  hibrido: 'Híbrido',
  farmer: 'Farmer',
  hunter: 'Hunter',
  inside_sales: 'Inside Sales',
}

export function ProfilePill({ perfil, className }: { perfil: PerfilConsultor; className?: string }) {
  return (
    <span
      className={cn(
        'badge text-[9px] px-1.5 py-0.5',
        perfil === 'hibrido' && 'pill-hibrido',
        perfil === 'farmer' && 'pill-farmer',
        perfil === 'hunter' && 'pill-hunter',
        perfil === 'inside_sales' && 'pill-inside',
        className
      )}
    >
      {PERFIL_LABELS[perfil]}
    </span>
  )
}

// ============================================================
// STATUS BADGE
// ============================================================

interface StatusBadgeProps {
  status: 'ok' | 'warning' | 'danger' | 'info' | 'neutral'
  children: React.ReactNode
  className?: string
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        status === 'ok' && 'badge-ok',
        status === 'warning' && 'badge-warning',
        status === 'danger' && 'badge-danger',
        status === 'info' && 'badge-info',
        status === 'neutral' && 'badge-neutral',
        className
      )}
    >
      {children}
    </span>
  )
}

// ============================================================
// AVATAR
// ============================================================

interface AvatarProps {
  nome?: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 'w-6 h-6 text-[9px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' }

export function Avatar({ nome, avatarUrl, size = 'md', className }: AvatarProps) {
  const initials = nome
    ? nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={nome ?? 'Avatar'}
        className={cn('rounded-full object-cover', sizeMap[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-brand-blue-light flex items-center justify-center font-medium text-brand-blue flex-shrink-0',
        sizeMap[size],
        className
      )}
      aria-label={nome ?? 'Avatar'}
    >
      {initials}
    </div>
  )
}

// ============================================================
// LOADING SKELETON
// ============================================================

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-surface-secondary animate-pulse rounded', className)} />
  )
}

// ============================================================
// EMPTY STATE
// ============================================================

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mb-3 text-ink-tertiary">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-ink-primary">{title}</p>
      {description && (
        <p className="text-xs text-ink-secondary mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
