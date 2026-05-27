-- ============================================================
-- FTD NEXUS — Database Functions & Views
-- Migration: 003_functions.sql
-- ============================================================

-- ============================================================
-- VIEWS
-- ============================================================

-- Team dashboard summary view
CREATE OR REPLACE VIEW v_team_dashboard AS
SELECT
  p.id AS consultor_id,
  p.nome AS consultor_nome,
  p.perfil,
  p.grupo_id,
  g.nome AS grupo_nome,
  -- Current active WIG
  w.id AS wig_id,
  w.titulo AS wig_titulo,
  w.meta_para AS wig_meta,
  w.realizado AS wig_realizado,
  CASE WHEN w.meta_para > 0 THEN ROUND((w.realizado / w.meta_para * 100)::NUMERIC, 1) ELSE 0 END AS pct_mci,
  w.data_fim AS wig_prazo,
  -- Latest COBRA score
  ca.total_pontos AS cobra_total,
  ca.nivel AS cobra_nivel,
  ca.mes_ref AS cobra_mes,
  ca.ano_ref AS cobra_ano,
  -- D4 cadence rate (last 4 weeks)
  COALESCE(
    (SELECT ROUND(
      (COUNT(*) FILTER (WHERE cc.status = 'cumprido')::DECIMAL /
       NULLIF(COUNT(*) FILTER (WHERE cc.status != 'pendente'), 0) * 100)::NUMERIC, 1)
     FROM cadencia_compromissos cc
     JOIN cadencias c ON c.id = cc.cadencia_id
     WHERE cc.consultor_id = p.id
     AND c.data_sessao >= NOW() - INTERVAL '28 days'
    ), 0
  ) AS pct_d4,
  -- Status
  CASE
    WHEN w.realizado IS NULL OR w.meta_para IS NULL THEN 'sem_meta'
    WHEN (w.realizado / w.meta_para * 100) >= 100 THEN 'atingido'
    WHEN (w.realizado / w.meta_para * 100) >= 80 THEN 'no_caminho'
    WHEN (w.realizado / w.meta_para * 100) >= 50 THEN 'atencao'
    ELSE 'critico'
  END AS status_mci
FROM profiles p
JOIN grupos g ON g.id = p.grupo_id
LEFT JOIN LATERAL (
  SELECT * FROM wigs WHERE consultor_id = p.id AND status = 'ativo'
  ORDER BY data_fim DESC LIMIT 1
) w ON true
LEFT JOIN LATERAL (
  SELECT * FROM cobra_avaliacoes WHERE consultor_id = p.id
  ORDER BY ano_ref DESC, mes_ref DESC LIMIT 1
) ca ON true
WHERE p.ativo = true;

-- Scoreboard history view
CREATE OR REPLACE VIEW v_scoreboard_history AS
SELECT
  ss.consultor_id,
  ss.wig_id,
  ss.grupo_id,
  ss.semana_num,
  ss.mes_ref,
  ss.ano_ref,
  ss.status,
  ss.pct_d2,
  ss.pct_mci,
  p.nome AS consultor_nome,
  p.perfil,
  w.titulo AS wig_titulo
FROM scoreboard_semanas ss
JOIN profiles p ON p.id = ss.consultor_id
JOIN wigs w ON w.id = ss.wig_id;

-- COBRA evaluation summary
CREATE OR REPLACE VIEW v_cobra_summary AS
SELECT
  ca.id,
  ca.consultor_id,
  ca.grupo_id,
  ca.mes_ref,
  ca.ano_ref,
  ca.total_pontos,
  ca.nivel,
  p.nome AS consultor_nome,
  p.perfil,
  g.nome AS grupo_nome,
  json_agg(
    json_build_object(
      'criterio_id', can.criterio_id,
      'nota', can.nota,
      'criterio_nome', cc.nome,
      'criterio_icone', cc.icone
    ) ORDER BY cc.ordem
  ) AS notas
FROM cobra_avaliacoes ca
JOIN profiles p ON p.id = ca.consultor_id
JOIN grupos g ON g.id = ca.grupo_id
LEFT JOIN cobra_avaliacoes_notas can ON can.avaliacao_id = ca.id
LEFT JOIN cobra_criterios cc ON cc.id = can.criterio_id
GROUP BY ca.id, ca.consultor_id, ca.grupo_id, ca.mes_ref, ca.ano_ref,
         ca.total_pontos, ca.nivel, p.nome, p.perfil, g.nome;

-- Pipeline funnel view
CREATE OR REPLACE VIEW v_pipeline_funnel AS
SELECT
  e.id AS etapa_id,
  e.nome AS etapa_nome,
  e.ordem,
  e.cor_hex,
  o.grupo_id,
  COUNT(o.id) AS total_opps,
  COALESCE(SUM(o.valor_estimado), 0) AS valor_total,
  COALESCE(AVG(o.probabilidade), 0) AS probabilidade_media
FROM cobra_etapas e
LEFT JOIN cobra_oportunidades o ON o.etapa_id = e.id AND o.status = 'ativo'
GROUP BY e.id, e.nome, e.ordem, e.cor_hex, o.grupo_id;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Calculate and update WIG percentage
CREATE OR REPLACE FUNCTION calc_wig_pct(p_wig_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_meta DECIMAL;
  v_realizado DECIMAL;
BEGIN
  SELECT meta_para, realizado INTO v_meta, v_realizado
  FROM wigs WHERE id = p_wig_id;

  IF v_meta IS NULL OR v_meta = 0 THEN RETURN 0; END IF;
  RETURN ROUND((v_realizado / v_meta * 100)::NUMERIC, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update WIG realizado when lead registros change
CREATE OR REPLACE FUNCTION update_wig_from_registro()
RETURNS TRIGGER AS $$
DECLARE
  v_wig_id UUID;
BEGIN
  SELECT lm.wig_id INTO v_wig_id
  FROM lead_measures lm WHERE lm.id = NEW.lead_measure_id;

  -- Recalculate wig realizado as sum of matching registros
  -- (This is a simplified version; real logic depends on WIG type)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update scoreboard status after lead registro
CREATE OR REPLACE FUNCTION update_scoreboard_after_registro()
RETURNS TRIGGER AS $$
DECLARE
  v_wig_id UUID;
  v_grupo_id UUID;
  v_total_meta DECIMAL := 0;
  v_total_realizado DECIMAL := 0;
  v_pct DECIMAL := 0;
  v_status placar_status;
BEGIN
  SELECT lm.wig_id INTO v_wig_id FROM lead_measures lm WHERE lm.id = NEW.lead_measure_id;
  SELECT grupo_id INTO v_grupo_id FROM wigs WHERE id = v_wig_id;

  -- Sum all lead measures for this consultor/week
  SELECT
    COALESCE(SUM(lr.valor_meta), 0),
    COALESCE(SUM(lr.valor_realizado), 0)
  INTO v_total_meta, v_total_realizado
  FROM lead_registros lr
  JOIN lead_measures lm ON lm.id = lr.lead_measure_id
  WHERE lr.consultor_id = NEW.consultor_id
    AND lr.periodo_inicio = NEW.periodo_inicio
    AND lm.wig_id = v_wig_id;

  IF v_total_meta > 0 THEN
    v_pct := ROUND((v_total_realizado / v_total_meta * 100)::NUMERIC, 1);
  END IF;

  v_status := CASE WHEN v_pct >= 100 THEN 'verde' ELSE 'vermelho' END;

  -- Upsert scoreboard
  INSERT INTO scoreboard_semanas (
    wig_id, consultor_id, grupo_id, semana_num, mes_ref, ano_ref, status, pct_d2
  ) VALUES (
    v_wig_id, NEW.consultor_id, v_grupo_id,
    NEW.semana_ref, NEW.mes_ref, NEW.ano_ref, v_status, v_pct
  )
  ON CONFLICT (consultor_id, wig_id, semana_num, mes_ref, ano_ref)
  DO UPDATE SET status = v_status, pct_d2 = v_pct, updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_scoreboard
  AFTER INSERT OR UPDATE ON lead_registros
  FOR EACH ROW EXECUTE FUNCTION update_scoreboard_after_registro();

-- Check for consecutive red weeks and notify
CREATE OR REPLACE FUNCTION check_consecutive_red_weeks()
RETURNS TRIGGER AS $$
DECLARE
  v_prev_status placar_status;
  v_consultor_nome TEXT;
  v_grupo_id UUID;
  v_coord_id UUID;
BEGIN
  IF NEW.status = 'vermelho' THEN
    -- Check previous week
    SELECT status INTO v_prev_status
    FROM scoreboard_semanas
    WHERE consultor_id = NEW.consultor_id
      AND wig_id = NEW.wig_id
      AND mes_ref = NEW.mes_ref
      AND ano_ref = NEW.ano_ref
      AND semana_num = NEW.semana_num - 1;

    IF v_prev_status = 'vermelho' THEN
      SELECT p.nome, g.id INTO v_consultor_nome, v_grupo_id
      FROM profiles p JOIN grupos g ON g.id = p.grupo_id WHERE p.id = NEW.consultor_id;

      -- Notify coordinator
      SELECT id INTO v_coord_id FROM profiles
      WHERE grupo_id = v_grupo_id AND role = 'coordenador' LIMIT 1;

      IF v_coord_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, tipo, titulo, mensagem, link, dados)
        VALUES (
          v_coord_id,
          'alerta_placar',
          '🔴 2ª semana consecutiva em vermelho',
          v_consultor_nome || ' está na 2ª semana seguida com placar vermelho. Intervenção recomendada.',
          '/equipe',
          json_build_object('consultor_id', NEW.consultor_id, 'semana', NEW.semana_num)
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_red_weeks
  AFTER INSERT OR UPDATE ON scoreboard_semanas
  FOR EACH ROW EXECUTE FUNCTION check_consecutive_red_weeks();

-- Notify when MCI is reached
CREATE OR REPLACE FUNCTION check_mci_achieved()
RETURNS TRIGGER AS $$
DECLARE
  v_old_pct DECIMAL;
  v_new_pct DECIMAL;
  v_consultor_nome TEXT;
  v_grupo_id UUID;
  v_wig_titulo TEXT;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    SELECT nome, grupo_id INTO v_consultor_nome, v_grupo_id FROM profiles WHERE id = NEW.consultor_id;
    SELECT titulo INTO v_wig_titulo FROM wigs WHERE id = NEW.wig_id;

    v_old_pct := CASE WHEN OLD.meta_para > 0 THEN OLD.realizado / OLD.meta_para * 100 ELSE 0 END;
    v_new_pct := CASE WHEN NEW.meta_para > 0 THEN NEW.realizado / NEW.meta_para * 100 ELSE 0 END;

    IF v_new_pct >= 100 AND v_old_pct < 100 THEN
      -- Notify all team members
      INSERT INTO notifications (user_id, tipo, titulo, mensagem, dados)
      SELECT
        p.id,
        'meta_atingida',
        '🎉 Meta atingida!',
        v_consultor_nome || ' atingiu a MCI: ' || v_wig_titulo,
        json_build_object('consultor_id', NEW.consultor_id, 'wig_id', NEW.wig_id)
      FROM profiles p
      WHERE p.grupo_id = v_grupo_id AND p.ativo = true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_mci
  AFTER UPDATE ON wigs
  FOR EACH ROW EXECUTE FUNCTION check_mci_achieved();

-- Auto-create weekly cadence
CREATE OR REPLACE FUNCTION create_weekly_cadencias()
RETURNS void AS $$
DECLARE
  v_grupo RECORD;
  v_coord_id UUID;
  v_friday TIMESTAMPTZ;
BEGIN
  -- Get next Friday at 17:00
  v_friday := date_trunc('week', NOW()) + INTERVAL '4 days' + INTERVAL '17 hours';

  FOR v_grupo IN SELECT id FROM grupos WHERE ativo = true LOOP
    -- Get coordinator
    SELECT id INTO v_coord_id FROM profiles
    WHERE grupo_id = v_grupo.id AND role = 'coordenador' AND ativo = true LIMIT 1;

    IF v_coord_id IS NOT NULL THEN
      INSERT INTO cadencias (grupo_id, facilitador_id, data_sessao, status)
      VALUES (v_grupo.id, v_coord_id, v_friday, 'agendada')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- COBRA: Calculate nivel from total points
CREATE OR REPLACE FUNCTION calc_cobra_nivel(p_total DECIMAL)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN p_total >= 23 THEN 'Excelente'
    WHEN p_total >= 19 THEN 'Muito bom'
    WHEN p_total >= 16 THEN 'Bom, ajustar'
    WHEN p_total >= 11 THEN 'Baixo, atenção'
    ELSE 'Crítico'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update COBRA total after note insert
CREATE OR REPLACE FUNCTION update_cobra_total()
RETURNS TRIGGER AS $$
DECLARE
  v_total DECIMAL;
  v_nivel TEXT;
BEGIN
  SELECT COALESCE(SUM(nota), 0) INTO v_total
  FROM cobra_avaliacoes_notas
  WHERE avaliacao_id = NEW.avaliacao_id;

  v_nivel := calc_cobra_nivel(v_total);

  UPDATE cobra_avaliacoes
  SET total_pontos = v_total, nivel = v_nivel
  WHERE id = NEW.avaliacao_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_cobra_total
  AFTER INSERT OR UPDATE OR DELETE ON cobra_avaliacoes_notas
  FOR EACH ROW EXECUTE FUNCTION update_cobra_total();

-- Move opportunity stage and record history
CREATE OR REPLACE FUNCTION move_oportunidade_etapa(
  p_opp_id UUID,
  p_nova_etapa_id UUID,
  p_observacao TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_etapa_anterior_id UUID;
  v_data_anterior TIMESTAMPTZ;
  v_dias INT;
BEGIN
  SELECT etapa_id, updated_at INTO v_etapa_anterior_id, v_data_anterior
  FROM cobra_oportunidades WHERE id = p_opp_id;

  v_dias := EXTRACT(DAY FROM (NOW() - v_data_anterior))::INT;

  INSERT INTO cobra_historico_etapas (
    oportunidade_id, etapa_anterior_id, etapa_nova_id, usuario_id, observacao, tempo_na_etapa_dias
  ) VALUES (
    p_opp_id, v_etapa_anterior_id, p_nova_etapa_id, auth.uid(), p_observacao, v_dias
  );

  UPDATE cobra_oportunidades
  SET etapa_id = p_nova_etapa_id
  WHERE id = p_opp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Regional summary function
CREATE OR REPLACE FUNCTION get_regional_summary(p_regional_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_consultores', COUNT(DISTINCT p.id),
    'mci_media', ROUND(AVG(
      CASE WHEN w.meta_para > 0 THEN w.realizado / w.meta_para * 100 ELSE 0 END
    )::NUMERIC, 1),
    'grupos', json_agg(
      json_build_object(
        'grupo_id', g.id,
        'grupo_nome', g.nome,
        'mci_media', ROUND(AVG(
          CASE WHEN w.meta_para > 0 THEN w.realizado / w.meta_para * 100 ELSE 0 END
        )::NUMERIC, 1),
        'total_consultores', COUNT(DISTINCT p.id)
      )
    )
  ) INTO v_result
  FROM profiles p
  JOIN grupos g ON g.id = p.grupo_id
  LEFT JOIN wigs w ON w.consultor_id = p.id AND w.status = 'ativo'
  WHERE g.regional_id = p_regional_id AND p.ativo = true
  GROUP BY g.id, g.nome;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
