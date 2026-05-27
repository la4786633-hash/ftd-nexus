// ============================================================
// FTD NEXUS — Database Types
// Auto-generated from Supabase schema
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'admin' | 'gerente' | 'coordenador' | 'consultor' | 'viewer'
export type PerfilConsultor = 'hibrido' | 'farmer' | 'hunter' | 'inside_sales'
export type WigStatus = 'ativo' | 'concluido' | 'cancelado' | 'pausado'
export type LeadTipo = 'quantidade' | 'percentual' | 'valor' | 'booleano'
export type LeadFrequencia = 'diario' | 'semanal' | 'quinzenal' | 'mensal'
export type PlacarStatus = 'verde' | 'vermelho' | 'pendente'
export type CadenciaStatus = 'agendada' | 'realizada' | 'cancelada'
export type CompromissoStatus = 'pendente' | 'cumprido' | 'nao_cumprido' | 'parcial'
export type OppStatus = 'ativo' | 'ganho' | 'perdido' | 'pausado'
export type AtividadeTipo = 'visita' | 'ligacao' | 'email' | 'reuniao' | 'proposta' | 'whatsapp' | 'outros'
export type AtividadeStatus = 'pendente' | 'realizada' | 'cancelada'
export type EscolaSegmento = 'fundamental' | 'medio' | 'tecnico' | 'superior' | 'integral'
export type EscolaPorte = 'pequeno' | 'medio' | 'grande'
export type NotifTipo = 'alerta_placar' | 'cadencia_pendente' | 'cobra_liberado' | 'meta_atingida' | 'risco_mci' | 'compromisso' | 'sistema'
export type AuditAcao = 'create' | 'update' | 'delete'

// ============================================================
// TABLE TYPES
// ============================================================

export interface Regional {
  id: string
  nome: string
  uf: string | null
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Grupo {
  id: string
  nome: string
  descricao: string | null
  regional_id: string
  cor_hex: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  nome: string
  cargo: string | null
  email: string
  avatar_url: string | null
  role: UserRole
  perfil: PerfilConsultor | null
  grupo_id: string | null
  regional_id: string | null
  ativo: boolean
  primeiro_acesso: boolean
  created_at: string
  updated_at: string
}

export interface WIG {
  id: string
  titulo: string
  descricao: string | null
  grupo_id: string
  consultor_id: string | null
  indicador_lag: string | null
  meta_de: number | null
  meta_para: number
  unidade: string
  realizado: number
  data_inicio: string
  data_fim: string
  status: WigStatus
  cor_hex: string | null
  criado_por: string
  created_at: string
  updated_at: string
}

export interface LeadMeasure {
  id: string
  wig_id: string
  consultor_id: string
  titulo: string
  descricao: string | null
  tipo: LeadTipo
  frequencia: LeadFrequencia
  meta_periodo: number
  ativo: boolean
  ordem: number
  created_at: string
  updated_at: string
}

export interface LeadRegistro {
  id: string
  lead_measure_id: string
  consultor_id: string
  valor_realizado: number
  valor_meta: number
  periodo_inicio: string
  periodo_fim: string
  semana_ref: number
  mes_ref: number
  ano_ref: number
  observacao: string | null
  registrado_por: string
  created_at: string
}

export interface ScoreboardSemana {
  id: string
  wig_id: string
  consultor_id: string
  grupo_id: string
  semana_num: number
  mes_ref: number
  ano_ref: number
  status: PlacarStatus
  pct_d2: number | null
  pct_mci: number | null
  observacao: string | null
  created_at: string
  updated_at: string
}

export interface Cadencia {
  id: string
  grupo_id: string
  titulo: string
  data_sessao: string
  duracao_minutos: number
  status: CadenciaStatus
  facilitador_id: string
  ata: string | null
  link_virtual: string | null
  taxa_cumprimento: number | null
  semana_num: number | null
  mes_ref: number | null
  ano_ref: number | null
  created_at: string
  updated_at: string
}

export interface CadenciaCompromisso {
  id: string
  cadencia_id: string
  consultor_id: string
  compromisso: string
  status: CompromissoStatus
  resultado: string | null
  obstaculo: string | null
  novo_compromisso: string | null
  data_prazo: string | null
  proxima_cadencia_id: string | null
  created_at: string
  updated_at: string
}

export interface CobraEtapa {
  id: string
  nome: string
  descricao: string | null
  ordem: number
  cor_hex: string
  icone: string | null
  grupo_id: string | null
  ativo: boolean
  created_at: string
}

export interface CobraEscola {
  id: string
  nome: string
  cnpj: string | null
  cidade: string | null
  uf: string | null
  cep: string | null
  endereco: string | null
  segmento: EscolaSegmento | null
  porte: EscolaPorte | null
  numero_alunos: number | null
  contato_nome: string | null
  contato_cargo: string | null
  contato_email: string | null
  contato_telefone: string | null
  contato_whatsapp: string | null
  consultor_id: string | null
  grupo_id: string
  tags: string[]
  observacoes: string | null
  ultima_visita: string | null
  created_at: string
  updated_at: string
}

export interface CobraOportunidade {
  id: string
  escola_id: string
  etapa_id: string
  titulo: string
  descricao: string | null
  valor_estimado: number | null
  probabilidade: number
  data_prevista: string | null
  consultor_id: string
  grupo_id: string
  status: OppStatus
  motivo_perda: string | null
  data_fechamento: string | null
  origem_agenda: boolean
  criado_por: string
  created_at: string
  updated_at: string
}

export interface CobraHistoricoEtapa {
  id: string
  oportunidade_id: string
  etapa_anterior_id: string | null
  etapa_nova_id: string
  usuario_id: string
  observacao: string | null
  tempo_na_etapa_dias: number | null
  created_at: string
}

export interface CobraAtividade {
  id: string
  oportunidade_id: string | null
  escola_id: string
  tipo: AtividadeTipo
  titulo: string
  descricao: string | null
  data_atividade: string
  data_proximo_passo: string | null
  gerou_oportunidade: boolean
  status: AtividadeStatus
  usuario_id: string
  cidade: string | null
  created_at: string
  updated_at: string
}

export interface CobraCriterio {
  id: string
  perfil: PerfilConsultor
  nome: string
  descricao: string | null
  icone: string | null
  ordem: number
  ativo: boolean
  created_at: string
}

export interface CobraAvaliacao {
  id: string
  consultor_id: string
  grupo_id: string
  avaliado_por: string
  mes_ref: number
  ano_ref: number
  total_pontos: number | null
  nivel: string | null
  observacoes: string | null
  plano_acao: string | null
  lead_sugerido: string | null
  created_at: string
  updated_at: string
}

export interface CobraAvaliacaoNota {
  id: string
  avaliacao_id: string
  criterio_id: string
  nota: number
  observacao: string | null
  created_at: string
}

export interface AgendaSemanal {
  id: string
  consultor_id: string
  grupo_id: string
  escola_id: string | null
  escola_nome: string | null
  cidade: string | null
  tipo_acao: AtividadeTipo
  objetivo: string | null
  semana_num: number
  mes_ref: number
  ano_ref: number
  data_planejada: string | null
  gerou_opp: boolean | null
  resultado: string | null
  proximo_passo: string | null
  status: AtividadeStatus
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  tipo: NotifTipo
  titulo: string
  mensagem: string | null
  lida: boolean
  link: string | null
  dados: Json | null
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string | null
  tabela: string
  registro_id: string | null
  acao: AuditAcao
  dados_anteriores: Json | null
  dados_novos: Json | null
  ip: string | null
  user_agent: string | null
  created_at: string
}

// ============================================================
// JOINED / ENRICHED TYPES
// ============================================================

export interface WIGWithConsultor extends WIG {
  consultor: Pick<Profile, 'id' | 'nome' | 'perfil' | 'avatar_url'> | null
  pct_mci: number
  lead_measures?: LeadMeasure[]
}

export interface LeadMeasureWithRegistros extends LeadMeasure {
  registros: LeadRegistro[]
  consultor: Pick<Profile, 'id' | 'nome' | 'perfil'>
  pct_semana: number
}

export interface CadenciaWithCompromissos extends Cadencia {
  compromissos: (CadenciaCompromisso & {
    consultor: Pick<Profile, 'id' | 'nome' | 'avatar_url' | 'perfil'>
  })[]
  facilitador: Pick<Profile, 'id' | 'nome'>
  taxa_cumprimento: number
}

export interface CobraOportunidadeWithRelations extends CobraOportunidade {
  escola: Pick<CobraEscola, 'id' | 'nome' | 'cidade' | 'uf' | 'segmento' | 'porte'>
  etapa: CobraEtapa
  consultor: Pick<Profile, 'id' | 'nome' | 'perfil' | 'avatar_url'>
}

export interface CobraAvaliacaoWithNotas extends CobraAvaliacao {
  notas: (CobraAvaliacaoNota & { criterio: CobraCriterio })[]
  consultor: Pick<Profile, 'id' | 'nome' | 'perfil' | 'avatar_url'>
}

export interface TeamDashboardRow {
  consultor_id: string
  consultor_nome: string
  perfil: PerfilConsultor | null
  grupo_id: string
  grupo_nome: string
  wig_id: string | null
  wig_titulo: string | null
  wig_meta: number | null
  wig_realizado: number | null
  pct_mci: number
  wig_prazo: string | null
  cobra_total: number | null
  cobra_nivel: string | null
  cobra_mes: number | null
  cobra_ano: number | null
  pct_d4: number
  status_mci: 'atingido' | 'no_caminho' | 'atencao' | 'critico' | 'sem_meta'
}

export interface ScoreboardHistory {
  consultor_id: string
  wig_id: string
  grupo_id: string
  semana_num: number
  mes_ref: number
  ano_ref: number
  status: PlacarStatus
  pct_d2: number | null
  pct_mci: number | null
  consultor_nome: string
  perfil: PerfilConsultor | null
  wig_titulo: string
}

export interface PipelineFunnel {
  etapa_id: string
  etapa_nome: string
  ordem: number
  cor_hex: string
  grupo_id: string | null
  total_opps: number
  valor_total: number
  probabilidade_media: number
}

// ============================================================
// FORM TYPES
// ============================================================

export interface CreateWIGForm {
  titulo: string
  descricao?: string
  consultor_id: string
  indicador_lag: string
  meta_de?: number
  meta_para: number
  unidade: string
  data_inicio: string
  data_fim: string
  cor_hex?: string
}

export interface CreateLeadMeasureForm {
  wig_id: string
  consultor_id: string
  titulo: string
  descricao?: string
  tipo: LeadTipo
  frequencia: LeadFrequencia
  meta_periodo: number
  ordem?: number
}

export interface RegisterLeadForm {
  lead_measure_id: string
  valor_realizado: number
  periodo_inicio: string
  periodo_fim: string
  semana_ref: number
  mes_ref: number
  ano_ref: number
  observacao?: string
}

export interface CreateCadenciaForm {
  grupo_id: string
  titulo?: string
  data_sessao: string
  duracao_minutos?: number
  link_virtual?: string
  semana_num?: number
  mes_ref?: number
  ano_ref?: number
}

export interface AddCompromissoForm {
  cadencia_id: string
  consultor_id: string
  compromisso: string
  data_prazo?: string
}

export interface UpdateCompromissoForm {
  id: string
  status: CompromissoStatus
  resultado?: string
  obstaculo?: string
  novo_compromisso?: string
}

export interface CreateEscolaForm {
  nome: string
  cnpj?: string
  cidade?: string
  uf?: string
  cep?: string
  endereco?: string
  segmento?: EscolaSegmento
  porte?: EscolaPorte
  numero_alunos?: number
  contato_nome?: string
  contato_cargo?: string
  contato_email?: string
  contato_telefone?: string
  contato_whatsapp?: string
  grupo_id: string
  tags?: string[]
  observacoes?: string
}

export interface CreateOportunidadeForm {
  escola_id: string
  etapa_id: string
  titulo: string
  descricao?: string
  valor_estimado?: number
  probabilidade?: number
  data_prevista?: string
  grupo_id: string
}

export interface CreateAtividadeForm {
  escola_id: string
  oportunidade_id?: string
  tipo: AtividadeTipo
  titulo: string
  descricao?: string
  data_atividade: string
  data_proximo_passo?: string
  gerou_oportunidade?: boolean
  cidade?: string
}

export interface SaveCobraAvaliacaoForm {
  consultor_id: string
  grupo_id: string
  mes_ref: number
  ano_ref: number
  observacoes?: string
  plano_acao?: string
  lead_sugerido?: string
  notas: { criterio_id: string; nota: number; observacao?: string }[]
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}
