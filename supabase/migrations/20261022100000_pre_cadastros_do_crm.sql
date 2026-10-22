-- Pré-cadastros do CRM (contrato v1.2 da ponte wsltda.com -> VOXEN).
--
-- A equipe da wsltda.com escolhe leads do CRM que AINDA NÃO se cadastraram na VOXEN e a plataforma os envia
-- como `prospect_context`, chaveado pelo id do lead no CRM (`crm_leads.id`), que não existe na VOXEN. Fica em
-- sincronia: cada mudança vira uma revisão nova que SUBSTITUI o estado anterior.
--
-- Regras (decisão do dono, 22/10/2026):
--   * SÓ DA EQUIPE: a tabela zyron_prospects é lida pela equipe; o atleta não tem nenhuma função que a devolva.
--   * Isto NÃO cria atleta, membro, funnel_lead, tarefa, notificação, e-mail nem WhatsApp. Boa parte são menores
--     e nunca viram contato automático: nenhum gatilho de cadastro olha esta tabela.
--   * Quando a pessoa se cadastra e chega o `athlete_context` com o mesmo `link.crm_lead_id`, o pré-cadastro é
--     ligado ao membro e o texto dele é APAGADO daqui (o contexto completo e atual passa a morar no do membro).
--   * Nunca responde `quarantined` (a wsltda.com não reenvia quarentena: seria perda silenciosa de dado).
--   * O recibo guarda só os ids; o texto mora num lugar só (zyron_prospects).
-- Aditivo e repetível.

CREATE TABLE IF NOT EXISTS public.zyron_prospects (
  crm_lead_id                text PRIMARY KEY CHECK (length(crm_lead_id) BETWEEN 8 AND 64),
  form_lead_id               text CHECK (form_lead_id IS NULL OR length(form_lead_id) <= 64),
  athlete_name               text CHECK (athlete_name IS NULL OR length(athlete_name) <= 200),
  guardian_name              text CHECK (guardian_name IS NULL OR length(guardian_name) <= 200),
  guardian_filled_by_raw     text CHECK (guardian_filled_by_raw IS NULL OR length(guardian_filled_by_raw) <= 500),
  filled_by                  text CHECK (filled_by IS NULL OR filled_by IN ('atleta', 'responsavel')),
  -- Só o que o intérprete entendeu com segurança. O que não deu fica em `review`, com o texto original.
  birth_date                 date,
  position                   text CHECK (position IS NULL OR length(position) <= 40),
  category                   text CHECK (category IS NULL OR length(category) <= 20),
  team                       text CHECK (team IS NULL OR length(team) <= 80),
  city                       text CHECK (city IS NULL OR length(city) <= 80),
  review                     jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(review) = 'array' AND pg_column_size(review) <= 8192),
  past_clubs                 text CHECK (past_clubs IS NULL OR length(past_clubs) <= 2000),
  trials                     text CHECK (trials IS NULL OR length(trials) <= 2000),
  opportunities_received     text CHECK (opportunities_received IS NULL OR length(opportunities_received) <= 2000),
  goal                       text CHECK (goal IS NULL OR length(goal) <= 2000),
  blocker                    text CHECK (blocker IS NULL OR length(blocker) <= 2000),
  evaluated_clubs            text CHECK (evaluated_clubs IS NULL OR length(evaluated_clubs) <= 2000),
  strengths_and_improvements text CHECK (strengths_and_improvements IS NULL OR length(strengths_and_improvements) <= 2000),
  commitment_score           text CHECK (commitment_score IS NULL OR length(commitment_score) <= 200),
  crm_observations           text CHECK (crm_observations IS NULL OR length(crm_observations) <= 10000),
  crm_qualification          jsonb CHECK (crm_qualification IS NULL OR (jsonb_typeof(crm_qualification) = 'object' AND pg_column_size(crm_qualification) <= 16384)),
  notes                      jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(notes) = 'array' AND pg_column_size(notes) <= 262144),
  answers                    jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(answers) = 'array' AND pg_column_size(answers) <= 65536),
  source_revision            integer NOT NULL CHECK (source_revision > 0),
  first_received_at          timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now(),
  -- Virou atleta: ligado ao membro, e o texto daqui foi apagado.
  linked_member_id           uuid REFERENCES public.zyron_members(id) ON DELETE SET NULL,
  linked_at                  timestamptz,
  -- Descartado pelo administrador: o texto foi apagado e as revisões seguintes não repovoam.
  discarded_at               timestamptz,
  discarded_by               uuid
);

CREATE INDEX IF NOT EXISTS zyron_prospects_open_idx ON public.zyron_prospects (updated_at DESC) WHERE linked_member_id IS NULL AND discarded_at IS NULL;

-- Recibo de cada evento de pré-cadastro: só ids, estado e datas.
CREATE TABLE IF NOT EXISTS public.crm_prospect_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL UNIQUE,
  source_project  text NOT NULL CHECK (length(source_project) <= 40),
  source_lead_id  uuid NOT NULL,
  source_revision integer NOT NULL CHECK (source_revision > 0),
  body_sha        text NOT NULL CHECK (body_sha ~ '^[0-9a-f]{64}$'),
  status          text NOT NULL CHECK (status IN ('applied', 'superseded')),
  detail          jsonb,
  received_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_project, source_lead_id, source_revision)
);

ALTER TABLE public.crm_prospect_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_prospect_events FROM anon, authenticated;

ALTER TABLE public.zyron_prospects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.zyron_prospects FROM anon;
GRANT SELECT ON TABLE public.zyron_prospects TO authenticated;

DROP POLICY IF EXISTS "Staff can read zyron_prospects" ON public.zyron_prospects;
CREATE POLICY "Staff can read zyron_prospects"
  ON public.zyron_prospects FOR SELECT TO authenticated USING (public.is_staff());

-- Apaga o texto de um pré-cadastro (ligado a um membro ou descartado). Interna.
CREATE OR REPLACE FUNCTION public.zyron_prospect_clear(p_lead text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $fn$
  UPDATE public.zyron_prospects
     SET athlete_name = NULL, guardian_name = NULL, guardian_filled_by_raw = NULL, filled_by = NULL,
         birth_date = NULL, position = NULL, category = NULL, team = NULL, city = NULL, review = '[]'::jsonb,
         past_clubs = NULL, trials = NULL, opportunities_received = NULL, goal = NULL, blocker = NULL,
         evaluated_clubs = NULL, strengths_and_improvements = NULL, commitment_score = NULL,
         crm_observations = NULL, crm_qualification = NULL, notes = '[]'::jsonb, answers = '[]'::jsonb,
         updated_at = now()
   WHERE crm_lead_id = p_lead
$fn$;

REVOKE ALL ON FUNCTION public.zyron_prospect_clear(text) FROM PUBLIC, anon, authenticated;

-- Quando o atleta se cadastra e o contexto dele chega com o mesmo id de lead do CRM, liga e apaga o texto do pré-cadastro.
CREATE OR REPLACE FUNCTION public.zyron_prospect_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.crm_lead_id IS NULL THEN
    RETURN NULL;
  END IF;
  BEGIN
    IF EXISTS (SELECT 1 FROM public.zyron_prospects WHERE crm_lead_id = lower(NEW.crm_lead_id) AND linked_member_id IS NULL) THEN
      PERFORM public.zyron_prospect_clear(lower(NEW.crm_lead_id));
      UPDATE public.zyron_prospects SET linked_member_id = NEW.member_id, linked_at = now()
       WHERE crm_lead_id = lower(NEW.crm_lead_id) AND linked_member_id IS NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'zyron_prospect_link falhou para %: %', NEW.member_id, SQLERRM;
  END;
  RETURN NULL;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_prospect_link() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS zyron_prospect_link ON public.zyron_member_context;
CREATE TRIGGER zyron_prospect_link AFTER INSERT OR UPDATE OF crm_lead_id ON public.zyron_member_context
  FOR EACH ROW EXECUTE FUNCTION public.zyron_prospect_link();

-- O administrador descarta um pré-cadastro: o texto some e as revisões seguintes não o recriam.
CREATE OR REPLACE FUNCTION public.zyron_discard_prospect(p_lead text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Somente administradores descartam um pré-cadastro.' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.zyron_prospects WHERE crm_lead_id = p_lead) THEN
    RAISE EXCEPTION 'Pré-cadastro não encontrado.' USING ERRCODE = 'P0002';
  END IF;
  PERFORM public.zyron_prospect_clear(p_lead);
  UPDATE public.zyron_prospects SET discarded_at = now(), discarded_by = auth.uid() WHERE crm_lead_id = p_lead;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_discard_prospect(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_discard_prospect(text) TO authenticated;

-- Porta de entrada do prospect_context (só a função crm-context-receiver, com a service role, chama).
-- `p_parsed` é a leitura dos textos feita pela função. Devolve { http, status, receipt_id, event_id }.
-- Status: applied | superseded | duplicate. Nunca `quarantined`.
CREATE OR REPLACE FUNCTION public.crm_prospect_receive(p_event jsonb, p_parsed jsonb, p_sha text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_event   uuid;
  v_lead    uuid;
  v_rev     int;
  v_project text := p_event->>'source_project';
  v_status  text := 'applied';
  v_detail  jsonb := '{}'::jsonb;
  v_id      uuid;
  v_parsed  jsonb := CASE WHEN jsonb_typeof(p_parsed) = 'object' THEN p_parsed ELSE '{}'::jsonb END;
  v_birth   date;
  v_cat     text;
  v_fill    text;
  ctx       jsonb := CASE WHEN jsonb_typeof(p_event->'context') = 'object' THEN p_event->'context' ELSE '{}'::jsonb END;
  e         public.crm_prospect_events%ROWTYPE;
BEGIN
  BEGIN
    v_event := (p_event->>'event_id')::uuid;
    v_lead  := (p_event->>'source_lead_id')::uuid;
    v_rev   := (p_event->>'source_revision')::int;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('http', 400, 'error', 'Evento inválido.');
  END;
  IF v_event IS NULL OR v_lead IS NULL OR v_rev IS NULL OR v_rev < 1 OR coalesce(v_project, '') = '' OR coalesce(p_sha, '') !~ '^[0-9a-f]{64}$'
     OR p_event->>'kind' <> 'prospect_context' THEN
    RETURN jsonb_build_object('http', 400, 'error', 'Evento inválido.');
  END IF;
  IF lower(coalesce(p_event->'link'->>'crm_lead_id', '')) <> lower(v_lead::text) THEN
    RETURN jsonb_build_object('http', 400, 'error', 'No prospect_context, link.crm_lead_id precisa ser igual a source_lead_id.');
  END IF;

  SELECT * INTO e FROM public.crm_prospect_events WHERE event_id = v_event;
  IF FOUND THEN
    IF e.body_sha = p_sha THEN
      RETURN jsonb_build_object('http', 200, 'status', 'duplicate', 'receipt_id', e.id, 'event_id', v_event);
    END IF;
    RETURN jsonb_build_object('http', 409, 'error', 'O mesmo event_id chegou com outro corpo.');
  END IF;
  SELECT * INTO e FROM public.crm_prospect_events WHERE source_project = v_project AND source_lead_id = v_lead AND source_revision = v_rev;
  IF FOUND THEN
    RETURN jsonb_build_object('http', 200, 'status', 'duplicate', 'receipt_id', e.id, 'event_id', v_event);
  END IF;

  IF lower(coalesce(p_event->'link'->>'basis', '')) = 'teste de integração' THEN
    -- Ensaio da wsltda.com: confirma o recibo, mas não guarda nada.
    v_detail := jsonb_build_object('ensaio', true);
  ELSIF EXISTS (SELECT 1 FROM public.crm_prospect_events
                 WHERE source_project = v_project AND source_lead_id = v_lead AND source_revision > v_rev AND status = 'applied') THEN
    v_status := 'superseded';
  ELSIF EXISTS (SELECT 1 FROM public.zyron_member_context WHERE lower(crm_lead_id) = lower(v_lead::text)) THEN
    -- A pessoa já se cadastrou e o contexto completo está no membro: não recria o pré-cadastro.
    v_detail := jsonb_build_object('ja_cadastrado', true);
  ELSE
    v_birth := CASE WHEN v_parsed->>'birth_date' ~ '^\d{4}-\d{2}-\d{2}$' THEN (v_parsed->>'birth_date')::date END;
    IF v_birth IS NOT NULL AND (v_birth < DATE '1990-01-01' OR v_birth > current_date) THEN
      v_birth := NULL;
    END IF;
    v_cat  := CASE WHEN v_parsed->>'category' ~ '^Sub [0-9]{1,2}$' THEN v_parsed->>'category' END;
    v_fill := CASE WHEN v_parsed->>'filled_by' IN ('atleta', 'responsavel') THEN v_parsed->>'filled_by' END;

    INSERT INTO public.zyron_prospects AS z
      (crm_lead_id, form_lead_id, athlete_name, guardian_name, guardian_filled_by_raw, filled_by,
       birth_date, position, category, team, city, review,
       past_clubs, trials, opportunities_received, goal, blocker, evaluated_clubs, strengths_and_improvements, commitment_score,
       crm_observations, crm_qualification, notes, answers, source_revision)
    VALUES
      (lower(v_lead::text),
       nullif(left(p_event->'link'->>'form_lead_id', 64), ''),
       nullif(left(btrim(coalesce(p_event->'structured'->>'athlete_name', '')), 200), ''),
       nullif(left(btrim(coalesce(p_event->'guardian'->>'name', '')), 200), ''),
       nullif(left(btrim(coalesce(p_event->'guardian'->>'filled_by_raw', '')), 500), ''),
       v_fill,
       v_birth,
       nullif(left(btrim(coalesce(v_parsed->>'position', '')), 40), ''),
       v_cat,
       nullif(left(btrim(coalesce(v_parsed->>'team', '')), 80), ''),
       nullif(left(btrim(coalesce(v_parsed->>'city', '')), 80), ''),
       CASE WHEN jsonb_typeof(v_parsed->'review') = 'array' AND pg_column_size(v_parsed->'review') <= 8192 THEN v_parsed->'review' ELSE '[]'::jsonb END,
       nullif(left(btrim(coalesce(ctx->>'past_clubs', '')), 2000), ''),
       nullif(left(btrim(coalesce(ctx->>'trials', '')), 2000), ''),
       nullif(left(btrim(coalesce(ctx->>'opportunities_received', '')), 2000), ''),
       nullif(left(btrim(coalesce(ctx->>'goal', '')), 2000), ''),
       nullif(left(btrim(coalesce(ctx->>'blocker', '')), 2000), ''),
       nullif(left(btrim(coalesce(ctx->>'evaluated_clubs', '')), 2000), ''),
       nullif(left(btrim(coalesce(ctx->>'strengths_and_improvements', '')), 2000), ''),
       nullif(left(btrim(coalesce(ctx->>'commitment_score_raw', '')), 200), ''),
       nullif(left(btrim(coalesce(p_event->'crm'->>'observations', '')), 10000), ''),
       CASE WHEN jsonb_typeof(p_event->'crm'->'qualification') = 'object' AND pg_column_size(p_event->'crm'->'qualification') <= 16384
            THEN p_event->'crm'->'qualification' END,
       CASE WHEN jsonb_typeof(p_event->'notes') = 'array' AND pg_column_size(p_event->'notes') <= 262144 THEN p_event->'notes' ELSE '[]'::jsonb END,
       CASE WHEN jsonb_typeof(p_event->'answers') = 'array' AND pg_column_size(p_event->'answers') <= 65536 THEN p_event->'answers' ELSE '[]'::jsonb END,
       v_rev)
    ON CONFLICT (crm_lead_id) DO UPDATE SET
      -- Cada revisão SUBSTITUI o estado anterior (nota apagada ou editada no CRM some aqui também).
      form_lead_id               = EXCLUDED.form_lead_id,
      athlete_name               = EXCLUDED.athlete_name,
      guardian_name              = EXCLUDED.guardian_name,
      guardian_filled_by_raw     = EXCLUDED.guardian_filled_by_raw,
      filled_by                  = EXCLUDED.filled_by,
      birth_date                 = EXCLUDED.birth_date,
      position                   = EXCLUDED.position,
      category                   = EXCLUDED.category,
      team                       = EXCLUDED.team,
      city                       = EXCLUDED.city,
      review                     = EXCLUDED.review,
      past_clubs                 = EXCLUDED.past_clubs,
      trials                     = EXCLUDED.trials,
      opportunities_received     = EXCLUDED.opportunities_received,
      goal                       = EXCLUDED.goal,
      blocker                    = EXCLUDED.blocker,
      evaluated_clubs            = EXCLUDED.evaluated_clubs,
      strengths_and_improvements = EXCLUDED.strengths_and_improvements,
      commitment_score           = EXCLUDED.commitment_score,
      crm_observations           = EXCLUDED.crm_observations,
      crm_qualification          = EXCLUDED.crm_qualification,
      notes                      = EXCLUDED.notes,
      answers                    = EXCLUDED.answers,
      source_revision            = EXCLUDED.source_revision,
      updated_at                 = now()
    WHERE z.source_revision < EXCLUDED.source_revision AND z.linked_member_id IS NULL AND z.discarded_at IS NULL;
  END IF;

  INSERT INTO public.crm_prospect_events (event_id, source_project, source_lead_id, source_revision, body_sha, status, detail)
  VALUES (v_event, v_project, v_lead, v_rev, p_sha, v_status, v_detail)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('http', 200, 'status', v_status, 'receipt_id', v_id, 'event_id', v_event);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('http', 200, 'status', 'duplicate', 'event_id', v_event);
END
$fn$;

REVOKE ALL ON FUNCTION public.crm_prospect_receive(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_prospect_receive(jsonb, jsonb, text) TO service_role;

-- Saúde da ponte para a equipe: acrescenta quantos pré-cadastros estão abertos (só contagens).
CREATE OR REPLACE FUNCTION public.crm_context_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Somente a equipe.' USING ERRCODE = '42501';
  END IF;
  RETURN jsonb_build_object(
    'recebidos',  (SELECT count(*) FROM public.crm_context_events),
    'aplicados',  (SELECT count(*) FROM public.crm_context_events WHERE status = 'applied'),
    'esperando',  (SELECT count(*) FROM public.crm_context_events WHERE status = 'waiting_member'),
    'quarentena', (SELECT count(*) FROM public.crm_context_events WHERE status = 'quarantined'),
    'conflitos',  (SELECT count(*) FROM public.zyron_crm_conflicts WHERE status = 'aberto'),
    'com_contexto', (SELECT count(*) FROM public.zyron_member_context),
    'pre_cadastros', (SELECT count(*) FROM public.zyron_prospects WHERE linked_member_id IS NULL AND discarded_at IS NULL),
    'ultimo',     (SELECT max(received_at) FROM public.crm_context_events)
  );
END
$fn$;
