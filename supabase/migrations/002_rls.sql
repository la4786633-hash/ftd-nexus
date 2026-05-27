-- ============================================================
-- FTD NEXUS — Row Level Security Policies
-- Migration: 002_rls.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoreboard_semanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadencia_compromissos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobra_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobra_escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobra_oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobra_historico_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobra_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobra_criterios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobra_avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobra_avaliacoes_notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get current user's grupo_id
CREATE OR REPLACE FUNCTION auth_grupo_id()
RETURNS UUID AS $$
  SELECT grupo_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get current user's regional_id
CREATE OR REPLACE FUNCTION auth_regional_id()
RETURNS UUID AS $$
  SELECT regional_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is admin or gerente
CREATE OR REPLACE FUNCTION is_admin_or_gerente()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'gerente') FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user is coordenador or above
CREATE OR REPLACE FUNCTION is_coordenador_or_above()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'gerente', 'coordenador') FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Check if user belongs to the same grupo
CREATE OR REPLACE FUNCTION same_grupo(p_grupo_id UUID)
RETURNS BOOLEAN AS $$
  SELECT CASE
    WHEN (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'gerente') THEN true
    ELSE (SELECT grupo_id FROM profiles WHERE id = auth.uid()) = p_grupo_id
  END
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR is_coordenador_or_above()
    OR grupo_id = auth_grupo_id()
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (is_admin_or_gerente());

-- ============================================================
-- REGIONAIS POLICIES
-- ============================================================

CREATE POLICY "regionais_select_all" ON regionais FOR SELECT USING (true);
CREATE POLICY "regionais_admin_write" ON regionais FOR ALL USING (is_admin_or_gerente());

-- ============================================================
-- GRUPOS POLICIES
-- ============================================================

CREATE POLICY "grupos_select_all" ON grupos FOR SELECT USING (true);
CREATE POLICY "grupos_admin_write" ON grupos FOR ALL USING (is_admin_or_gerente());

-- ============================================================
-- WIGS POLICIES
-- ============================================================

CREATE POLICY "wigs_select" ON wigs
  FOR SELECT USING (same_grupo(grupo_id));

CREATE POLICY "wigs_insert_coord" ON wigs
  FOR INSERT WITH CHECK (
    is_coordenador_or_above() AND same_grupo(grupo_id)
  );

CREATE POLICY "wigs_update_coord" ON wigs
  FOR UPDATE USING (
    is_coordenador_or_above() AND same_grupo(grupo_id)
  );

CREATE POLICY "wigs_delete_admin" ON wigs
  FOR DELETE USING (is_admin_or_gerente());

-- ============================================================
-- LEAD MEASURES POLICIES
-- ============================================================

CREATE POLICY "lead_measures_select" ON lead_measures
  FOR SELECT USING (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
    OR EXISTS (
      SELECT 1 FROM wigs w
      WHERE w.id = lead_measures.wig_id AND same_grupo(w.grupo_id)
    )
  );

CREATE POLICY "lead_measures_insert" ON lead_measures
  FOR INSERT WITH CHECK (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
  );

CREATE POLICY "lead_measures_update" ON lead_measures
  FOR UPDATE USING (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
  );

CREATE POLICY "lead_measures_delete_coord" ON lead_measures
  FOR DELETE USING (is_coordenador_or_above());

-- ============================================================
-- LEAD REGISTROS POLICIES
-- ============================================================

CREATE POLICY "lead_registros_select" ON lead_registros
  FOR SELECT USING (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
    OR EXISTS (
      SELECT 1 FROM lead_measures lm
      JOIN wigs w ON w.id = lm.wig_id
      WHERE lm.id = lead_registros.lead_measure_id AND same_grupo(w.grupo_id)
    )
  );

CREATE POLICY "lead_registros_insert" ON lead_registros
  FOR INSERT WITH CHECK (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
  );

CREATE POLICY "lead_registros_update" ON lead_registros
  FOR UPDATE USING (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
  );

-- ============================================================
-- SCOREBOARD POLICIES
-- ============================================================

CREATE POLICY "scoreboard_select" ON scoreboard_semanas
  FOR SELECT USING (same_grupo(grupo_id));

CREATE POLICY "scoreboard_insert" ON scoreboard_semanas
  FOR INSERT WITH CHECK (same_grupo(grupo_id));

CREATE POLICY "scoreboard_update" ON scoreboard_semanas
  FOR UPDATE USING (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
  );

-- ============================================================
-- CADENCIAS POLICIES
-- ============================================================

CREATE POLICY "cadencias_select" ON cadencias
  FOR SELECT USING (same_grupo(grupo_id));

CREATE POLICY "cadencias_insert_coord" ON cadencias
  FOR INSERT WITH CHECK (
    is_coordenador_or_above() AND same_grupo(grupo_id)
  );

CREATE POLICY "cadencias_update_coord" ON cadencias
  FOR UPDATE USING (
    is_coordenador_or_above() AND same_grupo(grupo_id)
  );

-- ============================================================
-- CADENCIA COMPROMISSOS POLICIES
-- ============================================================

CREATE POLICY "compromissos_select" ON cadencia_compromissos
  FOR SELECT USING (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
    OR EXISTS (
      SELECT 1 FROM cadencias c WHERE c.id = cadencia_compromissos.cadencia_id AND same_grupo(c.grupo_id)
    )
  );

CREATE POLICY "compromissos_insert" ON cadencia_compromissos
  FOR INSERT WITH CHECK (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
  );

CREATE POLICY "compromissos_update" ON cadencia_compromissos
  FOR UPDATE USING (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
  );

-- ============================================================
-- COBRA ETAPAS POLICIES
-- ============================================================

CREATE POLICY "etapas_select_all" ON cobra_etapas FOR SELECT USING (true);
CREATE POLICY "etapas_admin_write" ON cobra_etapas FOR ALL USING (is_coordenador_or_above());

-- ============================================================
-- COBRA ESCOLAS POLICIES
-- ============================================================

CREATE POLICY "escolas_select" ON cobra_escolas
  FOR SELECT USING (same_grupo(grupo_id));

CREATE POLICY "escolas_insert" ON cobra_escolas
  FOR INSERT WITH CHECK (same_grupo(grupo_id));

CREATE POLICY "escolas_update" ON cobra_escolas
  FOR UPDATE USING (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
  );

CREATE POLICY "escolas_delete_coord" ON cobra_escolas
  FOR DELETE USING (is_coordenador_or_above());

-- ============================================================
-- COBRA OPORTUNIDADES POLICIES
-- ============================================================

CREATE POLICY "opps_select" ON cobra_oportunidades
  FOR SELECT USING (same_grupo(grupo_id));

CREATE POLICY "opps_insert" ON cobra_oportunidades
  FOR INSERT WITH CHECK (same_grupo(grupo_id));

CREATE POLICY "opps_update" ON cobra_oportunidades
  FOR UPDATE USING (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
  );

CREATE POLICY "opps_delete_coord" ON cobra_oportunidades
  FOR DELETE USING (is_coordenador_or_above());

-- ============================================================
-- COBRA HISTORICO POLICIES
-- ============================================================

CREATE POLICY "historico_select" ON cobra_historico_etapas
  FOR SELECT USING (
    usuario_id = auth.uid()
    OR is_coordenador_or_above()
    OR EXISTS (
      SELECT 1 FROM cobra_oportunidades o WHERE o.id = cobra_historico_etapas.oportunidade_id AND same_grupo(o.grupo_id)
    )
  );

CREATE POLICY "historico_insert" ON cobra_historico_etapas
  FOR INSERT WITH CHECK (usuario_id = auth.uid() OR is_coordenador_or_above());

-- ============================================================
-- COBRA ATIVIDADES POLICIES
-- ============================================================

CREATE POLICY "atividades_select" ON cobra_atividades
  FOR SELECT USING (
    usuario_id = auth.uid()
    OR is_coordenador_or_above()
    OR EXISTS (
      SELECT 1 FROM cobra_escolas e WHERE e.id = cobra_atividades.escola_id AND same_grupo(e.grupo_id)
    )
  );

CREATE POLICY "atividades_insert" ON cobra_atividades
  FOR INSERT WITH CHECK (usuario_id = auth.uid() OR is_coordenador_or_above());

CREATE POLICY "atividades_update" ON cobra_atividades
  FOR UPDATE USING (
    usuario_id = auth.uid() OR is_coordenador_or_above()
  );

-- ============================================================
-- COBRA CRITERIOS POLICIES
-- ============================================================

CREATE POLICY "criterios_select_all" ON cobra_criterios FOR SELECT USING (true);
CREATE POLICY "criterios_admin_write" ON cobra_criterios FOR ALL USING (is_admin_or_gerente());

-- ============================================================
-- COBRA AVALIACOES POLICIES
-- ============================================================

CREATE POLICY "avaliacoes_select" ON cobra_avaliacoes
  FOR SELECT USING (
    consultor_id = auth.uid()
    OR avaliado_por = auth.uid()
    OR is_coordenador_or_above()
  );

CREATE POLICY "avaliacoes_insert_coord" ON cobra_avaliacoes
  FOR INSERT WITH CHECK (is_coordenador_or_above());

CREATE POLICY "avaliacoes_update_coord" ON cobra_avaliacoes
  FOR UPDATE USING (is_coordenador_or_above());

-- ============================================================
-- COBRA NOTAS POLICIES
-- ============================================================

CREATE POLICY "notas_select" ON cobra_avaliacoes_notas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cobra_avaliacoes a WHERE a.id = cobra_avaliacoes_notas.avaliacao_id
      AND (a.consultor_id = auth.uid() OR a.avaliado_por = auth.uid() OR is_coordenador_or_above())
    )
  );

CREATE POLICY "notas_insert_coord" ON cobra_avaliacoes_notas
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cobra_avaliacoes a WHERE a.id = cobra_avaliacoes_notas.avaliacao_id
      AND is_coordenador_or_above()
    )
  );

-- ============================================================
-- AGENDA POLICIES
-- ============================================================

CREATE POLICY "agenda_select" ON agenda_semanal
  FOR SELECT USING (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
    OR same_grupo(grupo_id)
  );

CREATE POLICY "agenda_insert" ON agenda_semanal
  FOR INSERT WITH CHECK (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
  );

CREATE POLICY "agenda_update" ON agenda_semanal
  FOR UPDATE USING (
    consultor_id = auth.uid()
    OR is_coordenador_or_above()
  );

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- AUDIT LOG POLICIES
-- ============================================================

CREATE POLICY "audit_select_coord" ON activity_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_coordenador_or_above()
  );

CREATE POLICY "audit_insert_all" ON activity_logs
  FOR INSERT WITH CHECK (true);
