// ============================================================
// FTD NEXUS — Custom Hooks
// useTeam, useWIGs, useLeadMeasures, useScoreboard, useCadencias
// ============================================================

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import type {
  Profile, WIG, WIGWithConsultor, LeadMeasure, LeadMeasureWithRegistros,
  LeadRegistro, ScoreboardSemana, Cadencia, CadenciaWithCompromissos,
  CadenciaCompromisso, TeamDashboardRow, ScoreboardHistory,
  CreateWIGForm, CreateLeadMeasureForm, RegisterLeadForm,
  CreateCadenciaForm, AddCompromissoForm, UpdateCompromissoForm
} from '@/lib/supabase/types'
import { getCurrentWeek, getCurrentMonth, getCurrentYear } from '@/lib/utils/dates'
import { toast } from 'sonner'

const supabase = getSupabaseClient()

// ============================================================
// TEAM HOOKS
// ============================================================

export function useTeamMembers() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['team', profile?.grupo_id],
    queryFn: async () => {
      if (!profile?.grupo_id) return []
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('grupo_id', profile.grupo_id)
        .eq('ativo', true)
        .order('nome')
      if (error) throw error
      return data as Profile[]
    },
    enabled: !!profile?.grupo_id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useTeamDashboard() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['team-dashboard', profile?.grupo_id],
    queryFn: async () => {
      if (!profile?.grupo_id) return []
      const { data, error } = await supabase
        .from('v_team_dashboard')
        .select('*')
        .eq('grupo_id', profile.grupo_id)
      if (error) throw error
      return data as TeamDashboardRow[]
    },
    enabled: !!profile?.grupo_id,
    refetchInterval: 30 * 1000, // Refresh every 30s
  })
}

export function useRegionalDashboard() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['regional-dashboard', profile?.regional_id],
    queryFn: async () => {
      if (!profile?.regional_id) return []
      const { data, error } = await supabase
        .from('v_team_dashboard')
        .select('*')
        .eq('regional_id', profile.regional_id) // Note: this would need a join
      if (error) throw error
      return data as TeamDashboardRow[]
    },
    enabled: !!profile?.regional_id && ['admin', 'gerente'].includes(profile?.role ?? ''),
    staleTime: 60 * 1000,
  })
}

// ============================================================
// WIG HOOKS
// ============================================================

export function useWIGs(consultorId?: string) {
  const { profile } = useAuth()
  const targetId = consultorId ?? profile?.id

  return useQuery({
    queryKey: ['wigs', targetId],
    queryFn: async () => {
      if (!targetId) return []
      let query = supabase
        .from('wigs')
        .select(`
          *,
          consultor:consultor_id(id, nome, perfil, avatar_url)
        `)
        .order('data_fim', { ascending: true })

      if (profile?.role === 'consultor') {
        query = query.eq('consultor_id', targetId)
      } else {
        query = query.eq('grupo_id', profile?.grupo_id)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []).map(wig => ({
        ...wig,
        pct_mci: wig.meta_para > 0
          ? Math.round((wig.realizado / wig.meta_para) * 1000) / 10
          : 0
      })) as WIGWithConsultor[]
    },
    enabled: !!profile,
    staleTime: 2 * 60 * 1000,
  })
}

export function useActiveWIG(consultorId?: string) {
  const { profile } = useAuth()
  const targetId = consultorId ?? profile?.id

  return useQuery({
    queryKey: ['wig-active', targetId],
    queryFn: async () => {
      if (!targetId) return null
      const { data, error } = await supabase
        .from('wigs')
        .select('*, consultor:consultor_id(id, nome, perfil, avatar_url)')
        .eq('consultor_id', targetId)
        .eq('status', 'ativo')
        .order('data_fim', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      return {
        ...data,
        pct_mci: data.meta_para > 0
          ? Math.round((data.realizado / data.meta_para) * 1000) / 10
          : 0
      } as WIGWithConsultor
    },
    enabled: !!targetId,
    staleTime: 60 * 1000,
  })
}

export function useCreateWIG() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (form: CreateWIGForm) => {
      const { data, error } = await supabase
        .from('wigs')
        .insert({ ...form, grupo_id: profile?.grupo_id, criado_por: profile?.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wigs'] })
      queryClient.invalidateQueries({ queryKey: ['team-dashboard'] })
      toast.success('WIG criada com sucesso!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateWIG() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WIG> & { id: string }) => {
      const { data, error } = await supabase
        .from('wigs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wigs'] })
      queryClient.invalidateQueries({ queryKey: ['wig-active'] })
      queryClient.invalidateQueries({ queryKey: ['team-dashboard'] })
      toast.success('WIG atualizada!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateWIGRealizado() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, realizado }: { id: string; realizado: number }) => {
      const { data, error } = await supabase
        .from('wigs')
        .update({ realizado })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wigs'] })
      queryClient.invalidateQueries({ queryKey: ['wig-active'] })
      queryClient.invalidateQueries({ queryKey: ['team-dashboard'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ============================================================
// LEAD MEASURE HOOKS
// ============================================================

export function useLeadMeasures(wigId?: string) {
  return useQuery({
    queryKey: ['lead-measures', wigId],
    queryFn: async () => {
      if (!wigId) return []
      const { data, error } = await supabase
        .from('lead_measures')
        .select(`
          *,
          consultor:consultor_id(id, nome, perfil, avatar_url),
          registros:lead_registros(*)
        `)
        .eq('wig_id', wigId)
        .eq('ativo', true)
        .order('ordem')
      if (error) throw error
      return (data ?? []).map(lm => {
        const currentWeek = getCurrentWeek()
        const currentWeekRegistro = lm.registros?.find((r: LeadRegistro) =>
          r.semana_ref === currentWeek &&
          r.mes_ref === getCurrentMonth() &&
          r.ano_ref === getCurrentYear()
        )
        return {
          ...lm,
          pct_semana: currentWeekRegistro
            ? Math.min(Math.round((currentWeekRegistro.valor_realizado / lm.meta_periodo) * 100), 200)
            : 0
        }
      }) as LeadMeasureWithRegistros[]
    },
    enabled: !!wigId,
    staleTime: 60 * 1000,
  })
}

export function useCreateLeadMeasure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (form: CreateLeadMeasureForm) => {
      const { data, error } = await supabase
        .from('lead_measures')
        .insert(form)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['lead-measures', vars.wig_id] })
      toast.success('Medida de direção criada!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useRegisterLead() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (form: RegisterLeadForm) => {
      const { data, error } = await supabase
        .from('lead_registros')
        .upsert(
          {
            ...form,
            consultor_id: profile?.id,
            registrado_por: profile?.id,
          },
          { onConflict: 'lead_measure_id,periodo_inicio' }
        )
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-measures'] })
      queryClient.invalidateQueries({ queryKey: ['scoreboard'] })
      queryClient.invalidateQueries({ queryKey: ['team-dashboard'] })
      toast.success('Registro salvo!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ============================================================
// SCOREBOARD HOOKS
// ============================================================

export function useScoreboard(consultorId?: string, wigId?: string) {
  const { profile } = useAuth()
  const targetId = consultorId ?? profile?.id

  return useQuery({
    queryKey: ['scoreboard', targetId, wigId],
    queryFn: async () => {
      if (!targetId) return []
      let query = supabase
        .from('scoreboard_semanas')
        .select('*')
        .eq('consultor_id', targetId)
        .order('ano_ref', { ascending: false })
        .order('mes_ref', { ascending: false })
        .order('semana_num', { ascending: true })
        .limit(20)

      if (wigId) query = query.eq('wig_id', wigId)

      const { data, error } = await query
      if (error) throw error
      return data as ScoreboardSemana[]
    },
    enabled: !!targetId,
    staleTime: 30 * 1000,
  })
}

export function useTeamScoreboard() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['team-scoreboard', profile?.grupo_id],
    queryFn: async () => {
      if (!profile?.grupo_id) return []
      const { data, error } = await supabase
        .from('v_scoreboard_history')
        .select('*')
        .eq('grupo_id', profile.grupo_id)
        .gte('ano_ref', getCurrentYear())
        .order('consultor_nome')
        .order('ano_ref', { ascending: false })
        .order('mes_ref', { ascending: false })
        .order('semana_num', { ascending: true })
      if (error) throw error
      return data as ScoreboardHistory[]
    },
    enabled: !!profile?.grupo_id,
    staleTime: 30 * 1000,
  })
}

// ============================================================
// CADENCIA HOOKS
// ============================================================

export function useCadencias() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['cadencias', profile?.grupo_id],
    queryFn: async () => {
      if (!profile?.grupo_id) return []
      const { data, error } = await supabase
        .from('cadencias')
        .select(`
          *,
          facilitador:facilitador_id(id, nome, avatar_url),
          compromissos:cadencia_compromissos(
            *,
            consultor:consultor_id(id, nome, perfil, avatar_url)
          )
        `)
        .eq('grupo_id', profile.grupo_id)
        .order('data_sessao', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []).map(c => ({
        ...c,
        taxa_cumprimento: c.compromissos?.length > 0
          ? Math.round(
              (c.compromissos.filter((cc: CadenciaCompromisso) => cc.status === 'cumprido').length /
               c.compromissos.filter((cc: CadenciaCompromisso) => cc.status !== 'pendente').length || 0) * 100
            )
          : 0
      })) as CadenciaWithCompromissos[]
    },
    enabled: !!profile?.grupo_id,
    staleTime: 60 * 1000,
  })
}

export function useUpcomingCadencia() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['cadencia-upcoming', profile?.grupo_id],
    queryFn: async () => {
      if (!profile?.grupo_id) return null
      const { data, error } = await supabase
        .from('cadencias')
        .select(`
          *,
          facilitador:facilitador_id(id, nome),
          compromissos:cadencia_compromissos(
            *,
            consultor:consultor_id(id, nome, perfil, avatar_url)
          )
        `)
        .eq('grupo_id', profile.grupo_id)
        .gte('data_sessao', new Date().toISOString())
        .eq('status', 'agendada')
        .order('data_sessao', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as CadenciaWithCompromissos | null
    },
    enabled: !!profile?.grupo_id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCadencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (form: CreateCadenciaForm) => {
      const { data, error } = await supabase
        .from('cadencias')
        .insert(form)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadencias'] })
      queryClient.invalidateQueries({ queryKey: ['cadencia-upcoming'] })
      toast.success('Cadência criada!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateCadencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cadencia> & { id: string }) => {
      const { data, error } = await supabase
        .from('cadencias')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadencias'] })
      toast.success('Cadência atualizada!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useAddCompromisso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (form: AddCompromissoForm) => {
      const { data, error } = await supabase
        .from('cadencia_compromissos')
        .insert(form)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadencias'] })
      toast.success('Compromisso registrado!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateCompromisso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCompromissoForm) => {
      const { data, error } = await supabase
        .from('cadencia_compromissos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cadencias'] })
      toast.success('Compromisso atualizado!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
