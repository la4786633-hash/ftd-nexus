'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/providers/AuthProvider'
import { toast } from 'sonner'
import type {
  CobraEtapa, CobraEscola, CobraOportunidade, CobraOportunidadeWithRelations,
  CobraAtividade, CobraAvaliacao, CobraAvaliacaoWithNotas, CobraCriterio,
  PipelineFunnel, CreateEscolaForm, CreateOportunidadeForm,
  CreateAtividadeForm, SaveCobraAvaliacaoForm, AgendaSemanal
} from '@/lib/supabase/types'
import { getCurrentWeek, getCurrentMonth, getCurrentYear } from '@/lib/utils/dates'

const supabase = getSupabaseClient()

// ============================================================
// PIPELINE STAGES
// ============================================================

export function useCobraEtapas() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['cobra-etapas', profile?.grupo_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cobra_etapas')
        .select('*')
        .or(`grupo_id.is.null,grupo_id.eq.${profile?.grupo_id}`)
        .eq('ativo', true)
        .order('ordem')
      if (error) throw error
      return data as CobraEtapa[]
    },
    enabled: !!profile,
    staleTime: 10 * 60 * 1000,
  })
}

// ============================================================
// PIPELINE KANBAN
// ============================================================

export function usePipelineKanban() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['pipeline-kanban', profile?.grupo_id],
    queryFn: async () => {
      if (!profile?.grupo_id) return []
      const { data, error } = await supabase
        .from('cobra_oportunidades')
        .select(`
          *,
          escola:escola_id(id, nome, cidade, uf, segmento, porte),
          etapa:etapa_id(id, nome, ordem, cor_hex),
          consultor:consultor_id(id, nome, perfil, avatar_url)
        `)
        .eq('grupo_id', profile.grupo_id)
        .eq('status', 'ativo')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as CobraOportunidadeWithRelations[]
    },
    enabled: !!profile?.grupo_id,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

export function usePipelineFunnel() {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['pipeline-funnel', profile?.grupo_id],
    queryFn: async () => {
      if (!profile?.grupo_id) return []
      const { data, error } = await supabase
        .from('v_pipeline_funnel')
        .select('*')
        .eq('grupo_id', profile.grupo_id)
        .order('ordem')
      if (error) throw error
      return data as PipelineFunnel[]
    },
    enabled: !!profile?.grupo_id,
    staleTime: 60 * 1000,
  })
}

export function useCreateOportunidade() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (form: CreateOportunidadeForm) => {
      const { data, error } = await supabase
        .from('cobra_oportunidades')
        .insert({ ...form, consultor_id: profile?.id, criado_por: profile?.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-kanban'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-funnel'] })
      toast.success('Oportunidade criada!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useMoveOportunidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      oppId, novaEtapaId, observacao
    }: { oppId: string; novaEtapaId: string; observacao?: string }) => {
      const { error } = await supabase
        .rpc('move_oportunidade_etapa', {
          p_opp_id: oppId,
          p_nova_etapa_id: novaEtapaId,
          p_observacao: observacao,
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-kanban'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-funnel'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateOportunidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CobraOportunidade> & { id: string }) => {
      const { data, error } = await supabase
        .from('cobra_oportunidades')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-kanban'] })
      toast.success('Oportunidade atualizada!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useCloseOportunidade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id, status, motivo_perda
    }: { id: string; status: 'ganho' | 'perdido'; motivo_perda?: string }) => {
      const { data, error } = await supabase
        .from('cobra_oportunidades')
        .update({ status, motivo_perda, data_fechamento: new Date().toISOString().split('T')[0] })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-kanban'] })
      queryClient.invalidateQueries({ queryKey: ['pipeline-funnel'] })
      toast.success(vars.status === 'ganho' ? '🎉 Oportunidade ganha!' : 'Oportunidade encerrada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ============================================================
// SCHOOLS / CRM
// ============================================================

export function useEscolas(search?: string) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['escolas', profile?.grupo_id, search],
    queryFn: async () => {
      if (!profile?.grupo_id) return []
      let query = supabase
        .from('cobra_escolas')
        .select('*')
        .eq('grupo_id', profile.grupo_id)
        .order('nome')

      if (search && search.length >= 2) {
        query = query.ilike('nome', `%${search}%`)
      }

      if (profile.role === 'consultor') {
        query = query.eq('consultor_id', profile.id)
      }

      const { data, error } = await query.limit(100)
      if (error) throw error
      return data as CobraEscola[]
    },
    enabled: !!profile?.grupo_id,
    staleTime: 2 * 60 * 1000,
  })
}

export function useEscola(id?: string) {
  return useQuery({
    queryKey: ['escola', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('cobra_escolas')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as CobraEscola
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateEscola() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (form: CreateEscolaForm) => {
      const { data, error } = await supabase
        .from('cobra_escolas')
        .insert(form)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escolas'] })
      toast.success('Escola cadastrada!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateEscola() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CobraEscola> & { id: string }) => {
      const { data, error } = await supabase
        .from('cobra_escolas')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['escolas'] })
      queryClient.invalidateQueries({ queryKey: ['escola', data.id] })
      toast.success('Escola atualizada!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ============================================================
// ACTIVITIES
// ============================================================

export function useAtividades(escolaId?: string) {
  const { profile } = useAuth()

  return useQuery({
    queryKey: ['atividades', escolaId ?? profile?.id],
    queryFn: async () => {
      let query = supabase
        .from('cobra_atividades')
        .select('*, usuario:usuario_id(id, nome, perfil, avatar_url)')
        .order('data_atividade', { ascending: false })
        .limit(50)

      if (escolaId) {
        query = query.eq('escola_id', escolaId)
      } else {
        query = query.eq('usuario_id', profile?.id)
      }

      const { data, error } = await query
      if (error) throw error
      return data as (CobraAtividade & { usuario: any })[]
    },
    enabled: !!profile,
    staleTime: 60 * 1000,
  })
}

export function useCreateAtividade() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (form: CreateAtividadeForm) => {
      const { data, error } = await supabase
        .from('cobra_atividades')
        .insert({ ...form, usuario_id: profile?.id })
        .select()
        .single()
      if (error) throw error

      // If activity generated opportunity, create one automatically
      if (form.gerou_oportunidade && form.escola_id) {
        const etapas = await supabase
          .from('cobra_etapas')
          .select('id')
          .is('grupo_id', null)
          .order('ordem')
          .limit(1)
          .single()

        if (etapas.data) {
          await supabase.from('cobra_oportunidades').insert({
            escola_id: form.escola_id,
            etapa_id: etapas.data.id,
            titulo: `Opp. via atividade: ${form.titulo}`,
            consultor_id: profile?.id,
            grupo_id: profile?.grupo_id,
            criado_por: profile?.id,
            origem_agenda: true,
          })
        }
      }

      return data
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['atividades'] })
      if (vars.escola_id) {
        queryClient.invalidateQueries({ queryKey: ['atividades', vars.escola_id] })
      }
      if (vars.gerou_oportunidade) {
        queryClient.invalidateQueries({ queryKey: ['pipeline-kanban'] })
        toast.success('Atividade e oportunidade criadas!')
      } else {
        toast.success('Atividade registrada!')
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ============================================================
// COBRA EVALUATIONS
// ============================================================

export function useCobraCriterios(perfil?: string) {
  return useQuery({
    queryKey: ['cobra-criterios', perfil],
    queryFn: async () => {
      let query = supabase.from('cobra_criterios').select('*').eq('ativo', true).order('ordem')
      if (perfil) query = query.eq('perfil', perfil)
      const { data, error } = await query
      if (error) throw error
      return data as CobraCriterio[]
    },
    staleTime: 30 * 60 * 1000,
  })
}

export function useCobraAvaliacoes(consultorId?: string) {
  const { profile } = useAuth()
  const targetId = consultorId ?? profile?.id

  return useQuery({
    queryKey: ['cobra-avaliacoes', targetId],
    queryFn: async () => {
      if (!targetId) return []
      const { data, error } = await supabase
        .from('v_cobra_summary')
        .select('*')
        .eq('consultor_id', targetId)
        .order('ano_ref', { ascending: false })
        .order('mes_ref', { ascending: false })
        .limit(12)
      if (error) throw error
      return data as CobraAvaliacaoWithNotas[]
    },
    enabled: !!targetId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLatestCobraAvaliacao(consultorId?: string) {
  const { profile } = useAuth()
  const targetId = consultorId ?? profile?.id

  return useQuery({
    queryKey: ['cobra-latest', targetId],
    queryFn: async () => {
      if (!targetId) return null
      const { data, error } = await supabase
        .from('v_cobra_summary')
        .select('*')
        .eq('consultor_id', targetId)
        .order('ano_ref', { ascending: false })
        .order('mes_ref', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as CobraAvaliacaoWithNotas | null
    },
    enabled: !!targetId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSaveCobraAvaliacao() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (form: SaveCobraAvaliacaoForm) => {
      // Upsert evaluation
      const { data: avaliacao, error: errAval } = await supabase
        .from('cobra_avaliacoes')
        .upsert(
          {
            consultor_id: form.consultor_id,
            grupo_id: form.grupo_id,
            avaliado_por: profile?.id,
            mes_ref: form.mes_ref,
            ano_ref: form.ano_ref,
            observacoes: form.observacoes,
            plano_acao: form.plano_acao,
            lead_sugerido: form.lead_sugerido,
          },
          { onConflict: 'consultor_id,mes_ref,ano_ref' }
        )
        .select()
        .single()

      if (errAval) throw errAval

      // Upsert notes
      const notesToInsert = form.notas.map(n => ({
        avaliacao_id: avaliacao.id,
        criterio_id: n.criterio_id,
        nota: n.nota,
        observacao: n.observacao,
      }))

      const { error: errNotas } = await supabase
        .from('cobra_avaliacoes_notas')
        .upsert(notesToInsert, { onConflict: 'avaliacao_id,criterio_id' })

      if (errNotas) throw errNotas
      return avaliacao
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobra-avaliacoes'] })
      queryClient.invalidateQueries({ queryKey: ['cobra-latest'] })
      queryClient.invalidateQueries({ queryKey: ['team-dashboard'] })
      toast.success('Avaliação COBRA salva!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

// ============================================================
// AGENDA SEMANAL
// ============================================================

export function useAgendaSemanal(semana?: number, mes?: number, ano?: number) {
  const { profile } = useAuth()
  const s = semana ?? getCurrentWeek()
  const m = mes ?? getCurrentMonth()
  const a = ano ?? getCurrentYear()

  return useQuery({
    queryKey: ['agenda', profile?.grupo_id, s, m, a],
    queryFn: async () => {
      if (!profile?.grupo_id) return []
      let query = supabase
        .from('agenda_semanal')
        .select(`
          *,
          consultor:consultor_id(id, nome, perfil, avatar_url),
          escola:escola_id(id, nome, cidade)
        `)
        .eq('grupo_id', profile.grupo_id)
        .eq('semana_num', s)
        .eq('mes_ref', m)
        .eq('ano_ref', a)
        .order('data_planejada', { ascending: true, nullsFirst: false })

      if (profile.role === 'consultor') {
        query = query.eq('consultor_id', profile.id)
      }

      const { data, error } = await query
      if (error) throw error
      return data as (AgendaSemanal & { consultor: any; escola: any })[]
    },
    enabled: !!profile?.grupo_id,
    staleTime: 60 * 1000,
  })
}

export function useCreateAgendaItem() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (form: Omit<AgendaSemanal, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('agenda_semanal')
        .insert({ ...form, consultor_id: form.consultor_id ?? profile?.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda'] })
      toast.success('Item adicionado à agenda!')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateAgendaItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AgendaSemanal> & { id: string }) => {
      const { data, error } = await supabase
        .from('agenda_semanal')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
