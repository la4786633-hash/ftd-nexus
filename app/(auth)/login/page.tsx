'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Bolt, Target, Kanban, Users, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { cn } from '@/lib/utils/cn'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

const magicLinkSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

type LoginForm = z.infer<typeof loginSchema>
type MagicLinkForm = z.infer<typeof magicLinkSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/war-room'
  const { signIn, signInWithMagicLink } = useAuth()

  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const { register: regMagic, handleSubmit: handleMagic, formState: { errors: magicErrors, isSubmitting: magicSubmitting } } = useForm<MagicLinkForm>({
    resolver: zodResolver(magicLinkSchema),
  })

  async function onSubmit(data: LoginForm) {
    setError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setError('E-mail ou senha incorretos. Tente novamente.')
      return
    }
    router.push(redirect)
    router.refresh()
  }

  async function onMagicLink(data: MagicLinkForm) {
    setError(null)
    const { error } = await signInWithMagicLink(data.email)
    if (error) {
      setError('Não foi possível enviar o link. Verifique o e-mail.')
      return
    }
    setMagicSent(true)
  }

  return (
    <div className="min-h-dvh bg-surface-page flex items-center justify-center p-4">
      <div className="w-full max-w-3xl flex rounded-2xl overflow-hidden border border-surface-border shadow-dropdown">
        {/* Brand Panel */}
        <div className="hidden md:flex w-72 flex-shrink-0 bg-brand-navy flex-col p-7">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
              <Bolt className="w-4 h-4 text-white" aria-hidden />
            </div>
            <div>
              <p className="text-base font-medium text-white">FTD Nexus</p>
              <p className="text-[10px] text-[#7A8BA4]">4DX + COBRA · 2027</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            <div className="p-3.5 bg-brand-blue/20 rounded-lg border border-brand-blue/30">
              <div className="flex items-center gap-2 mb-1.5">
                <Target className="w-3.5 h-3.5 text-[#7EB3FF]" aria-hidden />
                <span className="text-sm font-medium text-[#7EB3FF]">4DX — Metas</span>
              </div>
              <p className="text-[10px] text-[#7A8BA4] leading-relaxed">
                WIGs, Lead Measures, Scoreboard e Cadência semanal
              </p>
            </div>

            <div className="p-3.5 bg-brand-coral/10 rounded-lg border border-brand-coral/20">
              <div className="flex items-center gap-2 mb-1.5">
                <Kanban className="w-3.5 h-3.5 text-[#FF9E85]" aria-hidden />
                <span className="text-sm font-medium text-[#FF9E85]">COBRA Pipeline</span>
              </div>
              <p className="text-[10px] text-[#7A8BA4] leading-relaxed">
                Gestão de escolas, pipeline e avaliação de competências
              </p>
            </div>

            <div className="p-3.5 bg-status-ok/10 rounded-lg border border-status-ok/20">
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="w-3.5 h-3.5 text-[#5DCAA5]" aria-hidden />
                <span className="text-sm font-medium text-[#5DCAA5]">Regional Centro-Norte</span>
              </div>
              <p className="text-[10px] text-[#7A8BA4] leading-relaxed">
                4 coordenadores · 20 consultores · Tempo real
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-3 gap-2">
            {[
              { value: '20', label: 'Consultores' },
              { value: '4', label: 'Times' },
              { value: '100%', label: 'Online' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-base font-medium text-white">{stat.value}</p>
                <p className="text-[9px] text-[#4A5568]">{stat.label}</p>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-[#4A5568] text-center mt-4">
            FTD Educação · Sistema Exclusivo
          </p>
        </div>

        {/* Form Panel */}
        <div className="flex-1 bg-white p-7 flex flex-col justify-center">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1 md:hidden">
              <Bolt className="w-5 h-5 text-brand-blue" aria-hidden />
              <span className="font-medium text-ink-primary">FTD Nexus</span>
            </div>
            <h1 className="text-xl font-medium text-ink-primary">Bem-vindo de volta</h1>
            <p className="text-xs text-ink-secondary mt-1">
              Entre com suas credenciais FTD Educação
            </p>
          </div>

          {/* Mode switcher */}
          <div className="flex gap-1 mb-5 p-1 bg-surface-page rounded-lg">
            <button
              type="button"
              onClick={() => setMode('password')}
              className={cn(
                'flex-1 py-1.5 text-xs rounded-md transition-all',
                mode === 'password'
                  ? 'bg-white text-ink-primary shadow-card font-medium'
                  : 'text-ink-secondary hover:text-ink-primary'
              )}
            >
              Senha
            </button>
            <button
              type="button"
              onClick={() => setMode('magic')}
              className={cn(
                'flex-1 py-1.5 text-xs rounded-md transition-all',
                mode === 'magic'
                  ? 'bg-white text-ink-primary shadow-card font-medium'
                  : 'text-ink-secondary hover:text-ink-primary'
              )}
            >
              Magic Link
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-status-danger-bg border border-status-danger/20 rounded-lg text-xs text-status-danger-text" role="alert">
              {error}
            </div>
          )}

          {mode === 'password' ? (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="mb-3">
                <label className="form-label" htmlFor="email">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" aria-hidden />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@ftd.com.br"
                    className={cn('form-input pl-8', errors.email && 'border-status-danger')}
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="form-label" htmlFor="password">Senha</label>
                  <button
                    type="button"
                    className="text-[10px] text-brand-blue hover:underline"
                    onClick={() => setMode('magic')}
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" aria-hidden />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={cn('form-input pl-8 pr-8', errors.password && 'border-status-danger')}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-secondary"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" aria-hidden /> : <Eye className="w-3.5 h-3.5" aria-hidden />}
                  </button>
                </div>
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full justify-center py-2.5 text-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                ) : (
                  <>Entrar no sistema <ArrowRight className="w-3.5 h-3.5" aria-hidden /></>
                )}
              </button>
            </form>
          ) : magicSent ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-status-ok-bg rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-5 h-5 text-status-ok" aria-hidden />
              </div>
              <p className="text-sm font-medium text-ink-primary mb-1">Link enviado!</p>
              <p className="text-xs text-ink-secondary">
                Verifique seu e-mail e clique no link para entrar.
              </p>
              <button
                type="button"
                onClick={() => setMagicSent(false)}
                className="btn-ghost btn mt-4 mx-auto"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagic(onMagicLink)} noValidate>
              <p className="text-xs text-ink-secondary mb-4 leading-relaxed">
                Informe seu e-mail e enviaremos um link de acesso seguro. Não precisa de senha.
              </p>
              <div className="mb-5">
                <label className="form-label" htmlFor="magic-email">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" aria-hidden />
                  <input
                    id="magic-email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@ftd.com.br"
                    className={cn('form-input pl-8', magicErrors.email && 'border-status-danger')}
                    {...regMagic('email')}
                  />
                </div>
                {magicErrors.email && <p className="form-error">{magicErrors.email.message}</p>}
              </div>
              <button
                type="submit"
                disabled={magicSubmitting}
                className="btn-primary w-full justify-center py-2.5 text-sm"
              >
                {magicSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                ) : (
                  <>Enviar magic link <Mail className="w-3.5 h-3.5" aria-hidden /></>
                )}
              </button>
            </form>
          )}

          <p className="text-[10px] text-ink-tertiary text-center mt-6">
            Uso exclusivo FTD Educação · Dados protegidos
          </p>
        </div>
      </div>
    </div>
  )
}
