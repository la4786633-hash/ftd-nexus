'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bell, Search, Plus, Play, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { NotificationPanel } from '@/components/notifications/NotificationPanel'
import { cn } from '@/lib/utils/cn'

const BREADCRUMBS: Record<string, { label: string; parent?: string }> = {
  '/war-room': { label: 'War Room' },
  '/equipe': { label: 'Minha Equipe' },
  '/4dx': { label: '4DX' },
  '/4dx/wigs': { label: 'WIGs & MCIs', parent: '/4dx' },
  '/4dx/leads': { label: 'Lead Measures', parent: '/4dx' },
  '/4dx/scoreboard': { label: 'Scoreboard', parent: '/4dx' },
  '/4dx/cadencias': { label: 'Cadências', parent: '/4dx' },
  '/cobra': { label: 'COBRA' },
  '/cobra/pipeline': { label: 'Pipeline', parent: '/cobra' },
  '/cobra/escolas': { label: 'Escolas / CRM', parent: '/cobra' },
  '/cobra/avaliacoes': { label: 'Avaliações COBRA', parent: '/cobra' },
  '/cobra/atividades': { label: 'Atividades', parent: '/cobra' },
  '/autocuidado': { label: 'Autocuidado' },
  '/relatorios': { label: 'Relatórios' },
  '/guia': { label: 'Guia Prático' },
  '/configuracoes': { label: 'Configurações' },
}

const PAGE_SUBTITLES: Record<string, string> = {
  '/war-room': 'Regional Centro-Norte · Jan 2027',
  '/equipe': 'Gestão de consultores e perfis',
  '/4dx/wigs': 'Metas Crucialmente Importantes',
  '/4dx/leads': 'Medidas de Direção semanais',
  '/4dx/scoreboard': 'Placar visual do time',
  '/4dx/cadencias': 'WIG Sessions semanais',
  '/cobra/pipeline': 'Oportunidades ativas do time',
  '/cobra/escolas': 'Base de clientes e prospectos',
  '/cobra/avaliacoes': 'Avaliação mensal de competências',
  '/relatorios': 'Análise de performance e exportação',
}

export function Topbar() {
  const pathname = usePathname()
  const { profile } = useAuth()
  const { unreadCount } = useNotifications()
  const [notifOpen, setNotifOpen] = useState(false)

  const current = BREADCRUMBS[pathname]
  const parent = current?.parent ? BREADCRUMBS[current.parent] : null
  const subtitle = PAGE_SUBTITLES[pathname]

  const initials = profile?.nome
    ? profile.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'FTD'

  return (
    <header className="topbar" role="banner">
      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        {parent && (
          <div className="flex items-center gap-1 text-[10px] text-ink-tertiary mb-0.5">
            <Link href={current.parent!} className="hover:text-ink-secondary transition-colors">
              {parent.label}
            </Link>
            <ChevronRight className="w-2.5 h-2.5" aria-hidden />
          </div>
        )}
        <h1 className="text-sm font-medium text-ink-primary truncate">
          {current?.label ?? 'FTD Nexus'}
        </h1>
        {subtitle && (
          <p className="text-[10px] text-ink-secondary mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 ml-3">
        {/* Search */}
        <button
          className="btn-icon btn-ghost text-ink-secondary"
          aria-label="Buscar"
        >
          <Search className="w-3.5 h-3.5" aria-hidden />
        </button>

        {/* War Room button (War Room page only) */}
        {pathname === '/war-room' && (
          <Link
            href="/war-room?mode=presentation"
            className="btn-ghost btn items-center hidden md:inline-flex"
          >
            <Play className="w-3 h-3 text-status-ok" aria-hidden />
            <span className="text-[10px]">Iniciar sessão</span>
          </Link>
        )}

        {/* Quick add */}
        {(pathname.startsWith('/cobra') || pathname.startsWith('/4dx')) && (
          <button
            className="btn-primary btn hidden md:inline-flex"
            aria-label="Novo registro"
          >
            <Plus className="w-3 h-3" aria-hidden />
            Novo
          </button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            className="btn-icon btn-ghost relative text-ink-secondary"
            onClick={() => setNotifOpen(prev => !prev)}
            aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
            aria-expanded={notifOpen}
          >
            <Bell className="w-4 h-4" aria-hidden />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-status-danger text-white text-[8px] rounded-full flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotificationPanel onClose={() => setNotifOpen(false)} />
          )}
        </div>

        {/* Avatar */}
        <Link
          href="/configuracoes"
          className="w-7 h-7 rounded-full bg-brand-blue flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0 ml-1"
          aria-label="Perfil e configurações"
        >
          {initials}
        </Link>
      </div>
    </header>
  )
}
