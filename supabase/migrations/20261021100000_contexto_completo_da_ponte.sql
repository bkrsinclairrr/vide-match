-- Contrato v1.1 da ponte CRM (wsltda.com) -> VOXEN: o painel passa a guardar também o nome do responsável,
-- as observações e a qualificação do lead, as notas de atendimento (resumo de WhatsApp, nota manual,
-- transcrição de ligação), os clubes avaliados, os pontos fortes e a nota de compromisso.
--
-- Decisão do dono em 21/10/2026, confirmada por ele na conversa. Tudo isso é SÓ DA EQUIPE: mora em
-- zyron_member_context (a equipe lê; o atleta não tem nenhuma função que devolva esta tabela) e cada nova
-- revisão do atleta SUBSTITUI o estado anterior. O recibo da ponte (crm_context_events) não guarda o texto
-- sensível: depois de aplicar, fica só com os ids. Telefone e e-mail continuam de fora (a função da ponte
-- troca por "[contato removido]" o que for digitado em texto livre).
-- Aditivo e repetível.

ALTER TABLE public.zyron_member_context
  ADD COLUMN IF NOT EXISTS evaluated_clubs            text,
  ADD COLUMN IF NOT EXISTS strengths_and_improvements text,
  ADD COLUMN IF NOT EXISTS commitment_score           text,
  ADD COLUMN IF NOT EXISTS guardian_name              text,
  ADD COLUMN IF NOT EXISTS guardian_filled_by_raw     text,
  ADD COLUMN IF NOT EXISTS crm_observations           text,
  ADD COLUMN IF NOT EXISTS crm_qualification          jsonb,
  ADD COLUMN IF NOT EXISTS notes                      jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zyron_member_context_v11_limits') THEN
    ALTER TABLE public.zyron_member_context ADD CONSTRAINT zyron_member_context_v11_limits CHECK (
      (evaluated_clubs IS NULL OR length(evaluated_clubs) <= 2000)
      AND (strengths_and_improvements IS NULL OR length(strengths_and_improvements) <= 2000)
      AND (commitment_score IS NULL OR length(commitment_score) <= 200)
      AND (guardian_name IS NULL OR length(guardian_name) <= 200)
      AND (guardian_filled_by_raw IS NULL OR length(guardian_filled_by_raw) <= 500)
      AND (crm_observations IS NULL OR length(crm_observations) <= 10000)
      AND (crm_qualification IS NULL OR (jsonb_typeof(crm_qualification) = 'object' AND pg_column_size(crm_qualification) <= 16384))
      AND (jsonb_typeof(notes) = 'array' AND pg_column_size(notes) <= 262144)
    );
  END IF;
END
$do$;

-- O evento sem o texto sensível: só os ids de ligação ficam no recibo.
CREATE OR REPLACE FUNCTION public.crm_context_strip(p_event jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT p_event - 'notes' - 'guardian' - 'crm' - 'context' - 'answers' - 'structured' - 'profile'
$fn$;

REVOKE ALL ON FUNCTION public.crm_context_strip(jsonb) FROM PUBLIC, anon, authenticated;

-- Recibos que já existem (evento de ensaio, por exemplo): tira o texto sensível dos que já foram aplicados,
-- superados ou postos em quarentena. Os que esperam o membro precisam dele para serem aplicados depois.
UPDATE public.crm_context_events
   SET event = public.crm_context_strip(event)
 WHERE status IN ('applied', 'superseded', 'quarantined');

CREATE OR REPLACE FUNCTION public.crm_context_apply(p_receipt uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  e       public.crm_context_events%ROWTYPE;
  m       public.zyron_members%ROWTYPE;
  p       jsonb;
  raw     jsonb;
  ctx     jsonb;
  prof    jsonb;
  it      jsonb;
  v_birth date;
  v_pos   text;
  v_cat   text;
  v_team  text;
  v_city  text;
  v_fill  text[] := '{}';
  v_conf  int := 0;
  v_rev   int := 0;
  v_cur   text;
  v_det   jsonb;
  cut     text := '[[:space:].,;-]+';
BEGIN
  SELECT * INTO e FROM public.crm_context_events WHERE id = p_receipt FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  SELECT * INTO m FROM public.zyron_members WHERE lead_id = e.source_lead_id;
  IF NOT FOUND THEN
    UPDATE public.crm_context_events SET status = 'waiting_member' WHERE id = e.id;
    RETURN jsonb_build_object('status', 'waiting_member');
  END IF;

  p := coalesce(e.parsed, '{}'::jsonb);
  raw := coalesce(p->'raw', '{}'::jsonb);
  v_birth := CASE WHEN p->>'birth_date' ~ '^\d{4}-\d{2}-\d{2}$' THEN (p->>'birth_date')::date END;
  IF v_birth IS NOT NULL AND (v_birth < DATE '1990-01-01' OR v_birth > current_date) THEN
    v_birth := NULL;
  END IF;
  v_pos  := nullif(left(btrim(coalesce(p->>'position', '')), 40), '');
  v_cat  := CASE WHEN p->>'category' ~ '^Sub [0-9]{1,2}$' THEN p->>'category' END;
  v_team := nullif(left(btrim(coalesce(p->>'team', '')), 80), '');
  v_city := nullif(left(btrim(coalesce(p->>'city', '')), 80), '');

  -- Divergência: o membro já tem um valor e o CRM diz outro.
  IF v_birth IS NOT NULL AND m.birth_date IS NOT NULL AND m.birth_date <> v_birth THEN
    IF public.zyron_crm_conflict(m.id, 'birth_date', m.birth_date::text, v_birth::text, raw->>'birth_date', e.event_id, 'divergente') THEN v_conf := v_conf + 1; END IF;
  END IF;
  IF v_pos IS NOT NULL AND m.position IS NOT NULL AND lower(m.position) <> lower(v_pos) THEN
    IF public.zyron_crm_conflict(m.id, 'position', m.position, v_pos, raw->>'position', e.event_id, 'divergente') THEN v_conf := v_conf + 1; END IF;
  END IF;
  IF v_cat IS NOT NULL AND m.category IS NOT NULL AND lower(replace(m.category, '-', ' ')) <> lower(v_cat) THEN
    IF public.zyron_crm_conflict(m.id, 'category', m.category, v_cat, raw->>'category', e.event_id, 'divergente') THEN v_conf := v_conf + 1; END IF;
  END IF;
  IF v_team IS NOT NULL AND m.team IS NOT NULL AND regexp_replace(lower(m.team), cut, ' ', 'g') <> regexp_replace(lower(v_team), cut, ' ', 'g') THEN
    IF public.zyron_crm_conflict(m.id, 'team', m.team, v_team, raw->>'team', e.event_id, 'divergente') THEN v_conf := v_conf + 1; END IF;
  END IF;
  IF v_city IS NOT NULL AND m.city IS NOT NULL AND regexp_replace(lower(m.city), cut, ' ', 'g') <> regexp_replace(lower(v_city), cut, ' ', 'g') THEN
    IF public.zyron_crm_conflict(m.id, 'city', m.city, v_city, raw->>'city', e.event_id, 'divergente') THEN v_conf := v_conf + 1; END IF;
  END IF;

  IF m.birth_date IS NULL AND v_birth IS NOT NULL THEN v_fill := array_append(v_fill, 'birth_date'); END IF;
  IF m.position IS NULL AND v_pos IS NOT NULL THEN v_fill := array_append(v_fill, 'position'); END IF;
  IF m.category IS NULL AND v_cat IS NOT NULL THEN v_fill := array_append(v_fill, 'category'); END IF;
  IF m.team IS NULL AND v_team IS NOT NULL THEN v_fill := array_append(v_fill, 'team'); END IF;
  IF m.city IS NULL AND v_city IS NOT NULL THEN v_fill := array_append(v_fill, 'city'); END IF;

  -- Pelo caminho da sincronização: preencher não desliga o automático nem conta como edição da equipe.
  PERFORM set_config('zyron.sync', 'on', true);
  UPDATE public.zyron_members
     SET birth_date = coalesce(birth_date, v_birth),
         position = coalesce(position, v_pos),
         category = coalesce(category, v_cat),
         team = coalesce(team, v_team),
         city = coalesce(city, v_city),
         crm_source = 'wsltda',
         crm_lead_id = coalesce(nullif(left(e.event->'link'->>'crm_lead_id', 64), ''), crm_lead_id),
         crm_synced_at = now(),
         updated_at = now()
   WHERE id = m.id;
  PERFORM set_config('zyron.sync', '', true);

  -- O que não deu para interpretar vai para revisão, mas só se o campo continua vazio.
  FOR it IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p->'review') = 'array' THEN p->'review' ELSE '[]'::jsonb END) LOOP
    IF it->>'field' IN ('birth_date', 'position', 'category', 'team', 'city') THEN
      EXECUTE format('SELECT %I::text FROM public.zyron_members WHERE id = $1', it->>'field') INTO v_cur USING m.id;
      IF v_cur IS NULL AND public.zyron_crm_conflict(m.id, it->>'field', NULL, NULL, it->>'raw', e.event_id, 'revisar') THEN
        v_rev := v_rev + 1;
      END IF;
    END IF;
  END LOOP;

  ctx  := CASE WHEN jsonb_typeof(e.event->'context') = 'object' THEN e.event->'context' ELSE '{}'::jsonb END;
  prof := CASE WHEN jsonb_typeof(e.event->'profile') = 'object' THEN e.event->'profile' ELSE '{}'::jsonb END;
  INSERT INTO public.zyron_member_context AS c
    (member_id, current_club, past_clubs, trials, opportunities_received, goal, blocker, filled_by, answers,
     source, crm_lead_id, crm_form_lead_id, source_revision, imported_at, updated_by,
     evaluated_clubs, strengths_and_improvements, commitment_score, guardian_name, guardian_filled_by_raw,
     crm_observations, crm_qualification, notes)
  VALUES
    (m.id,
     nullif(left(btrim(coalesce(prof->>'current_club_raw', '')), 120), ''),
     nullif(left(btrim(coalesce(ctx->>'past_clubs', '')), 2000), ''),
     nullif(left(btrim(coalesce(ctx->>'trials', '')), 2000), ''),
     nullif(left(btrim(coalesce(ctx->>'opportunities_received', '')), 2000), ''),
     nullif(left(btrim(coalesce(ctx->>'goal', '')), 2000), ''),
     nullif(left(btrim(coalesce(ctx->>'blocker', '')), 2000), ''),
     CASE WHEN p->>'filled_by' IN ('atleta', 'responsavel') THEN p->>'filled_by' END,
     CASE WHEN jsonb_typeof(e.event->'answers') = 'array' AND pg_column_size(e.event->'answers') <= 65536 THEN e.event->'answers' ELSE '[]'::jsonb END,
     'crm',
     nullif(left(e.event->'link'->>'crm_lead_id', 64), ''),
     nullif(left(e.event->'link'->>'form_lead_id', 64), ''),
     e.source_revision, now(), NULL,
     nullif(left(btrim(coalesce(ctx->>'evaluated_clubs', '')), 2000), ''),
     nullif(left(btrim(coalesce(ctx->>'strengths_and_improvements', '')), 2000), ''),
     nullif(left(btrim(coalesce(ctx->>'commitment_score_raw', '')), 200), ''),
     nullif(left(btrim(coalesce(e.event->'guardian'->>'name', '')), 200), ''),
     nullif(left(btrim(coalesce(e.event->'guardian'->>'filled_by_raw', '')), 500), ''),
     nullif(left(btrim(coalesce(e.event->'crm'->>'observations', '')), 10000), ''),
     CASE WHEN jsonb_typeof(e.event->'crm'->'qualification') = 'object' AND pg_column_size(e.event->'crm'->'qualification') <= 16384
          THEN e.event->'crm'->'qualification' END,
     CASE WHEN jsonb_typeof(e.event->'notes') = 'array' AND pg_column_size(e.event->'notes') <= 262144
          THEN e.event->'notes' ELSE '[]'::jsonb END)
  ON CONFLICT (member_id) DO UPDATE SET
    current_club           = CASE WHEN c.source = 'crm' THEN EXCLUDED.current_club ELSE c.current_club END,
    past_clubs             = CASE WHEN c.source = 'crm' THEN EXCLUDED.past_clubs ELSE c.past_clubs END,
    trials                 = CASE WHEN c.source = 'crm' THEN EXCLUDED.trials ELSE c.trials END,
    opportunities_received = CASE WHEN c.source = 'crm' THEN EXCLUDED.opportunities_received ELSE c.opportunities_received END,
    goal                   = CASE WHEN c.source = 'crm' THEN EXCLUDED.goal ELSE c.goal END,
    blocker                = CASE WHEN c.source = 'crm' THEN EXCLUDED.blocker ELSE c.blocker END,
    filled_by              = coalesce(EXCLUDED.filled_by, c.filled_by),
    answers                = EXCLUDED.answers,
    -- v1.1: cada revisão SUBSTITUI o estado anterior (nota apagada ou editada no CRM some aqui também).
    evaluated_clubs            = CASE WHEN c.source = 'crm' THEN EXCLUDED.evaluated_clubs ELSE c.evaluated_clubs END,
    strengths_and_improvements = CASE WHEN c.source = 'crm' THEN EXCLUDED.strengths_and_improvements ELSE c.strengths_and_improvements END,
    commitment_score       = EXCLUDED.commitment_score,
    guardian_name          = EXCLUDED.guardian_name,
    guardian_filled_by_raw = EXCLUDED.guardian_filled_by_raw,
    crm_observations       = EXCLUDED.crm_observations,
    crm_qualification      = EXCLUDED.crm_qualification,
    notes                  = EXCLUDED.notes,
    crm_lead_id            = EXCLUDED.crm_lead_id,
    crm_form_lead_id       = EXCLUDED.crm_form_lead_id,
    source_revision        = EXCLUDED.source_revision,
    imported_at            = now()
  WHERE c.source_revision IS NULL OR c.source_revision <= EXCLUDED.source_revision;

  v_det := jsonb_build_object('preenchidos', to_jsonb(v_fill), 'conflitos', v_conf, 'revisar', v_rev);
  -- O texto sensível mora num lugar só (zyron_member_context, só equipe): o recibo guarda apenas os ids.
  UPDATE public.crm_context_events
     SET status = 'applied', member_id = m.id, applied_at = now(), detail = v_det, error = NULL,
         event = public.crm_context_strip(event)
   WHERE id = e.id;
  RETURN v_det || jsonb_build_object('status', 'applied');
END
$fn$;

CREATE OR REPLACE FUNCTION public.crm_context_receive(p_event jsonb, p_parsed jsonb, p_sha text)
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
  v_status  text;
  v_id      uuid;
  e         public.crm_context_events%ROWTYPE;
BEGIN
  BEGIN
    v_event := (p_event->>'event_id')::uuid;
    v_lead  := (p_event->>'source_lead_id')::uuid;
    v_rev   := (p_event->>'source_revision')::int;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('http', 400, 'error', 'Evento inválido.');
  END;
  IF v_event IS NULL OR v_lead IS NULL OR v_rev IS NULL OR v_rev < 1 OR coalesce(v_project, '') = '' OR coalesce(p_sha, '') !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('http', 400, 'error', 'Evento inválido.');
  END IF;

  SELECT * INTO e FROM public.crm_context_events WHERE event_id = v_event;
  IF FOUND THEN
    IF e.body_sha = p_sha THEN
      RETURN jsonb_build_object('http', 200, 'status', 'duplicate', 'receipt_id', e.id, 'event_id', v_event);
    END IF;
    RETURN jsonb_build_object('http', 409, 'error', 'O mesmo event_id chegou com outro corpo.');
  END IF;
  SELECT * INTO e FROM public.crm_context_events WHERE source_project = v_project AND source_lead_id = v_lead AND source_revision = v_rev;
  IF FOUND THEN
    RETURN jsonb_build_object('http', 200, 'status', 'duplicate', 'receipt_id', e.id, 'event_id', v_event);
  END IF;

  v_status := CASE
    WHEN NOT EXISTS (SELECT 1 FROM public.funnel_leads WHERE id = v_lead) THEN 'quarantined'
    WHEN EXISTS (SELECT 1 FROM public.crm_context_events
                  WHERE source_project = v_project AND source_lead_id = v_lead AND source_revision > v_rev
                    AND status IN ('applied', 'waiting_member')) THEN 'superseded'
    ELSE 'waiting_member'
  END;

  INSERT INTO public.crm_context_events (event_id, source_project, source_lead_id, source_revision, body_sha, event, parsed, status, error)
  VALUES (v_event, v_project, v_lead, v_rev, p_sha,
          CASE WHEN v_status IN ('quarantined', 'superseded') THEN public.crm_context_strip(p_event) ELSE p_event END,
          coalesce(p_parsed, '{}'::jsonb), v_status,
          CASE WHEN v_status = 'quarantined' THEN 'Lead desconhecido na VOXEN.' END)
  RETURNING id INTO v_id;

  IF v_status = 'waiting_member' THEN
    UPDATE public.crm_context_events SET status = 'superseded', event = public.crm_context_strip(event)
     WHERE source_project = v_project AND source_lead_id = v_lead AND id <> v_id AND status = 'waiting_member' AND source_revision < v_rev;
    v_status := coalesce(public.crm_context_apply(v_id)->>'status', v_status);
  END IF;

  RETURN jsonb_build_object('http', 200, 'status', v_status, 'receipt_id', v_id, 'event_id', v_event);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('http', 200, 'status', 'duplicate', 'event_id', v_event);
END
$fn$;

CREATE OR REPLACE FUNCTION public.crm_context_on_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v uuid;
BEGIN
  IF NEW.lead_id IS NULL THEN
    RETURN NULL;
  END IF;
  BEGIN
    SELECT id INTO v FROM public.crm_context_events
     WHERE source_lead_id = NEW.lead_id AND status = 'waiting_member'
     ORDER BY source_revision DESC LIMIT 1;
    IF v IS NOT NULL THEN
      UPDATE public.crm_context_events SET status = 'superseded', event = public.crm_context_strip(event)
       WHERE source_lead_id = NEW.lead_id AND status = 'waiting_member' AND id <> v;
      PERFORM public.crm_context_apply(v);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'crm_context_on_member falhou para %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END
$fn$;


REVOKE ALL ON FUNCTION public.crm_context_apply(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_context_receive(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_context_on_member() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_context_receive(jsonb, jsonb, text) TO service_role;
