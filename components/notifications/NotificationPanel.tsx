'use client'

import { useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { formatDateRelative } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'
import type { Notification } from '@/lib/supabase/types'

interface NotificationPanelProps {
  onClose: () => void
}

const TIPO_ICONS: Record<string, string> = {
  alerta_placar: '🔴',
  cadencia_pendente: '📅',
  cobra_liberado: '📊',
  meta_atingida: '🎉',
  risco_mci: '⚠️',
  compromisso: '✅',
  sistema: 'ℹ️',
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 w-80 bg-white border border-surface-border rounded-xl shadow-dropdown z-50 overflow-hidden"
      role="dialog"
      aria-label="Notificações"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-ink-secondary" aria-hidden />
          <span className="text-xs font-medium text-ink-primary">Notificações</span>
          {unreadCount > 0 && (
            <span className="badge badge-danger text-[9px]">{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="text-[10px] text-brand-blue hover:underline flex items-center gap-1"
          >
            <CheckCheck className="w-3 h-3" aria-hidden />
            Marcar todas lidas
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="w-6 h-6 text-ink-tertiary mx-auto mb-2" aria-hidden />
            <p className="text-xs text-ink-secondary">Nenhuma notificação</p>
          </div>
        ) : (
          notifications.map(notif => (
            <NotifItem
              key={notif.id}
              notif={notif}
              onRead={() => markRead(notif.id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-surface-border px-3 py-2">
        <Link
          href="/notificacoes"
          onClick={onClose}
          className="text-[10px] text-brand-blue hover:underline flex items-center gap-1 justify-center"
        >
          Ver todas <ExternalLink className="w-2.5 h-2.5" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

function NotifItem({ notif, onRead }: { notif: Notification; onRead: () => void }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 px-3 py-2.5 border-b border-surface-border/50 last:border-b-0 cursor-pointer transition-colors',
        !notif.lida ? 'bg-brand-blue/3' : 'hover:bg-surface-secondary'
      )}
      onClick={onRead}
    >
      <span className="text-base mt-0.5 flex-shrink-0" aria-hidden>
        {TIPO_ICONS[notif.tipo] ?? '🔔'}
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs', !notif.lida ? 'font-medium text-ink-primary' : 'text-ink-secondary')}>
          {notif.titulo}
        </p>
        {notif.mensagem && (
          <p className="text-[10px] text-ink-secondary mt-0.5 leading-relaxed line-clamp-2">
            {notif.mensagem}
          </p>
        )}
        <p className="text-[9px] text-ink-tertiary mt-1">
          {formatDateRelative(notif.created_at)}
        </p>
      </div>
      {!notif.lida && (
        <div className="w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0 mt-1.5" aria-label="Não lida" />
      )}
    </div>
  )
}
