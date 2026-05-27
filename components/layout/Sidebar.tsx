'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Target, Kanban, Users, Heart,
  BarChart3, BookOpen, Settings, ChevronDown,
  Bolt, LogOut, Bell, Menu, X
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { cn } from '@/lib/utils/cn'
import type { UserRole } from '@/lib/supabase/types'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  roles?: UserRole[]
  children?: { label: string; href: string }[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'War Room', href: '/war-room', icon: LayoutDashboard },
  { label: 'Minha Equipe', href: '/equipe', icon: Users, roles: ['coordenador', 'gerente', 'admin'] },
  {
    label: '4DX — Metas',
    href: '/4dx',
    icon: Target,
    children: [
      { label: 'WIGs & MCIs', href: '/4dx/wigs' },
      { label: 'Lead Measures', href: '/4dx/leads' },
      { label: 'Scoreboard', href: '/4dx/scoreboard' },
      { label: 'Cadências', href: '/4dx/cadencias' },
    ],
  },
  {
    label: 'COBRA Pipeline',
    href: '/cobra',
    icon: Kanban,
    children: [
      { label: 'Pipeline', href: '/cobra/pipeline' },
      { label: 'Escolas / CRM', href: '/cobra/escolas' },
      { label: 'Avaliações', href: '/cobra/avaliacoes' },
      { label: 'Atividades', href: '/cobra/atividades' },
    ],
  },
  { label: 'Autocuidado', href: '/autocuidado', icon: Heart },
  { label: 'Relatórios', href: '/relatorios', icon: BarChart3 },
]

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Guia Prático', href: '/guia', icon: BookOpen },
  { label: 'Configurações', href: '/configuracoes', icon: Settings },
]

const MOBILE_NAV = [
  { label: 'Início', href: '/war-room', icon: LayoutDashboard },
  { label: '4DX', href: '/4dx', icon: Target },
  { label: 'COBRA', href: '/cobra/pipeline', icon: Kanban },
  { label: 'Cadências', href: '/4dx/cadencias', icon: Users },
  { label: 'Análise', href: '/relatorios', icon: BarChart3 },
]

export function Sidebar({ unreadNotifications = 0 }: { unreadNotifications?: number }) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const [expandedItems, setExpandedItems] = useState<string[]>(['/4dx', '/cobra'])
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggleExpand(href: string) {
    setExpandedItems(prev =>
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    )
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  function canAccess(item: NavItem) {
    if (!item.roles) return true
    if (!profile) return false
    return item.roles.includes(profile.role)
  }

  const visibleItems = NAV_ITEMS.filter(canAccess)

  const initials = profile?.nome
    ? profile.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'FTD'

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar hidden md:flex" aria-label="Navegação principal">
        {/* Brand */}
        <div className="px-3 py-3 border-b border-white/10 flex-shrink-0">
          <Link href="/war-room" className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-blue rounded flex items-center justify-center flex-shrink-0">
              <Bolt className="w-3.5 h-3.5 text-white" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium text-white leading-none">FTD Nexus</p>
              <p className="text-[9px] text-[#7A8BA4] mt-0.5">4DX + COBRA</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide">
          <p className="nav-section">Visão</p>

          {visibleItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href)
            const expanded = expandedItems.includes(item.href)

            return (
              <div key={item.href}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.href)}
                      className={cn('nav-item w-full text-left', active && 'active')}
                      aria-expanded={expanded}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                      <span className="flex-1">{item.label}</span>
                      <ChevronDown
                        className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')}
                        aria-hidden
                      />
                    </button>
                    {expanded && (
                      <div className="ml-5 border-l border-white/10 pl-2 mt-0.5 mb-1">
                        {item.children.map(child => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'block py-1.5 px-2 text-[10px] rounded transition-colors',
                              pathname === child.href
                                ? 'text-[#7EB3FF] font-medium'
                                : 'text-[#4A5568] hover:text-[#7A8BA4]'
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={item.href} className={cn('nav-item', active && 'active')}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="text-[9px] bg-status-danger text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                )}

                {/* Insert divider before 4DX */}
                {item.href === '/equipe' && <div className="border-t border-white/8 mx-3 my-1.5" />}
                {item.href === '/cobra' && <div className="border-t border-white/8 mx-3 my-1.5" />}
              </div>
            )
          })}

          <div className="border-t border-white/8 mx-3 my-1.5" />

          {BOTTOM_NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('nav-item', isActive(item.href) && 'active')}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Footer */}
        <div className="px-3 py-2.5 border-t border-white/10 flex-shrink-0">
          {unreadNotifications > 0 && (
            <Link
              href="/notificacoes"
              className="flex items-center gap-2 px-2 py-1.5 rounded text-[10px] text-[#7A8BA4] hover:bg-white/5 mb-1 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" aria-hidden />
              <span className="flex-1">Notificações</span>
              <span className="bg-status-danger text-white text-[9px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </span>
            </Link>
          )}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full bg-brand-royal flex items-center justify-center text-[10px] font-medium text-[#7EB3FF] flex-shrink-0"
              aria-hidden
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-white truncate">{profile?.nome ?? 'Usuário'}</p>
              <p className="text-[9px] text-[#7A8BA4] truncate capitalize">{profile?.role ?? ''}</p>
            </div>
            <button
              onClick={signOut}
              className="p-1 rounded text-[#4A5568] hover:text-[#7A8BA4] transition-colors"
              aria-label="Sair"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-border z-50 flex"
        aria-label="Navegação mobile"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {MOBILE_NAV.map(item => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 px-1 transition-colors',
                active ? 'text-brand-blue' : 'text-ink-tertiary'
              )}
            >
              <Icon className="w-5 h-5" aria-hidden />
              <span className="text-[9px]">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
