-- Gráficos editáveis: a equipe (Scout, executivo e administrador) pode mudar o que os gráficos da ficha do jogador mostram.
--
--   stats     só os indicadores que a equipe mudou: { "ataque": 88, "passe": 91 } (1 a 100; os outros seguem o relatório)
--   overall   nota geral fixada à mão (NULL = a média dos indicadores)
--   marker    onde o jogador aparece no campo: { "x": 50, "y": 34 } em % do campo (NULL = pela posição do cadastro)
--   heat      manchas do mapa de calor: [ { "x": 50, "y": 34 }, ... ] até 8 (NULL = automático; [] = sem calor)
--   note      o motivo da mudança, para a equipe
--
-- O relatório original (funnel_leads.report, a conta do atleta) NÃO é tocado: a edição vale só no painel da VOXEN
-- (ficha, lista, comparativo, elenco), e apagar a linha devolve tudo ao original. O atleta não lê esta tabela.
-- A chave do jogador é a mesma de voxen_player_meta e voxen_player_materials ('lead:<uuid>' ou 'atleta:<id>').
--
-- Aditivo e repetível. Todos da equipe leem; quem mantém jogador (Scout, executivo, administrador) cria, muda e apaga.

/* ------------------------------------------------------------------ */
/* Conferências (os mesmos limites da tela)                            */
/* ------------------------------------------------------------------ */

-- { "<indicador>": nota inteira de 1 a 100 } só com os 10 indicadores do relatório.
CREATE OR REPLACE FUNCTION public.voxen_valid_chart_stats(p jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT jsonb_typeof(p) = 'object'
     AND NOT EXISTS (
       SELECT 1 FROM jsonb_each(p) e
        WHERE e.key NOT IN ('ataque', 'defesa', 'chute', 'dominio', 'marcacao', 'finalizacao', 'drible', 'passe', 'velocidade', 'leitura')
           OR NOT (
             CASE WHEN jsonb_typeof(e.value) = 'number'
                  THEN (e.value #>> '{}')::numeric BETWEEN 1 AND 100 AND (e.value #>> '{}')::numeric = trunc((e.value #>> '{}')::numeric)
                  ELSE false END)
     )
$fn$;

-- [ { "x": 0 a 100, "y": 0 a 100 }, ... ] com no máximo p_max pontos.
CREATE OR REPLACE FUNCTION public.voxen_valid_chart_points(p jsonb, p_max integer)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT jsonb_typeof(p) = 'array'
     AND jsonb_array_length(p) <= p_max
     AND NOT EXISTS (
       SELECT 1 FROM jsonb_array_elements(p) e
        WHERE NOT (
          CASE WHEN jsonb_typeof(e) = 'object' AND jsonb_typeof(e->'x') = 'number' AND jsonb_typeof(e->'y') = 'number'
               THEN (e->>'x')::numeric BETWEEN 0 AND 100 AND (e->>'y')::numeric BETWEEN 0 AND 100
               ELSE false END)
     )
$fn$;

/* ------------------------------------------------------------------ */
/* Tabela                                                              */
/* ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS public.voxen_player_charts (
  player_key text PRIMARY KEY
    CHECK (player_key ~ '^(lead:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|atleta:[0-9]{1,18})$'),
  stats      jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (public.voxen_valid_chart_stats(stats)),
  overall    smallint CHECK (overall IS NULL OR overall BETWEEN 1 AND 100),
  marker     jsonb CHECK (marker IS NULL OR public.voxen_valid_chart_points(jsonb_build_array(marker), 1)),
  heat       jsonb CHECK (heat IS NULL OR public.voxen_valid_chart_points(heat, 8)),
  note       text CHECK (note IS NULL OR length(note) <= 300),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Uma linha sem nenhuma mudança não serve para nada: voltar ao original é apagar a linha.
  CONSTRAINT voxen_player_charts_has_edit CHECK (stats <> '{}'::jsonb OR overall IS NOT NULL OR marker IS NOT NULL OR heat IS NOT NULL)
);

-- Quem mudou e quando, sempre pelo banco (a tela não consegue gravar outra pessoa no lugar).
CREATE OR REPLACE FUNCTION public.voxen_chart_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
  ELSE
    NEW.player_key := OLD.player_key;
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.note := nullif(btrim(coalesce(NEW.note, '')), '');
  RETURN NEW;
END
$fn$;

REVOKE ALL ON FUNCTION public.voxen_chart_guard() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS voxen_chart_guard ON public.voxen_player_charts;
CREATE TRIGGER voxen_chart_guard BEFORE INSERT OR UPDATE ON public.voxen_player_charts
  FOR EACH ROW EXECUTE FUNCTION public.voxen_chart_guard();

/* ------------------------------------------------------------------ */
/* Acesso                                                              */
/* ------------------------------------------------------------------ */

ALTER TABLE public.voxen_player_charts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.voxen_player_charts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.voxen_player_charts TO authenticated;

DROP POLICY IF EXISTS "Staff can read charts" ON public.voxen_player_charts;
CREATE POLICY "Staff can read charts" ON public.voxen_player_charts FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "Team can insert charts" ON public.voxen_player_charts;
CREATE POLICY "Team can insert charts" ON public.voxen_player_charts FOR INSERT TO authenticated WITH CHECK (public.can_scout());

DROP POLICY IF EXISTS "Team can update charts" ON public.voxen_player_charts;
CREATE POLICY "Team can update charts" ON public.voxen_player_charts FOR UPDATE TO authenticated USING (public.can_scout()) WITH CHECK (public.can_scout());

DROP POLICY IF EXISTS "Team can delete charts" ON public.voxen_player_charts;
CREATE POLICY "Team can delete charts" ON public.voxen_player_charts FOR DELETE TO authenticated USING (public.can_scout());
