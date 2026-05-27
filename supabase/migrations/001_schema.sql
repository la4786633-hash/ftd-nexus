-- ============================================================
-- FTD NEXUS — 4DX + COBRA Platform
-- Migration: 001_schema.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'gerente', 'coordenador', 'consultor', 'viewer');
CREATE TYPE perfil_consultor AS ENUM ('hibrido', 'farmer', 'hunter', 'inside_sales');
CREATE TYPE wig_status AS ENUM ('ativo', 'concluido', 'cancelado', 'pausado');
CREATE TYPE lead_tipo AS ENUM ('quantidade', 'percentual', 'valor', 'booleano');
CREATE TYPE lead_frequencia AS ENUM ('diario', 'semanal', 'quinzenal', 'mensal');
CREATE TYPE placar_status AS ENUM ('verde', 'vermelho', 'pendente');
CREATE TYPE cadencia_status AS ENUM ('agendada', 'realizada', 'cancelada');
CREATE TYPE compromisso_status AS ENUM ('pendente', 'cumprido', 'nao_cumprido', 'parcial');
CREATE TYPE opp_status AS ENUM ('ativo', 'ganho', 'perdido', 'pausado');
CREATE TYPE atividade_tipo AS ENUM ('visita', 'ligacao', 'email', 'reuniao', 'proposta', 'whatsapp', 'outros');
CREATE TYPE atividade_status AS ENUM ('pendente', 'realizada', 'cancelada');
CREATE TYPE escola_segmento AS ENUM ('fundamental', 'medio', 'tecnico', 'superior', 'integral');
CREATE TYPE escola_porte AS ENUM ('pequeno', 'medio', 'grande');
CREATE TYPE notif_tipo AS ENUM ('alerta_placar', 'cadencia_pendente', 'cobra_liberado', 'meta_atingida', 'risco_mci', 'compromisso', 'sistema');
CREATE TYPE audit_acao AS ENUM ('create', 'update', 'delete');

-- ============================================================
-- ORGANIZATIONAL STRUCTURE
-- ============================================================

CREATE TABLE IF NOT EXISTS regionais (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  uf          TEXT,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grupos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome         TEXT NOT NULL,
  descricao    TEXT,
  regional_id  UUID NOT NULL REFERENCES regionais(id) ON DELETE CASCADE,
  cor_hex      TEXT NOT NULL DEFAULT '#1565C0',
  ativo        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome         TEXT NOT NULL,
  cargo        TEXT,
  email        TEXT NOT NULL,
  avatar_url   TEXT,
  role         user_role NOT NULL DEFAULT 'consultor',
  perfil       perfil_consultor,
  grupo_id     UUID REFERENCES grupos(id) ON DELETE SET NULL,
  regional_id  UUID REFERENCES regionais(id) ON DELETE SET NULL,
  ativo        BOOLEAN NOT NULL DEFAULT true,
  primeiro_acesso BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4DX — DISCIPLINE 1: WIGs / MCIs
-- ============================================================

CREATE TABLE IF NOT EXISTS wigs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo            TEXT NOT NULL,
  descricao         TEXT,
  grupo_id          UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  consultor_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  indicador_lag     TEXT,
  meta_de           DECIMAL(12, 2),
  meta_para         DECIMAL(12, 2) NOT NULL,
  unidade           TEXT NOT NULL DEFAULT 'escolas',
  realizado         DECIMAL(12, 2) NOT NULL DEFAULT 0,
  data_inicio       DATE NOT NULL,
  data_fim          DATE NOT NULL,
  status            wig_status NOT NULL DEFAULT 'ativo',
  cor_hex           TEXT,
  criado_por        UUID NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4DX — DISCIPLINE 2: LEAD MEASURES
-- ============================================================

CREATE TABLE IF NOT EXISTS lead_measures (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wig_id          UUID NOT NULL REFERENCES wigs(id) ON DELETE CASCADE,
  consultor_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo          TEXT NOT NULL,
  descricao       TEXT,
  tipo            lead_tipo NOT NULL DEFAULT 'quantidade',
  frequencia      lead_frequencia NOT NULL DEFAULT 'semanal',
  meta_periodo    DECIMAL(10, 2) NOT NULL,
  ativo           BOOLEAN NOT NULL DEFAULT true,
  ordem           INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_registros (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_measure_id   UUID NOT NULL REFERENCES lead_measures(id) ON DELETE CASCADE,
  consultor_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  valor_realizado   DECIMAL(10, 2) NOT NULL DEFAULT 0,
  valor_meta        DECIMAL(10, 2) NOT NULL,
  periodo_inicio    DATE NOT NULL,
  periodo_fim       DATE NOT NULL,
  semana_ref        INT NOT NULL,
  mes_ref           INT NOT NULL,
  ano_ref           INT NOT NULL,
  observacao        TEXT,
  registrado_por    UUID NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lead_measure_id, periodo_inicio)
);

-- ============================================================
-- 4DX — DISCIPLINE 3: SCOREBOARD
-- ============================================================

CREATE TABLE IF NOT EXISTS scoreboard_semanas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wig_id          UUID NOT NULL REFERENCES wigs(id) ON DELETE CASCADE,
  consultor_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grupo_id        UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  semana_num      INT NOT NULL CHECK (semana_num BETWEEN 1 AND 5),
  mes_ref         INT NOT NULL,
  ano_ref         INT NOT NULL,
  status          placar_status NOT NULL DEFAULT 'pendente',
  pct_d2          DECIMAL(5, 2),
  pct_mci         DECIMAL(5, 2),
  observacao      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (consultor_id, wig_id, semana_num, mes_ref, ano_ref)
);

-- ============================================================
-- 4DX — DISCIPLINE 4: CADENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS cadencias (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id         UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  titulo           TEXT NOT NULL DEFAULT 'WIG Session',
  data_sessao      TIMESTAMPTZ NOT NULL,
  duracao_minutos  INT NOT NULL DEFAULT 20,
  status           cadencia_status NOT NULL DEFAULT 'agendada',
  facilitador_id   UUID NOT NULL REFERENCES profiles(id),
  ata              TEXT,
  link_virtual     TEXT,
  taxa_cumprimento DECIMAL(5, 2),
  semana_num       INT,
  mes_ref          INT,
  ano_ref          INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cadencia_compromissos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cadencia_id     UUID NOT NULL REFERENCES cadencias(id) ON DELETE CASCADE,
  consultor_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  compromisso     TEXT NOT NULL,
  status          compromisso_status NOT NULL DEFAULT 'pendente',
  resultado       TEXT,
  obstaculo       TEXT,
  novo_compromisso TEXT,
  data_prazo      DATE,
  proxima_cadencia_id UUID REFERENCES cadencias(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COBRA — PIPELINE STAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS cobra_etapas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  descricao   TEXT,
  ordem       INT NOT NULL,
  cor_hex     TEXT NOT NULL DEFAULT '#1565C0',
  icone       TEXT,
  grupo_id    UUID REFERENCES grupos(id) ON DELETE CASCADE,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default global stages
INSERT INTO cobra_etapas (id, nome, descricao, ordem, cor_hex) VALUES
  (uuid_generate_v4(), 'Contato', 'Primeiro contato com a escola', 1, '#1565C0'),
  (uuid_generate_v4(), 'Briefing', 'Levantamento de necessidades', 2, '#FF991F'),
  (uuid_generate_v4(), 'Proposta', 'Proposta comercial enviada', 3, '#7F77DD'),
  (uuid_generate_v4(), 'Negociação', 'Em negociação de termos', 4, '#FF7A59'),
  (uuid_generate_v4(), 'Fechamento', 'Contrato assinado / Ganho', 5, '#00875A');

-- ============================================================
-- COBRA — SCHOOLS / CLIENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS cobra_escolas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome              TEXT NOT NULL,
  cnpj              TEXT UNIQUE,
  cidade            TEXT,
  uf                CHAR(2),
  cep               TEXT,
  endereco          TEXT,
  segmento          escola_segmento,
  porte             escola_porte,
  numero_alunos     INT,
  contato_nome      TEXT,
  contato_cargo     TEXT,
  contato_email     TEXT,
  contato_telefone  TEXT,
  contato_whatsapp  TEXT,
  consultor_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  grupo_id          UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  tags              TEXT[] DEFAULT '{}',
  observacoes       TEXT,
  ultima_visita     DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COBRA — OPPORTUNITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS cobra_oportunidades (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escola_id         UUID NOT NULL REFERENCES cobra_escolas(id) ON DELETE CASCADE,
  etapa_id          UUID NOT NULL REFERENCES cobra_etapas(id),
  titulo            TEXT NOT NULL,
  descricao         TEXT,
  valor_estimado    DECIMAL(12, 2),
  probabilidade     INT DEFAULT 50 CHECK (probabilidade BETWEEN 0 AND 100),
  data_prevista     DATE,
  consultor_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grupo_id          UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  status            opp_status NOT NULL DEFAULT 'ativo',
  motivo_perda      TEXT,
  data_fechamento   DATE,
  origem_agenda     BOOLEAN DEFAULT false,
  criado_por        UUID NOT NULL REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cobra_historico_etapas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oportunidade_id     UUID NOT NULL REFERENCES cobra_oportunidades(id) ON DELETE CASCADE,
  etapa_anterior_id   UUID REFERENCES cobra_etapas(id),
  etapa_nova_id       UUID NOT NULL REFERENCES cobra_etapas(id),
  usuario_id          UUID NOT NULL REFERENCES profiles(id),
  observacao          TEXT,
  tempo_na_etapa_dias INT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COBRA — ACTIVITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS cobra_atividades (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oportunidade_id     UUID REFERENCES cobra_oportunidades(id) ON DELETE CASCADE,
  escola_id           UUID NOT NULL REFERENCES cobra_escolas(id) ON DELETE CASCADE,
  tipo                atividade_tipo NOT NULL DEFAULT 'visita',
  titulo              TEXT NOT NULL,
  descricao           TEXT,
  data_atividade      TIMESTAMPTZ NOT NULL,
  data_proximo_passo  TIMESTAMPTZ,
  gerou_oportunidade  BOOLEAN DEFAULT false,
  status              atividade_status NOT NULL DEFAULT 'pendente',
  usuario_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cidade              TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COBRA — COMPETENCY EVALUATION
-- ============================================================

CREATE TABLE IF NOT EXISTS cobra_criterios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perfil      perfil_consultor NOT NULL,
  nome        TEXT NOT NULL,
  descricao   TEXT,
  icone       TEXT,
  ordem       INT NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert COBRA criteria by profile
INSERT INTO cobra_criterios (perfil, nome, descricao, icone, ordem) VALUES
  ('farmer',     'Renovação',      'Capacidade de renovar contratos existentes', '🎯', 1),
  ('farmer',     'Relacionamento', 'Qualidade do relacionamento com as escolas', '🤝', 2),
  ('farmer',     'Expansão',       'Expansão dentro da carteira existente', '📦', 3),
  ('farmer',     'Consistência',   'Regularidade das ações e entregas', '🔄', 4),
  ('farmer',     'Consultoria',    'Postura consultiva e conhecimento do produto', '🧠', 5),
  ('hibrido',    'Renovação',      'Capacidade de renovar contratos existentes', '🎯', 1),
  ('hibrido',    'Relacionamento', 'Qualidade do relacionamento com as escolas', '🤝', 2),
  ('hibrido',    'Expansão',       'Expansão dentro da carteira existente', '📦', 3),
  ('hibrido',    'Consistência',   'Regularidade das ações e entregas', '🔄', 4),
  ('hibrido',    'Consultoria',    'Postura consultiva e conhecimento do produto', '🧠', 5),
  ('inside_sales','Renovação',     'Renovações via atendimento remoto', '🎯', 1),
  ('inside_sales','Relacionamento','Relacionamento digital com as escolas', '🤝', 2),
  ('inside_sales','Expansão',      'Expansão via canais digitais', '📦', 3),
  ('inside_sales','Consistência',  'Regularidade das ações digitais', '🔄', 4),
  ('inside_sales','Consultoria',   'Postura consultiva remota', '🧠', 5),
  ('hunter',     'Captação',       'Volume de novas escolas prospectadas', '🎯', 1),
  ('hunter',     'Prospecção',     'Qualidade da prospecção e qualificação', '📞', 2),
  ('hunter',     'Conversão',      'Taxa de conversão de propostas', '🧠', 3),
  ('hunter',     'Consistência',   'Regularidade das atividades de captação', '🔄', 4),
  ('hunter',     'Postura',        'Postura e abordagem comercial', '🤝', 5);

CREATE TABLE IF NOT EXISTS cobra_avaliacoes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultor_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grupo_id        UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  avaliado_por    UUID NOT NULL REFERENCES profiles(id),
  mes_ref         INT NOT NULL,
  ano_ref         INT NOT NULL,
  total_pontos    DECIMAL(5, 2),
  nivel           TEXT,
  observacoes     TEXT,
  plano_acao      TEXT,
  lead_sugerido   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (consultor_id, mes_ref, ano_ref)
);

CREATE TABLE IF NOT EXISTS cobra_avaliacoes_notas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avaliacao_id    UUID NOT NULL REFERENCES cobra_avaliacoes(id) ON DELETE CASCADE,
  criterio_id     UUID NOT NULL REFERENCES cobra_criterios(id),
  nota            DECIMAL(3, 1) NOT NULL CHECK (nota BETWEEN 0 AND 5),
  observacao      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (avaliacao_id, criterio_id)
);

-- ============================================================
-- WEEKLY AGENDA
-- ============================================================

CREATE TABLE IF NOT EXISTS agenda_semanal (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultor_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  grupo_id        UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  escola_id       UUID REFERENCES cobra_escolas(id) ON DELETE SET NULL,
  escola_nome     TEXT,
  cidade          TEXT,
  tipo_acao       atividade_tipo NOT NULL DEFAULT 'visita',
  objetivo        TEXT,
  semana_num      INT NOT NULL,
  mes_ref         INT NOT NULL,
  ano_ref         INT NOT NULL,
  data_planejada  DATE,
  gerou_opp       BOOLEAN,
  resultado       TEXT,
  proximo_passo   TEXT,
  status          atividade_status NOT NULL DEFAULT 'pendente',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tipo        notif_tipo NOT NULL,
  titulo      TEXT NOT NULL,
  mensagem    TEXT,
  lida        BOOLEAN NOT NULL DEFAULT false,
  link        TEXT,
  dados       JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES profiles(id) ON DELETE SET NULL,
  tabela            TEXT NOT NULL,
  registro_id       UUID,
  acao              audit_acao NOT NULL,
  dados_anteriores  JSONB,
  dados_novos       JSONB,
  ip                INET,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- profiles
CREATE INDEX idx_profiles_grupo ON profiles(grupo_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_ativo ON profiles(ativo);

-- wigs
CREATE INDEX idx_wigs_grupo ON wigs(grupo_id);
CREATE INDEX idx_wigs_consultor ON wigs(consultor_id);
CREATE INDEX idx_wigs_status ON wigs(status);
CREATE INDEX idx_wigs_data_fim ON wigs(data_fim);

-- lead_measures
CREATE INDEX idx_leads_wig ON lead_measures(wig_id);
CREATE INDEX idx_leads_consultor ON lead_measures(consultor_id);

-- lead_registros
CREATE INDEX idx_registros_lead ON lead_registros(lead_measure_id);
CREATE INDEX idx_registros_consultor ON lead_registros(consultor_id);
CREATE INDEX idx_registros_periodo ON lead_registros(periodo_inicio, periodo_fim);

-- scoreboard
CREATE INDEX idx_scoreboard_wig ON scoreboard_semanas(wig_id);
CREATE INDEX idx_scoreboard_consultor ON scoreboard_semanas(consultor_id);
CREATE INDEX idx_scoreboard_periodo ON scoreboard_semanas(mes_ref, ano_ref);

-- cadencias
CREATE INDEX idx_cadencias_grupo ON cadencias(grupo_id);
CREATE INDEX idx_cadencias_data ON cadencias(data_sessao);
CREATE INDEX idx_cadencias_status ON cadencias(status);

-- cobra_escolas
CREATE INDEX idx_escolas_consultor ON cobra_escolas(consultor_id);
CREATE INDEX idx_escolas_grupo ON cobra_escolas(grupo_id);
CREATE INDEX idx_escolas_nome ON cobra_escolas USING gin(nome gin_trgm_ops);

-- cobra_oportunidades
CREATE INDEX idx_opps_escola ON cobra_oportunidades(escola_id);
CREATE INDEX idx_opps_etapa ON cobra_oportunidades(etapa_id);
CREATE INDEX idx_opps_consultor ON cobra_oportunidades(consultor_id);
CREATE INDEX idx_opps_status ON cobra_oportunidades(status);
CREATE INDEX idx_opps_grupo ON cobra_oportunidades(grupo_id);

-- cobra_atividades
CREATE INDEX idx_atv_escola ON cobra_atividades(escola_id);
CREATE INDEX idx_atv_usuario ON cobra_atividades(usuario_id);
CREATE INDEX idx_atv_data ON cobra_atividades(data_atividade);

-- notifications
CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_lida ON notifications(lida);
CREATE INDEX idx_notif_created ON notifications(created_at DESC);

-- activity_logs
CREATE INDEX idx_logs_user ON activity_logs(user_id);
CREATE INDEX idx_logs_tabela ON activity_logs(tabela);
CREATE INDEX idx_logs_created ON activity_logs(created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_grupos_updated BEFORE UPDATE ON grupos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_wigs_updated BEFORE UPDATE ON wigs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON lead_measures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cadencias_updated BEFORE UPDATE ON cadencias FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_compromissos_updated BEFORE UPDATE ON cadencia_compromissos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_escolas_updated BEFORE UPDATE ON cobra_escolas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_opps_updated BEFORE UPDATE ON cobra_oportunidades FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_atividades_updated BEFORE UPDATE ON cobra_atividades FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_avaliacoes_updated BEFORE UPDATE ON cobra_avaliacoes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_scoreboard_updated BEFORE UPDATE ON scoreboard_semanas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_agenda_updated BEFORE UPDATE ON agenda_semanal FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- NEW USER PROFILE TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'consultor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE scoreboard_semanas;
ALTER PUBLICATION supabase_realtime ADD TABLE cobra_oportunidades;
ALTER PUBLICATION supabase_realtime ADD TABLE cadencia_compromissos;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE wigs;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_registros;
ALTER PUBLICATION supabase_realtime ADD TABLE cobra_atividades;
