-- Ficha completa do membro e o lado da VOXEN na ponte com o CRM (wsltda.com → VOXEN).
--
-- 1. zyron_members ganha telefone, nacionalidade e a marca de origem do CRM. Telefone e nacionalidade
--    vêm sozinhos do cadastro de origem (lead do funil ou conta), só quando estão vazios.
-- 2. A sincronização automática deixa de apagar um campo preenchido quando a origem está vazia.
-- 3. Contexto do atleta vindo do CRM (carreira, avaliações, objetivo...): zyron_member_context, SÓ equipe.
-- 4. Recibos da ponte (crm_context_events) e a fila de conflitos do Scout (zyron_crm_conflicts).
--    crm_context_receive() só é chamada pela função crm-context-receiver (service role): ela só preenche
--    campo vazio; valor diferente do que já existe vira conflito para o Scout decidir.
-- Contrato: PONTE_CRM_PARA_VOXEN.md (Parte A). Tudo aditivo e repetível.

/* ------------------------------------------------------------------ */
/* 1. Colunas novas do membro                                          */
/* ------------------------------------------------------------------ */

ALTER TABLE public.zyron_members
  ADD COLUMN IF NOT EXISTS phone         text,
  ADD COLUMN IF NOT EXISTS nationality   text,
  ADD COLUMN IF NOT EXISTS crm_source    text,
  ADD COLUMN IF NOT EXISTS crm_lead_id   text,
  ADD COLUMN IF NOT EXISTS crm_synced_at timestamptz;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zyron_members_phone_digits') THEN
    ALTER TABLE public.zyron_members ADD CONSTRAINT zyron_members_phone_digits CHECK (phone IS NULL OR phone ~ '^[0-9]{8,15}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zyron_members_nationality_len') THEN
    ALTER TABLE public.zyron_members ADD CONSTRAINT zyron_members_nationality_len CHECK (nationality IS NULL OR length(nationality) <= 60);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zyron_members_crm_len') THEN
    ALTER TABLE public.zyron_members ADD CONSTRAINT zyron_members_crm_len CHECK (
      (crm_source IS NULL OR length(crm_source) <= 20) AND (crm_lead_id IS NULL OR length(crm_lead_id) <= 64));
  END IF;
END
$do$;

-- Telefone e nacionalidade vazios: completa pelo cadastro de origem. Nunca sobrescreve.
CREATE OR REPLACE FUNCTION public.zyron_members_fill_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_phone text;
  v_nat   text;
BEGIN
  IF NEW.kind <> 'membro' THEN
    RETURN NEW;
  END IF;
  IF NEW.phone IS NULL AND NEW.lead_id IS NOT NULL THEN
    SELECT regexp_replace(coalesce(l.phone, ''), '\D', '', 'g') INTO v_phone FROM public.funnel_leads l WHERE l.id = NEW.lead_id;
    IF v_phone ~ '^[0-9]{8,15}$' THEN
      NEW.phone := v_phone;
    END IF;
  END IF;
  IF NEW.nationality IS NULL THEN
    IF NEW.lead_id IS NOT NULL THEN
      SELECT nullif(left(btrim(coalesce(l.profile->>'nationality', '')), 60), '') INTO v_nat FROM public.funnel_leads l WHERE l.id = NEW.lead_id;
    END IF;
    IF v_nat IS NULL AND NEW.athlete_id IS NOT NULL THEN
      SELECT nullif(left(btrim(coalesce(a.nacionalidade, '')), 60), '') INTO v_nat FROM public."Atletas" a WHERE a.id = NEW.athlete_id;
    END IF;
    NEW.nationality := v_nat;
  END IF;
  RETURN NEW;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_members_fill_contact() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS zyron_members_fill_contact ON public.zyron_members;
CREATE TRIGGER zyron_members_fill_contact BEFORE INSERT OR UPDATE ON public.zyron_members
  FOR EACH ROW EXECUTE FUNCTION public.zyron_members_fill_contact();

-- Uma vez: completa quem já existe (pelo caminho da sincronização, sem desligar o automático).
DO $do$
BEGIN
  PERFORM set_config('zyron.sync', 'on', true);
  UPDATE public.zyron_members SET updated_at = updated_at
   WHERE kind = 'membro' AND (phone IS NULL OR nationality IS NULL);
  PERFORM set_config('zyron.sync', '', true);
END
$do$;

/* ------------------------------------------------------------------ */
/* 2. Sincronização: dado vazio na origem não apaga o preenchido       */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.zyron_sync_lead(p_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  l       public.funnel_leads%ROWTYPE;
  m       public.zyron_members%ROWTYPE;
  v_name  text;
  v_email text;
  v_pos   text;
  v_cat   text;
  v_foot  text;
  v_city  text;
  v_h     smallint;
  v_w     smallint;
  n       numeric;
  v_mail_ok boolean;
BEGIN
  SELECT * INTO l FROM public.funnel_leads WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN 'ignorado:nao_existe';
  END IF;

  v_name  := left(btrim(regexp_replace(coalesce(l.name, ''), '\s+', ' ', 'g')), 120);
  v_email := lower(btrim(coalesce(l.email, '')));
  IF NOT public.zyron_real_name(v_name) THEN RETURN 'ignorado:sem_nome_completo'; END IF;
  IF public.zyron_test_email(v_email) THEN RETURN 'ignorado:email_de_teste'; END IF;
  IF length(v_email) > 254 OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN RETURN 'ignorado:email_invalido'; END IF;

  v_pos  := nullif(left(btrim(coalesce(l.profile->>'position', '')), 40), '');
  v_cat  := nullif(left(btrim(coalesce(l.profile->>'category', '')), 20), '');
  v_foot := nullif(left(initcap(lower(btrim(coalesce(l.profile->>'preferredFoot', '')))), 20), '');
  v_city := nullif(left(btrim(coalesce(nullif(btrim(l.profile->>'city'), ''), l.profile->>'state', '')), 80), '');
  n := public.zyron_num(l.profile->>'height'); v_h := CASE WHEN n BETWEEN 100 AND 230 THEN round(n)::smallint END;
  n := public.zyron_num(l.profile->>'weight'); v_w := CASE WHEN n BETWEEN 25 AND 160 THEN round(n)::smallint END;

  SELECT * INTO m FROM public.zyron_members WHERE lead_id = l.id;
  IF FOUND THEN
    IF NOT m.auto_sync THEN
      RETURN 'ja_existe:editado_pela_equipe';
    END IF;
    -- Dado vazio na origem nunca apaga o que já está preenchido (pela ponte do CRM, por exemplo).
    v_pos := coalesce(v_pos, m.position); v_cat := coalesce(v_cat, m.category); v_foot := coalesce(v_foot, m.preferred_foot);
    v_h := coalesce(v_h, m.height_cm); v_w := coalesce(v_w, m.weight_kg); v_city := coalesce(v_city, m.city);
    -- o e-mail só acompanha se a pessoa ainda não ligou a conta e ninguém mais usa o novo
    v_mail_ok := m.user_id IS NULL AND lower(coalesce(m.email, '')) <> v_email
                 AND NOT EXISTS (SELECT 1 FROM public.zyron_members x WHERE lower(x.email) = v_email AND x.id <> m.id);
    IF (m.full_name, m.position, m.category, m.preferred_foot, m.height_cm, m.weight_kg, m.city)
         IS NOT DISTINCT FROM (v_name, v_pos, v_cat, v_foot, v_h, v_w, v_city)
       AND NOT v_mail_ok THEN
      RETURN 'ja_existe:em_dia';
    END IF;
    PERFORM set_config('zyron.sync', 'on', true);
    UPDATE public.zyron_members
       SET full_name = v_name, position = v_pos, category = v_cat, preferred_foot = v_foot,
           height_cm = v_h, weight_kg = v_w, city = v_city,
           email = CASE WHEN v_mail_ok THEN v_email ELSE email END,
           updated_at = now()
     WHERE id = m.id;
    PERFORM set_config('zyron.sync', '', true);
    RETURN 'atualizado';
  END IF;

  IF EXISTS (SELECT 1 FROM public.zyron_member_skips WHERE email = v_email) THEN RETURN 'ignorado:excluido_pela_equipe'; END IF;
  IF EXISTS (SELECT 1 FROM public.zyron_members WHERE lower(email) = v_email) THEN RETURN 'ja_existe:mesmo_email'; END IF;

  INSERT INTO public.zyron_members
    (kind, email, full_name, position, category, preferred_foot, height_cm, weight_kg, city, lead_id, active, auto_sync, created_at, updated_at)
  VALUES
    ('membro', v_email, v_name, v_pos, v_cat, v_foot, v_h, v_w, v_city, l.id, true, true, l.created_at, now());
  RETURN 'criado';
EXCEPTION WHEN unique_violation THEN
  RETURN 'ja_existe:mesmo_email';
END
$fn$;

CREATE OR REPLACE FUNCTION public.zyron_sync_athlete(p_id bigint)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  a       public."Atletas"%ROWTYPE;
  m       public.zyron_members%ROWTYPE;
  v_name  text;
  v_email text;
  v_pos   text;
  v_foot  text;
  v_city  text;
  v_h     smallint;
  v_w     smallint;
  v_mail_ok boolean;
BEGIN
  SELECT * INTO a FROM public."Atletas" WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN 'ignorado:nao_existe';
  END IF;

  v_name := left(btrim(regexp_replace(
              coalesce(nullif(btrim(a.nome), ''), (SELECT nullif(btrim(p.full_name), '') FROM public.profiles p WHERE p.id = a.user_id), ''),
              '\s+', ' ', 'g')), 120);
  -- o e-mail do atleta com conta só existe em auth.users
  v_email := lower(btrim(coalesce((SELECT u.email FROM auth.users u WHERE u.id = a.user_id), '')));
  IF NOT public.zyron_real_name(v_name) THEN RETURN 'ignorado:sem_nome_completo'; END IF;
  IF v_email = '' THEN RETURN 'ignorado:sem_email'; END IF;
  IF public.zyron_test_email(v_email) THEN RETURN 'ignorado:email_de_teste'; END IF;
  IF length(v_email) > 254 OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN RETURN 'ignorado:email_invalido'; END IF;

  v_pos  := nullif(left(btrim(coalesce(a.posicao, '')), 40), '');
  v_foot := nullif(left(initcap(lower(btrim(coalesce(a.melhor_pe, '')))), 20), '');
  v_city := nullif(left(btrim(coalesce(a.cidade, '')), 80), '');
  v_h := CASE WHEN a.altura BETWEEN 100 AND 230 THEN round(a.altura)::smallint END;
  v_w := CASE WHEN a.peso BETWEEN 25 AND 160 THEN round(a.peso)::smallint END;

  SELECT * INTO m FROM public.zyron_members WHERE athlete_id = a.id;
  IF FOUND THEN
    IF NOT m.auto_sync THEN
      RETURN 'ja_existe:editado_pela_equipe';
    END IF;
    -- Dado vazio na origem nunca apaga o que já está preenchido (pela ponte do CRM, por exemplo).
    v_pos := coalesce(v_pos, m.position); v_foot := coalesce(v_foot, m.preferred_foot);
    v_h := coalesce(v_h, m.height_cm); v_w := coalesce(v_w, m.weight_kg); v_city := coalesce(v_city, m.city);
    v_mail_ok := m.user_id IS NULL AND lower(coalesce(m.email, '')) <> v_email
                 AND NOT EXISTS (SELECT 1 FROM public.zyron_members x WHERE lower(x.email) = v_email AND x.id <> m.id);
    IF (m.full_name, m.position, m.preferred_foot, m.height_cm, m.weight_kg, m.city)
         IS NOT DISTINCT FROM (v_name, v_pos, v_foot, v_h, v_w, v_city)
       AND NOT v_mail_ok THEN
      RETURN 'ja_existe:em_dia';
    END IF;
    PERFORM set_config('zyron.sync', 'on', true);
    UPDATE public.zyron_members
       SET full_name = v_name, position = v_pos, preferred_foot = v_foot, height_cm = v_h, weight_kg = v_w, city = v_city,
           email = CASE WHEN v_mail_ok THEN v_email ELSE email END,
           updated_at = now()
     WHERE id = m.id;
    PERFORM set_config('zyron.sync', '', true);
    RETURN 'atualizado';
  END IF;

  IF EXISTS (SELECT 1 FROM public.zyron_member_skips WHERE email = v_email) THEN RETURN 'ignorado:excluido_pela_equipe'; END IF;
  IF EXISTS (SELECT 1 FROM public.zyron_members WHERE lower(email) = v_email) THEN RETURN 'ja_existe:mesmo_email'; END IF;

  INSERT INTO public.zyron_members
    (kind, email, full_name, position, preferred_foot, height_cm, weight_kg, city, athlete_id, active, auto_sync, created_at, updated_at)
  VALUES
    ('membro', v_email, v_name, v_pos, v_foot, v_h, v_w, v_city, a.id, true, true, a.created_at, now());
  RETURN 'criado';
EXCEPTION WHEN unique_violation THEN
  RETURN 'ja_existe:mesmo_email';
END
$fn$;

/* ------------------------------------------------------------------ */
/* 3. Contexto do atleta (só equipe)                                   */
/* ------------------------------------------------------------------ */

-- O que o CRM sabe do atleta e o Scout usa para conhecê-lo. O atleta NUNCA lê (nenhuma função dele
-- devolve esta tabela). `source = 'equipe'`: a equipe editou e a ponte não sobrescreve mais os textos.
CREATE TABLE IF NOT EXISTS public.zyron_member_context (
  member_id              uuid PRIMARY KEY REFERENCES public.zyron_members(id) ON DELETE CASCADE,
  current_club           text CHECK (current_club IS NULL OR length(current_club) <= 120),
  past_clubs             text CHECK (past_clubs IS NULL OR length(past_clubs) <= 2000),
  trials                 text CHECK (trials IS NULL OR length(trials) <= 2000),
  opportunities_received text CHECK (opportunities_received IS NULL OR length(opportunities_received) <= 2000),
  goal                   text CHECK (goal IS NULL OR length(goal) <= 2000),
  blocker                text CHECK (blocker IS NULL OR length(blocker) <= 2000),
  filled_by              text CHECK (filled_by IS NULL OR filled_by IN ('atleta', 'responsavel')),
  answers                jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(answers) = 'array' AND pg_column_size(answers) <= 65536),
  source                 text NOT NULL DEFAULT 'equipe' CHECK (source IN ('crm', 'equipe')),
  crm_lead_id            text CHECK (crm_lead_id IS NULL OR length(crm_lead_id) <= 64),
  crm_form_lead_id       text CHECK (crm_form_lead_id IS NULL OR length(crm_form_lead_id) <= 64),
  source_revision        integer,
  imported_at            timestamptz,
  updated_by             uuid DEFAULT auth.uid(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS zyron_touch ON public.zyron_member_context;
CREATE TRIGGER zyron_touch BEFORE UPDATE ON public.zyron_member_context FOR EACH ROW EXECUTE FUNCTION public.zyron_touch();

/* ------------------------------------------------------------------ */
/* 4. Recibos da ponte e conflitos para o Scout                        */
/* ------------------------------------------------------------------ */

-- Um recibo por evento recebido do CRM. Sem acesso de cliente (nem da equipe): só as funções abaixo.
CREATE TABLE IF NOT EXISTS public.crm_context_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL UNIQUE,
  source_project  text NOT NULL CHECK (length(source_project) <= 40),
  source_lead_id  uuid NOT NULL,
  source_revision integer NOT NULL CHECK (source_revision > 0),
  body_sha        text NOT NULL CHECK (body_sha ~ '^[0-9a-f]{64}$'),
  event           jsonb NOT NULL CHECK (pg_column_size(event) <= 1100000),
  parsed          jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (pg_column_size(parsed) <= 16384),
  member_id       uuid REFERENCES public.zyron_members(id) ON DELETE SET NULL,
  status          text NOT NULL CHECK (status IN ('applied', 'waiting_member', 'superseded', 'quarantined')),
  detail          jsonb,
  error           text CHECK (error IS NULL OR length(error) <= 500),
  received_at     timestamptz NOT NULL DEFAULT now(),
  applied_at      timestamptz,
  UNIQUE (source_project, source_lead_id, source_revision)
);

CREATE INDEX IF NOT EXISTS crm_context_events_lead_idx ON public.crm_context_events (source_lead_id, source_revision DESC);

ALTER TABLE public.crm_context_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_context_events FROM anon, authenticated;

-- O que o CRM trouxe e não entrou sozinho: valor diferente do que já existe ("divergente") ou texto que
-- não deu para interpretar com segurança ("revisar"). O Scout aceita, corrige ou descarta.
CREATE TABLE IF NOT EXISTS public.zyron_crm_conflicts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id      uuid NOT NULL REFERENCES public.zyron_members(id) ON DELETE CASCADE,
  field          text NOT NULL CHECK (field IN ('birth_date', 'position', 'category', 'team', 'city')),
  kind           text NOT NULL CHECK (kind IN ('divergente', 'revisar')),
  current_value  text CHECK (current_value IS NULL OR length(current_value) <= 200),
  proposed_value text CHECK (proposed_value IS NULL OR length(proposed_value) <= 200),
  raw_value      text CHECK (raw_value IS NULL OR length(raw_value) <= 500),
  event_id       uuid,
  status         text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'aceito', 'descartado')),
  resolved_by    uuid,
  resolved_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS zyron_crm_conflicts_open_key ON public.zyron_crm_conflicts (member_id, field) WHERE status = 'aberto';

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['zyron_member_context', 'zyron_crm_conflicts'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Staff can read ' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_staff())', 'Staff can read ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Team can update ' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_scout()) WITH CHECK (public.can_scout())', 'Team can update ' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins can delete ' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), %L))', 'Admins can delete ' || t, t, 'admin');
  END LOOP;
  -- A equipe cria o contexto à mão; conflito só nasce pela ponte.
  DROP POLICY IF EXISTS "Team can insert zyron_member_context" ON public.zyron_member_context;
  CREATE POLICY "Team can insert zyron_member_context" ON public.zyron_member_context
    FOR INSERT TO authenticated WITH CHECK (public.can_scout());
END $$;

-- Abre (ou atualiza) o conflito aberto daquele campo. Não reabre o que o Scout já descartou.
CREATE OR REPLACE FUNCTION public.zyron_crm_conflict(
  p_member uuid, p_field text, p_current text, p_proposed text, p_raw text, p_event uuid, p_kind text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM public.zyron_crm_conflicts
              WHERE member_id = p_member AND field = p_field AND status = 'descartado'
                AND proposed_value IS NOT DISTINCT FROM left(p_proposed, 200)
                AND (p_proposed IS NOT NULL OR raw_value IS NOT DISTINCT FROM left(p_raw, 500))) THEN
    RETURN false;
  END IF;
  INSERT INTO public.zyron_crm_conflicts (member_id, field, kind, current_value, proposed_value, raw_value, event_id)
  VALUES (p_member, p_field, p_kind, left(p_current, 200), left(p_proposed, 200), left(p_raw, 500), p_event)
  ON CONFLICT (member_id, field) WHERE status = 'aberto' DO UPDATE
    SET kind = EXCLUDED.kind, current_value = EXCLUDED.current_value, proposed_value = EXCLUDED.proposed_value,
        raw_value = EXCLUDED.raw_value, event_id = EXCLUDED.event_id, created_at = now();
  RETURN true;
END
$fn$;

-- Aplica um recibo ao membro do lead: preenche só o vazio, abre conflito no que diverge, grava o contexto.
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
     source, crm_lead_id, crm_form_lead_id, source_revision, imported_at, updated_by)
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
     e.source_revision, now(), NULL)
  ON CONFLICT (member_id) DO UPDATE SET
    current_club           = CASE WHEN c.source = 'crm' THEN EXCLUDED.current_club ELSE c.current_club END,
    past_clubs             = CASE WHEN c.source = 'crm' THEN EXCLUDED.past_clubs ELSE c.past_clubs END,
    trials                 = CASE WHEN c.source = 'crm' THEN EXCLUDED.trials ELSE c.trials END,
    opportunities_received = CASE WHEN c.source = 'crm' THEN EXCLUDED.opportunities_received ELSE c.opportunities_received END,
    goal                   = CASE WHEN c.source = 'crm' THEN EXCLUDED.goal ELSE c.goal END,
    blocker                = CASE WHEN c.source = 'crm' THEN EXCLUDED.blocker ELSE c.blocker END,
    filled_by              = coalesce(EXCLUDED.filled_by, c.filled_by),
    answers                = EXCLUDED.answers,
    crm_lead_id            = EXCLUDED.crm_lead_id,
    crm_form_lead_id       = EXCLUDED.crm_form_lead_id,
    source_revision        = EXCLUDED.source_revision,
    imported_at            = now()
  WHERE c.source_revision IS NULL OR c.source_revision <= EXCLUDED.source_revision;

  v_det := jsonb_build_object('preenchidos', to_jsonb(v_fill), 'conflitos', v_conf, 'revisar', v_rev);
  UPDATE public.crm_context_events
     SET status = 'applied', member_id = m.id, applied_at = now(), detail = v_det, error = NULL
   WHERE id = e.id;
  RETURN v_det || jsonb_build_object('status', 'applied');
END
$fn$;

-- Porta de entrada da ponte (só a função crm-context-receiver, com a service role, chama).
-- `p_parsed` é a leitura dos textos feita pela função: { birth_date, position, category, team, city,
-- filled_by, raw: {...}, review: [{ field, raw }] }. Devolve { http, status, receipt_id }.
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
  VALUES (v_event, v_project, v_lead, v_rev, p_sha, p_event, coalesce(p_parsed, '{}'::jsonb), v_status,
          CASE WHEN v_status = 'quarantined' THEN 'Lead desconhecido na VOXEN.' END)
  RETURNING id INTO v_id;

  IF v_status = 'waiting_member' THEN
    UPDATE public.crm_context_events SET status = 'superseded'
     WHERE source_project = v_project AND source_lead_id = v_lead AND id <> v_id AND status = 'waiting_member' AND source_revision < v_rev;
    v_status := coalesce(public.crm_context_apply(v_id)->>'status', v_status);
  END IF;

  RETURN jsonb_build_object('http', 200, 'status', v_status, 'receipt_id', v_id, 'event_id', v_event);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('http', 200, 'status', 'duplicate', 'event_id', v_event);
END
$fn$;

-- Lead que virou membro depois do evento: aplica o recibo mais novo que estava esperando.
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
      UPDATE public.crm_context_events SET status = 'superseded'
       WHERE source_lead_id = NEW.lead_id AND status = 'waiting_member' AND id <> v;
      PERFORM public.crm_context_apply(v);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'crm_context_on_member falhou para %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS crm_context_on_member ON public.zyron_members;
CREATE TRIGGER crm_context_on_member AFTER INSERT OR UPDATE OF lead_id ON public.zyron_members
  FOR EACH ROW EXECUTE FUNCTION public.crm_context_on_member();

-- O Scout decide um conflito: aceita (o valor proposto ou um corrigido) ou descarta.
CREATE OR REPLACE FUNCTION public.zyron_resolve_crm_conflict(p_id uuid, p_accept boolean, p_value text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  c public.zyron_crm_conflicts%ROWTYPE;
  v text;
BEGIN
  IF NOT public.can_scout() THEN
    RAISE EXCEPTION 'Somente a equipe.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO c FROM public.zyron_crm_conflicts WHERE id = p_id AND status = 'aberto' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este conflito já foi resolvido.' USING ERRCODE = 'P0002';
  END IF;
  IF p_accept THEN
    v := nullif(btrim(coalesce(p_value, c.proposed_value, '')), '');
    IF v IS NULL THEN
      RAISE EXCEPTION 'Informe o valor.' USING ERRCODE = '22023';
    END IF;
    CASE c.field
      WHEN 'birth_date' THEN
        IF v !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'Data inválida.' USING ERRCODE = '22023'; END IF;
        UPDATE public.zyron_members SET birth_date = v::date, updated_at = now() WHERE id = c.member_id;
      WHEN 'position' THEN UPDATE public.zyron_members SET position = left(v, 40), updated_at = now() WHERE id = c.member_id;
      WHEN 'category' THEN UPDATE public.zyron_members SET category = left(v, 20), updated_at = now() WHERE id = c.member_id;
      WHEN 'team' THEN UPDATE public.zyron_members SET team = left(v, 80), updated_at = now() WHERE id = c.member_id;
      WHEN 'city' THEN UPDATE public.zyron_members SET city = left(v, 80), updated_at = now() WHERE id = c.member_id;
    END CASE;
  END IF;
  UPDATE public.zyron_crm_conflicts
     SET status = CASE WHEN p_accept THEN 'aceito' ELSE 'descartado' END,
         proposed_value = CASE WHEN p_accept THEN left(v, 200) ELSE proposed_value END,
         resolved_by = auth.uid(), resolved_at = now()
   WHERE id = c.id;
END
$fn$;

-- Saúde da ponte para a equipe (só contagens).
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
    'ultimo',     (SELECT max(received_at) FROM public.crm_context_events)
  );
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_crm_conflict(uuid, text, text, text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_context_apply(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_context_receive(jsonb, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.crm_context_on_member() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.crm_context_receive(jsonb, jsonb, text) TO service_role;
REVOKE ALL ON FUNCTION public.zyron_resolve_crm_conflict(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_resolve_crm_conflict(uuid, boolean, text) TO authenticated;
REVOKE ALL ON FUNCTION public.crm_context_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_context_health() TO authenticated;
