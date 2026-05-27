// ============================================================
// FTD NEXUS — AlertFeed Component
// Realtime activity feed and alerts panel
// ============================================================

'use client'

import { AlertTriangle, Trophy, Target, Calendar, TrendingDown, Bell, Check } from 'lucide-react'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'
import { formatDateRelative } from '@/lib/utils/formatters'
import type { Notification } from '@/lib/supabase/types'

// ============================================================
// ALERT FEED (Dashboard widget)
// ============================================================

interface AlertFeedProps {
  maxItems?: number
  showMarkRead?: boolean
  className?: string
}

export function AlertFeed({ maxItems = 5, showMarkRead = false, className }: AlertFeedProps) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const items = notifications?.slice(0, maxItems) ?? []

  return (
    <div className={cn('card', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-ink-primary">
          <Bell className="w-3.5 h-3.5 inline mr-1.5 text-ink-tertiary" aria-hidden />
          Alertas e atividades
        </h3>
        {unreadCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="badge badge-danger">{unreadCount} novos</span>
            {showMarkRead && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-[10px] text-brand-blue hover:underline"
              >
                Marcar tudo
              </button>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center py-6">
          <Check className="w-6 h-6 text-status-ok mb-2" aria-hidden />
          <p className="text-xs text-ink-secondary">Nenhum alerta pendente</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-surface-border">
          {items.map(notif => (
            <AlertFeedItem
              key={notif.id}
              notification={notif}
              onRead={() => markRead.mutate(notif.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================
// ALERT FEED ITEM
// ============================================================

const NOTIF_ICONS: Record<string, { icon: typeof AlertTriangle; colorClass: string }> = {
  alerta_placar: { icon: AlertTriangle, colorClass: 'text-status-danger' },
  risco_mci: { icon: TrendingDown, colorClass: 'text-status-warning' },
  cadencia_pendente: { icon: Calendar, colorClass: 'text-brand-blue' },
  cobra_liberado: { icon: Target, colorClass: 'text-status-warning' },
  meta_atingida: { icon: Trophy, colorClass: 'text-status-ok' },
  compromisso: { icon: Check, colorClass: 'text-status-ok' },
  sistema: { icon: Bell, colorClass: 'text-ink-tertiary' },
}

interface AlertFeedItemProps {
  notification: Notification
  onRead?: () => void
}

export function AlertFeedItem({ notification, onRead }: AlertFeedItemProps) {
  const config = NOTIF_ICONS[notification.tipo] ?? NOTIF_ICONS.sistema
  const Icon = config.icon

  const titleColorClass =
    notification.tipo === 'alerta_placar' || notification.tipo === 'risco_mci'
      ? 'text-status-danger-text'
      : notification.tipo === 'cadencia_pendente' || notification.tipo === 'cobra_liberado'
      ? 'text-status-warning-text'
      : notification.tipo === 'meta_atingida' || notification.tipo === 'compromisso'
      ? 'text-status-ok-text'
      : 'text-ink-primary'

  return (
    <button
      className={cn(
        'flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0 text-left w-full group',
        !notification.lida && 'relative',
      )}
      onClick={() => {
        if (!notification.lida && onRead) onRead()
        if (notification.link) {
          window.location.href = notification.link
        }
      }}
    >
      {!notification.lida && (
        <span className="absolute left-0 top-3 w-1 h-1 rounded-full bg-brand-blue" aria-hidden />
      )}
      <Icon
        className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', config.colorClass)}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <p className={cn('text-[10px] font-medium leading-tight', titleColorClass)}>
          {notification.titulo}
        </p>
        {notification.mensagem && (
          <p className="text-[9px] text-ink-secondary mt-0.5 line-clamp-2">
            {notification.mensagem}
          </p>
        )}
        <p className="text-[9px] text-ink-tertiary mt-0.5">
          {formatDateRelative(notification.created_at)}
        </p>
      </div>
    </button>
  )
}

// ============================================================
// COMPACT ALERT ROW (for tables/lists)
// ============================================================

interface AlertRowProps {
  type: 'danger' | 'warning' | 'ok' | 'info'
  title: string
  description?: string
  icon?: React.ReactNode
}

export function AlertRow({ type, title, description, icon }: AlertRowProps) {
  const defaultIcons = {
    danger: <AlertTriangle className="w-3.5 h-3.5 text-status-danger" aria-hidden />,
    warning: <AlertTriangle className="w-3.5 h-3.5 text-status-warning" aria-hidden />,
    ok: <Trophy className="w-3.5 h-3.5 text-status-ok" aria-hidden />,
    info: <Bell className="w-3.5 h-3.5 text-brand-blue" aria-hidden />,
  }

  return (
    <div className="flex items-start gap-2 py-2.5 first:pt-0 last:pb-0">
      <span className="flex-shrink-0 mt-0.5">{icon ?? defaultIcons[type]}</span>
      <div>
        <p className={cn(
          'text-[10px] font-medium',
          type === 'danger' ? 'text-status-danger-text' :
          type === 'warning' ? 'text-status-warning-text' :
          type === 'ok' ? 'text-status-ok-text' : 'text-ink-primary'
        )}>
          {title}
        </p>
        {description && (
          <p className="text-[9px] text-ink-secondary mt-0.5">{description}</p>
        )}
      </div>
    </div>
  )
}
