// ============================================================
// app/(dashboard)/configuracoes/page.tsx
// User profile, notifications, team and system settings
// ============================================================

'use client'

import { useState } from 'react'
import { Settings, User, Bell, Users, Shield, Save, Eye, EyeOff, LogOut } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useTeamMembers } from '@/lib/hooks/use4dx'
import { Avatar, ProfilePill, StatusBadge, Skeleton } from '@/components/ui/KPICard'
import { cn } from '@/lib/utils/cn'
import { formatRoleLabel, formatPerfilLabel } from '@/lib/utils/formatters'
import { toast } from 'sonner'
import type { PerfilConsultor } from '@/lib/supabase/types'

type SettingsTab = 'perfil' | 'notificacoes' | 'equipe' | 'sistema'

const TABS: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
  { id: 'perfil', label: 'Perfil', icon: User },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'equipe', label: 'Equipe', icon: Users },
  { id: 'sistema', label: 'Sistema', icon: Shield },
]

// Notification toggles config
const NOTIFICATION_ITEMS = [
  {
    id: 'alerta_placar',
    label: '2 semanas 🔴 — Alerta',
    desc: 'Notificar quando consultor tiver 2 semanas seguidas em vermelho',
    default: true,
  },
  {
    id: 'cadencia_lembrete',
    label: 'Lembrete de cadência',
    desc: '1 hora antes da sessão agendada',
    default: true,
  },
  {
    id: 'cobra_liberado',
    label: 'COBRA liberado para avaliação',
    desc: 'Início de cada mês — lembrete de avaliação',
    default: true,
  },
  {
    id: 'risco_mci',
    label: 'Risco de MCI',
    desc: 'Quando MCI < 60% com menos de 40% do prazo restante',
    default: true,
  },
  {
    id: 'meta_atingida',
    label: 'Meta atingida',
    desc: 'Celebração quando MCI = 100%',
    default: true,
  },
  {
    id: 'email_semanal',
    label: 'Resumo semanal por e-mail',
    desc: 'Segunda-feira às 8h — consolidado do grupo',
    default: false,
  },
  {
    id: 'push_mobile',
    label: 'Notificações push (PWA)',
    desc: 'Notificações no celular quando o app estiver instalado',
    default: false,
  },
]

export default function ConfiguracoesPage() {
  const { profile, signOut } = useAuth()
  const { data: teamMembers, isLoading: teamLoading } = useTeamMembers()
  const [activeTab, setActiveTab] = useState<SettingsTab>('perfil')
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFICATION_ITEMS.map(n => [n.id, n.default]))
  )
  const [nome, setNome] = useState(profile?.nome ?? '')
  const [cargo, setCargo] = useState(profile?.cargo ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSaveProfile() {
    setSaving(true)
    // In production: update profile via Supabase
    await new Promise(r => setTimeout(r, 500))
    setSaving(false)
    toast.success('Perfil atualizado com sucesso!')
  }

  function toggleNotif(id: string) {
    setNotifPrefs(prev => ({ ...prev, [id]: !prev[id] }))
    toast.success('Preferência salva')
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div>
        <h2 className="text-sm font-medium text-ink-primary flex items-center gap-2">
          <Settings className="w-4 h-4 text-ink-tertiary" aria-hidden />
          Configurações
        </h2>
        <p className="text-xs text-ink-secondary mt-0.5">
          Perfil · Notificações · Equipe · Sistema
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar tabs */}
        <div className="md:w-44 flex-shrink-0">
          <nav className="card p-1 flex flex-row md:flex-col gap-0.5">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded text-xs text-left w-full transition-colors',
                    activeTab === tab.id
                      ? 'bg-brand-blue text-white font-medium'
                      : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-secondary'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">

          {/* PERFIL */}
          {activeTab === 'perfil' && (
            <div className="card">
              <h3 className="text-xs font-medium text-ink-primary mb-4">Informações pessoais</h3>

              {/* Avatar section */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-surface-border">
                <Avatar nome={profile?.nome} avatarUrl={profile?.avatar_url} size="lg" />
                <div>
                  <p className="text-sm font-medium text-ink-primary">{profile?.nome}</p>
                  <p className="text-[10px] text-ink-secondary">{formatRoleLabel(profile?.role)}</p>
                  {profile?.perfil && (
                    <div className="mt-1">
                      <ProfilePill perfil={profile.perfil as PerfilConsultor} />
                    </div>
                  )}
                  <button className="text-[10px] text-brand-blue hover:underline mt-1">
                    Alterar foto
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-medium text-ink-secondary block mb-1.5">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-ink-secondary block mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={profile?.email ?? ''}
                    disabled
                    className="form-input opacity-50 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-ink-secondary block mb-1.5">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={cargo}
                    onChange={e => setCargo(e.target.value)}
                    className="form-input"
                    placeholder="Ex: Coordenador Comercial"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-ink-secondary block mb-1.5">
                    Função no sistema
                  </label>
                  <div className="form-input opacity-50 cursor-not-allowed text-xs">
                    {formatRoleLabel(profile?.role)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-border">
                <button
                  onClick={() => signOut()}
                  className="btn btn-ghost text-status-danger border-status-danger/30 hover:bg-status-danger-bg"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden />
                  Sair da conta
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  <Save className="w-3.5 h-3.5" aria-hidden />
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICAÇÕES */}
          {activeTab === 'notificacoes' && (
            <div className="card">
              <h3 className="text-xs font-medium text-ink-primary mb-1">Preferências de notificação</h3>
              <p className="text-[10px] text-ink-secondary mb-4">
                Controle quando e como você recebe alertas do FTD Nexus
              </p>
              <div className="flex flex-col divide-y divide-surface-border">
                {NOTIFICATION_ITEMS.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex-1 mr-4">
                      <p className="text-xs font-medium text-ink-primary">{item.label}</p>
                      <p className="text-[10px] text-ink-secondary mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={notifPrefs[item.id]}
                      onClick={() => toggleNotif(item.id)}
                      className={cn(
                        'relative w-8 h-4 rounded-full transition-colors flex-shrink-0',
                        notifPrefs[item.id] ? 'bg-brand-blue' : 'bg-surface-border'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform',
                          notifPrefs[item.id] ? 'translate-x-4' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EQUIPE */}
          {activeTab === 'equipe' && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-medium text-ink-primary">Membros da equipe</h3>
                <button className="btn btn-primary">
                  <span>+ Convidar</span>
                </button>
              </div>
              {teamLoading ? (
                <Skeleton className="h-40" />
              ) : (
                <div className="flex flex-col divide-y divide-surface-border">
                  {teamMembers?.map(member => (
                    <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <Avatar nome={member.nome} avatarUrl={member.avatar_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink-primary truncate">{member.nome}</p>
                        <p className="text-[9px] text-ink-secondary">{member.email}</p>
                      </div>
                      {member.perfil && <ProfilePill perfil={member.perfil as PerfilConsultor} />}
                      <StatusBadge status="neutral">{formatRoleLabel(member.role)}</StatusBadge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SISTEMA */}
          {activeTab === 'sistema' && (
            <div className="flex flex-col gap-4">
              <div className="card">
                <h3 className="text-xs font-medium text-ink-primary mb-3">Sobre o sistema</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Versão', '1.0.0'],
                    ['Ambiente', 'Production'],
                    ['Banco de dados', 'Supabase PostgreSQL'],
                    ['Realtime', 'WebSockets ativo'],
                    ['PWA', 'Instalável'],
                    ['Última sincronização', 'Agora'],
                  ].map(([label, value]) => (
                    <div key={label} className="p-2.5 bg-surface-secondary rounded-lg">
                      <p className="text-[9px] text-ink-tertiary uppercase tracking-wide">{label}</p>
                      <p className="text-xs font-medium text-ink-primary mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 className="text-xs font-medium text-ink-primary mb-3">Instalar como app (PWA)</h3>
                <p className="text-[10px] text-ink-secondary mb-3">
                  O FTD Nexus pode ser instalado diretamente no seu dispositivo para acesso offline e notificações push.
                </p>
                <div className="flex gap-2">
                  <button className="btn btn-primary">
                    Instalar no dispositivo
                  </button>
                  <button className="btn btn-ghost">
                    Como instalar?
                  </button>
                </div>
              </div>
              <div className="card border-status-danger/20">
                <h3 className="text-xs font-medium text-status-danger-text mb-3">Zona de risco</h3>
                <p className="text-[10px] text-ink-secondary mb-3">
                  Ações irreversíveis. Use com cuidado.
                </p>
                <div className="flex gap-2">
                  <button className="btn btn-ghost text-status-danger border-status-danger/30 hover:bg-status-danger-bg">
                    Limpar cache local
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
