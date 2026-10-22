-- Importados do CRM: subseções ("de onde especificamente veio") e aprovação em levas.
--
-- "Importado" é tudo o que a ponte da wsltda.com trouxe para a VOXEN, em três formas:
--   * pre     pré-cadastro (lead do CRM que ainda não se cadastrou)         zyron_prospects
--   * conta   atleta com conta que recebeu o contexto do CRM                zyron_member_context (imported_at)
--   * espera  contexto que chegou antes de a pessoa virar membro           crm_context_events (waiting_member)
--
-- Esta migração NÃO mexe em nenhuma dessas tabelas nem na ponte: só acrescenta
--   zyron_import_sections  as subseções que a equipe cria e edita (nome, cor, nota)
--   zyron_import_marks     a subseção e a aprovação de cada importado, chaveadas por (kind, ref)
-- e as funções que a tela usa. Tudo SÓ DA EQUIPE; o atleta não lê nada daqui.
--
-- Aprovar = a equipe conferiu o que veio. Não cria atleta, membro, lead, contato, tarefa nem mensagem.
-- Cada aprovação guarda a revisão que foi conferida: se o CRM mandar uma versão nova depois, o item
-- aparece como "mudou desde a aprovação" e pede nova conferência. A ponte substitui o texto, mas a
-- subseção e a aprovação moram à parte, então nenhuma revisão do CRM as apaga.
-- Aditivo e repetível.

/* ------------------------------------------------------------------ */
/* 1. Subseções e marcas                                               */
/* ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS public.zyron_import_sections (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 60),
  note       text CHECK (note IS NULL OR length(note) <= 300),
  color      text NOT NULL DEFAULT '#fbbf24' CHECK (color ~ '^#[0-9a-f]{6}$'),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS zyron_import_sections_name_key ON public.zyron_import_sections (lower(btrim(name)));

-- Uma linha por importado que tem subseção ou aprovação. `ref` é o id do lead no CRM (pre), o id do
-- membro (conta) ou o id do lead do funil (espera).
CREATE TABLE IF NOT EXISTS public.zyron_import_marks (
  kind              text NOT NULL CHECK (kind IN ('pre', 'conta', 'espera')),
  ref               text NOT NULL CHECK (length(ref) BETWEEN 8 AND 64),
  section_id        uuid REFERENCES public.zyron_import_sections(id) ON DELETE SET NULL,
  approved_at       timestamptz,
  approved_by       uuid,
  approved_revision integer,
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        uuid DEFAULT auth.uid(),
  PRIMARY KEY (kind, ref),
  CONSTRAINT zyron_import_marks_approval_pair CHECK ((approved_at IS NULL) = (approved_revision IS NULL))
);

CREATE INDEX IF NOT EXISTS zyron_import_marks_section_idx ON public.zyron_import_marks (section_id) WHERE section_id IS NOT NULL;

DROP TRIGGER IF EXISTS zyron_touch ON public.zyron_import_sections;
CREATE TRIGGER zyron_touch BEFORE UPDATE ON public.zyron_import_sections FOR EACH ROW EXECUTE FUNCTION public.zyron_touch();

-- Subseções: a equipe lê, cria e edita; excluir é do administrador (as pessoas voltam para "sem subseção").
ALTER TABLE public.zyron_import_sections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.zyron_import_sections FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.zyron_import_sections TO authenticated;

DROP POLICY IF EXISTS "Staff can read zyron_import_sections" ON public.zyron_import_sections;
CREATE POLICY "Staff can read zyron_import_sections"
  ON public.zyron_import_sections FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "Team can insert zyron_import_sections" ON public.zyron_import_sections;
CREATE POLICY "Team can insert zyron_import_sections"
  ON public.zyron_import_sections FOR INSERT TO authenticated WITH CHECK (public.can_scout());

DROP POLICY IF EXISTS "Team can update zyron_import_sections" ON public.zyron_import_sections;
CREATE POLICY "Team can update zyron_import_sections"
  ON public.zyron_import_sections FOR UPDATE TO authenticated USING (public.can_scout()) WITH CHECK (public.can_scout());

DROP POLICY IF EXISTS "Admins can delete zyron_import_sections" ON public.zyron_import_sections;
CREATE POLICY "Admins can delete zyron_import_sections"
  ON public.zyron_import_sections FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Marcas: sem acesso direto de ninguém. Só as funções abaixo (que validam o que existe) leem e gravam.
ALTER TABLE public.zyron_import_marks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.zyron_import_marks FROM anon, authenticated;

/* ------------------------------------------------------------------ */
/* 2. A lista de importados (interna) e o que a tela lê                */
/* ------------------------------------------------------------------ */

-- Tudo o que veio do CRM, uma linha por pessoa, sem os textos longos. Interna: ninguém a chama direto.
CREATE OR REPLACE FUNCTION public.zyron_imported_base()
RETURNS TABLE (
  kind text, ref text, name text, guardian_name text, player_position text, category text, city text,
  answers_count integer, notes_count integer, has_context boolean, review_count integer,
  revision integer, first_at timestamptz, updated_at timestamptz, member_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT 'pre'::text, p.crm_lead_id, p.athlete_name, p.guardian_name, p.position, p.category, p.city,
         jsonb_array_length(p.answers), jsonb_array_length(p.notes),
         (jsonb_array_length(p.answers) > 0 OR jsonb_array_length(p.notes) > 0 OR p.crm_qualification IS NOT NULL
          OR coalesce(p.guardian_name, p.crm_observations, p.past_clubs, p.trials, p.opportunities_received, p.goal, p.blocker,
                      p.evaluated_clubs, p.strengths_and_improvements, p.commitment_score, p.position, p.category, p.team, p.city) IS NOT NULL
          OR p.birth_date IS NOT NULL),
         jsonb_array_length(p.review),
         p.source_revision, p.first_received_at, p.updated_at, NULL::uuid
    FROM public.zyron_prospects p
   WHERE p.linked_member_id IS NULL AND p.discarded_at IS NULL
  UNION ALL
  SELECT 'conta'::text, m.id::text, m.full_name, c.guardian_name, m.position, m.category, m.city,
         jsonb_array_length(c.answers), jsonb_array_length(c.notes),
         (jsonb_array_length(c.answers) > 0 OR jsonb_array_length(c.notes) > 0 OR c.crm_qualification IS NOT NULL
          OR coalesce(c.guardian_name, c.crm_observations, c.current_club, c.past_clubs, c.trials, c.opportunities_received, c.goal,
                      c.blocker, c.evaluated_clubs, c.strengths_and_improvements, c.commitment_score) IS NOT NULL),
         (SELECT count(*)::integer FROM public.zyron_crm_conflicts k WHERE k.member_id = m.id AND k.status = 'aberto'),
         coalesce(c.source_revision, 1),
         coalesce((SELECT min(ev.received_at) FROM public.crm_context_events ev WHERE ev.source_lead_id = m.lead_id), c.imported_at),
         coalesce(c.imported_at, c.updated_at), m.id
    FROM public.zyron_member_context c
    JOIN public.zyron_members m ON m.id = c.member_id
   WHERE c.imported_at IS NOT NULL
  UNION ALL
  SELECT 'espera'::text, e.source_lead_id::text,
         coalesce(nullif(btrim(e.event->'structured'->>'athlete_name'), ''), nullif(btrim(f.name), '')),
         nullif(btrim(coalesce(e.event->'guardian'->>'name', '')), ''),
         nullif(btrim(coalesce(e.parsed->>'position', '')), ''), nullif(btrim(coalesce(e.parsed->>'category', '')), ''),
         nullif(btrim(coalesce(e.parsed->>'city', '')), ''),
         CASE WHEN jsonb_typeof(e.event->'answers') = 'array' THEN jsonb_array_length(e.event->'answers') ELSE 0 END,
         CASE WHEN jsonb_typeof(e.event->'notes') = 'array' THEN jsonb_array_length(e.event->'notes') ELSE 0 END,
         (CASE WHEN jsonb_typeof(e.event->'answers') = 'array' THEN jsonb_array_length(e.event->'answers') ELSE 0 END > 0
          OR CASE WHEN jsonb_typeof(e.event->'notes') = 'array' THEN jsonb_array_length(e.event->'notes') ELSE 0 END > 0
          OR jsonb_typeof(e.event->'context') = 'object'),
         CASE WHEN jsonb_typeof(e.parsed->'review') = 'array' THEN jsonb_array_length(e.parsed->'review') ELSE 0 END,
         e.source_revision, e.received_at, e.received_at, NULL::uuid
    FROM (SELECT DISTINCT ON (source_lead_id) * FROM public.crm_context_events
           WHERE status = 'waiting_member' ORDER BY source_lead_id, source_revision DESC) e
    LEFT JOIN public.funnel_leads f ON f.id = e.source_lead_id
$fn$;

REVOKE ALL ON FUNCTION public.zyron_imported_base() FROM PUBLIC, anon, authenticated;

-- A lista que a tela mostra: cada importado com a sua subseção e a situação da aprovação.
CREATE OR REPLACE FUNCTION public.zyron_imported_list()
RETURNS TABLE (
  kind text, ref text, name text, guardian_name text, player_position text, category text, city text,
  answers_count integer, notes_count integer, has_context boolean, review_count integer,
  revision integer, first_at timestamptz, updated_at timestamptz, member_id uuid,
  section_id uuid, approved_at timestamptz, approved_by_name text, approved_revision integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Somente a equipe.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT b.kind, b.ref, b.name, b.guardian_name, b.player_position, b.category, b.city,
         b.answers_count, b.notes_count, b.has_context, b.review_count,
         b.revision, b.first_at, b.updated_at, b.member_id,
         k.section_id, k.approved_at,
         CASE WHEN k.approved_at IS NULL THEN NULL
              ELSE coalesce(nullif(btrim(pr.full_name), ''), nullif(split_part(u.email, '@', 1), '')) END,
         k.approved_revision
    FROM public.zyron_imported_base() b
    LEFT JOIN public.zyron_import_marks k ON k.kind = b.kind AND k.ref = b.ref
    LEFT JOIN public.profiles pr ON pr.id = k.approved_by
    LEFT JOIN auth.users u ON u.id = k.approved_by
   ORDER BY b.updated_at DESC;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_imported_list() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_imported_list() TO authenticated;

-- Um importado por inteiro, no mesmo formato para as três formas (o que o CRM sabe, sem contato).
CREATE OR REPLACE FUNCTION public.zyron_imported_detail(p_kind text, p_ref text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r   jsonb;
  e   public.crm_context_events%ROWTYPE;
  ctx jsonb;
  par jsonb;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Somente a equipe.' USING ERRCODE = '42501';
  END IF;

  IF p_kind = 'pre' THEN
    SELECT jsonb_build_object(
      'kind', 'pre', 'ref', p.crm_lead_id, 'name', p.athlete_name, 'guardian_name', p.guardian_name,
      'guardian_filled_by_raw', p.guardian_filled_by_raw, 'filled_by', p.filled_by,
      'birth_date', p.birth_date, 'position', p.position, 'category', p.category, 'team', p.team, 'city', p.city,
      'review', p.review, 'current_club', NULL, 'past_clubs', p.past_clubs, 'trials', p.trials,
      'opportunities_received', p.opportunities_received, 'goal', p.goal, 'blocker', p.blocker,
      'evaluated_clubs', p.evaluated_clubs, 'strengths_and_improvements', p.strengths_and_improvements,
      'commitment_score', p.commitment_score, 'crm_observations', p.crm_observations,
      'crm_qualification', p.crm_qualification, 'notes', p.notes, 'answers', p.answers,
      'revision', p.source_revision, 'first_at', p.first_received_at, 'updated_at', p.updated_at, 'member_id', NULL)
      INTO r
      FROM public.zyron_prospects p
     WHERE p.crm_lead_id = p_ref AND p.linked_member_id IS NULL AND p.discarded_at IS NULL;

  ELSIF p_kind = 'conta' THEN
    SELECT jsonb_build_object(
      'kind', 'conta', 'ref', m.id::text, 'name', m.full_name, 'guardian_name', c.guardian_name,
      'guardian_filled_by_raw', c.guardian_filled_by_raw, 'filled_by', c.filled_by,
      'birth_date', m.birth_date, 'position', m.position, 'category', m.category, 'team', m.team, 'city', m.city,
      'review', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                   'field', k.field, 'raw', coalesce(k.raw_value, k.proposed_value, ''), 'kind', k.kind,
                   'current', k.current_value, 'proposed', k.proposed_value) ORDER BY k.created_at), '[]'::jsonb)
                   FROM public.zyron_crm_conflicts k WHERE k.member_id = m.id AND k.status = 'aberto'),
      'current_club', c.current_club, 'past_clubs', c.past_clubs, 'trials', c.trials,
      'opportunities_received', c.opportunities_received, 'goal', c.goal, 'blocker', c.blocker,
      'evaluated_clubs', c.evaluated_clubs, 'strengths_and_improvements', c.strengths_and_improvements,
      'commitment_score', c.commitment_score, 'crm_observations', c.crm_observations,
      'crm_qualification', c.crm_qualification, 'notes', c.notes, 'answers', c.answers,
      'revision', coalesce(c.source_revision, 1), 'first_at',
        coalesce((SELECT min(ev.received_at) FROM public.crm_context_events ev WHERE ev.source_lead_id = m.lead_id), c.imported_at),
      'updated_at', coalesce(c.imported_at, c.updated_at), 'member_id', m.id)
      INTO r
      FROM public.zyron_member_context c
      JOIN public.zyron_members m ON m.id = c.member_id
     WHERE m.id::text = p_ref AND c.imported_at IS NOT NULL;

  ELSIF p_kind = 'espera' THEN
    SELECT * INTO e FROM public.crm_context_events
     WHERE source_lead_id::text = p_ref AND status = 'waiting_member'
     ORDER BY source_revision DESC LIMIT 1;
    IF FOUND THEN
      ctx := CASE WHEN jsonb_typeof(e.event->'context') = 'object' THEN e.event->'context' ELSE '{}'::jsonb END;
      par := coalesce(e.parsed, '{}'::jsonb);
      r := jsonb_build_object(
        'kind', 'espera', 'ref', e.source_lead_id::text,
        'name', coalesce(nullif(btrim(e.event->'structured'->>'athlete_name'), ''),
                         (SELECT nullif(btrim(f.name), '') FROM public.funnel_leads f WHERE f.id = e.source_lead_id)),
        'guardian_name', nullif(btrim(coalesce(e.event->'guardian'->>'name', '')), ''),
        'guardian_filled_by_raw', nullif(btrim(coalesce(e.event->'guardian'->>'filled_by_raw', '')), ''),
        'filled_by', CASE WHEN par->>'filled_by' IN ('atleta', 'responsavel') THEN par->>'filled_by' END,
        'birth_date', CASE WHEN par->>'birth_date' ~ '^\d{4}-\d{2}-\d{2}$' THEN par->>'birth_date' END,
        'position', nullif(btrim(coalesce(par->>'position', '')), ''), 'category', nullif(btrim(coalesce(par->>'category', '')), ''),
        'team', nullif(btrim(coalesce(par->>'team', '')), ''), 'city', nullif(btrim(coalesce(par->>'city', '')), ''),
        'review', CASE WHEN jsonb_typeof(par->'review') = 'array' THEN par->'review' ELSE '[]'::jsonb END,
        'current_club', nullif(btrim(coalesce(e.event->'profile'->>'current_club_raw', '')), ''),
        'past_clubs', nullif(btrim(coalesce(ctx->>'past_clubs', '')), ''), 'trials', nullif(btrim(coalesce(ctx->>'trials', '')), ''),
        'opportunities_received', nullif(btrim(coalesce(ctx->>'opportunities_received', '')), ''),
        'goal', nullif(btrim(coalesce(ctx->>'goal', '')), ''), 'blocker', nullif(btrim(coalesce(ctx->>'blocker', '')), ''),
        'evaluated_clubs', nullif(btrim(coalesce(ctx->>'evaluated_clubs', '')), ''),
        'strengths_and_improvements', nullif(btrim(coalesce(ctx->>'strengths_and_improvements', '')), ''),
        'commitment_score', nullif(btrim(coalesce(ctx->>'commitment_score_raw', '')), ''),
        'crm_observations', nullif(btrim(coalesce(e.event->'crm'->>'observations', '')), ''),
        'crm_qualification', CASE WHEN jsonb_typeof(e.event->'crm'->'qualification') = 'object' THEN e.event->'crm'->'qualification' END,
        'notes', CASE WHEN jsonb_typeof(e.event->'notes') = 'array' THEN e.event->'notes' ELSE '[]'::jsonb END,
        'answers', CASE WHEN jsonb_typeof(e.event->'answers') = 'array' THEN e.event->'answers' ELSE '[]'::jsonb END,
        'revision', e.source_revision, 'first_at', e.received_at, 'updated_at', e.received_at, 'member_id', NULL);
    END IF;
  END IF;

  RETURN r;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_imported_detail(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_imported_detail(text, text) TO authenticated;

-- Quantos importados esperam conferência (nunca aprovados, ou que mudaram depois de aprovados). Para o menu.
CREATE OR REPLACE FUNCTION public.zyron_imported_pending()
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  n integer;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Somente a equipe.' USING ERRCODE = '42501';
  END IF;
  SELECT count(*)::integer INTO n
    FROM public.zyron_imported_base() b
    LEFT JOIN public.zyron_import_marks k ON k.kind = b.kind AND k.ref = b.ref
   WHERE k.approved_at IS NULL OR b.revision > k.approved_revision;
  RETURN n;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_imported_pending() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_imported_pending() TO authenticated;

/* ------------------------------------------------------------------ */
/* 3. Gravar: subseção e aprovação, em levas                           */
/* ------------------------------------------------------------------ */

-- p_items: [{ "kind": "pre", "ref": "..." }, ...]. Só vale o que existe na lista de importados.
-- Subseção nula tira da subseção. Devolve quantos importados foram alterados.
CREATE OR REPLACE FUNCTION public.zyron_import_set_section(p_items jsonb, p_section uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  n integer := 0;
BEGIN
  IF NOT public.can_scout() THEN
    RAISE EXCEPTION 'O seu acesso não permite esta ação.' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 1000 THEN
    RAISE EXCEPTION 'Escolha de 1 a 1000 importados por vez.' USING ERRCODE = '22023';
  END IF;
  IF p_section IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.zyron_import_sections WHERE id = p_section) THEN
    RAISE EXCEPTION 'Subseção não encontrada.' USING ERRCODE = 'P0002';
  END IF;

  IF p_section IS NULL THEN
    WITH picked AS (
      SELECT DISTINCT b.kind, b.ref
        FROM public.zyron_imported_base() b
        JOIN (SELECT x->>'kind' AS kind, x->>'ref' AS ref FROM jsonb_array_elements(p_items) x) w
          ON w.kind = b.kind AND w.ref = b.ref
    ), upd AS (
      UPDATE public.zyron_import_marks k
         SET section_id = NULL, updated_at = now(), updated_by = auth.uid()
        FROM picked p
       WHERE k.kind = p.kind AND k.ref = p.ref AND k.section_id IS NOT NULL
      RETURNING 1
    )
    SELECT count(*)::integer INTO n FROM upd;
    -- Marca sem subseção e sem aprovação não guarda nada: some.
    DELETE FROM public.zyron_import_marks WHERE section_id IS NULL AND approved_at IS NULL;
  ELSE
    WITH picked AS (
      SELECT DISTINCT b.kind, b.ref
        FROM public.zyron_imported_base() b
        JOIN (SELECT x->>'kind' AS kind, x->>'ref' AS ref FROM jsonb_array_elements(p_items) x) w
          ON w.kind = b.kind AND w.ref = b.ref
    ), up AS (
      INSERT INTO public.zyron_import_marks AS k (kind, ref, section_id, updated_by)
      SELECT p.kind, p.ref, p_section, auth.uid() FROM picked p
      ON CONFLICT (kind, ref) DO UPDATE
        SET section_id = EXCLUDED.section_id, updated_at = now(), updated_by = auth.uid()
        WHERE k.section_id IS DISTINCT FROM EXCLUDED.section_id
      RETURNING 1
    )
    SELECT count(*)::integer INTO n FROM up;
  END IF;
  RETURN n;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_import_set_section(jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_import_set_section(jsonb, uuid) TO authenticated;

-- Aprova (ou tira a aprovação de) uma leva. Guarda a revisão conferida: se o CRM mandar uma versão nova,
-- o item volta a pedir conferência. Devolve quantos importados foram alterados.
CREATE OR REPLACE FUNCTION public.zyron_import_approve(p_items jsonb, p_approve boolean)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  n integer := 0;
BEGIN
  IF NOT public.can_scout() THEN
    RAISE EXCEPTION 'O seu acesso não permite esta ação.' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 1000 THEN
    RAISE EXCEPTION 'Escolha de 1 a 1000 importados por vez.' USING ERRCODE = '22023';
  END IF;

  IF coalesce(p_approve, false) THEN
    -- Só mexe no que ainda não foi aprovado ou mudou depois da aprovação (aprovar de novo não troca quem aprovou).
    WITH picked AS (
      SELECT DISTINCT b.kind, b.ref, b.revision
        FROM public.zyron_imported_base() b
        JOIN (SELECT x->>'kind' AS kind, x->>'ref' AS ref FROM jsonb_array_elements(p_items) x) w
          ON w.kind = b.kind AND w.ref = b.ref
    ), up AS (
      INSERT INTO public.zyron_import_marks AS k (kind, ref, approved_at, approved_by, approved_revision, updated_by)
      SELECT p.kind, p.ref, now(), auth.uid(), p.revision, auth.uid() FROM picked p
      ON CONFLICT (kind, ref) DO UPDATE
        SET approved_at = now(), approved_by = auth.uid(), approved_revision = EXCLUDED.approved_revision,
            updated_at = now(), updated_by = auth.uid()
        WHERE k.approved_at IS NULL OR k.approved_revision < EXCLUDED.approved_revision
      RETURNING 1
    )
    SELECT count(*)::integer INTO n FROM up;
  ELSE
    WITH picked AS (
      SELECT DISTINCT b.kind, b.ref
        FROM public.zyron_imported_base() b
        JOIN (SELECT x->>'kind' AS kind, x->>'ref' AS ref FROM jsonb_array_elements(p_items) x) w
          ON w.kind = b.kind AND w.ref = b.ref
    ), upd AS (
      UPDATE public.zyron_import_marks k
         SET approved_at = NULL, approved_by = NULL, approved_revision = NULL, updated_at = now(), updated_by = auth.uid()
        FROM picked p
       WHERE k.kind = p.kind AND k.ref = p.ref AND k.approved_at IS NOT NULL
      RETURNING 1
    )
    SELECT count(*)::integer INTO n FROM upd;
    DELETE FROM public.zyron_import_marks WHERE section_id IS NULL AND approved_at IS NULL;
  END IF;
  RETURN n;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_import_approve(jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_import_approve(jsonb, boolean) TO authenticated;

/* ------------------------------------------------------------------ */
/* 4. A origem acompanha a pessoa quando ela vira atleta               */
/* ------------------------------------------------------------------ */

-- Pré-cadastro (ou contexto que esperava) que vira atleta: a subseção passa para o atleta, para a origem não
-- se perder. A aprovação não passa: ela valia para o texto que foi conferido, e o contexto do atleta é novo.
CREATE OR REPLACE FUNCTION public.zyron_import_carry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_section uuid;
BEGIN
  BEGIN
    SELECT k.section_id INTO v_section
      FROM public.zyron_import_marks k
     WHERE k.section_id IS NOT NULL
       AND ((k.kind = 'pre' AND NEW.crm_lead_id IS NOT NULL AND k.ref = lower(NEW.crm_lead_id))
         OR (k.kind = 'espera' AND k.ref = (SELECT m.lead_id::text FROM public.zyron_members m WHERE m.id = NEW.member_id)))
     ORDER BY k.updated_at DESC
     LIMIT 1;
    IF v_section IS NOT NULL THEN
      INSERT INTO public.zyron_import_marks (kind, ref, section_id, updated_by)
      VALUES ('conta', NEW.member_id::text, v_section, NULL)
      ON CONFLICT (kind, ref) DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'zyron_import_carry falhou para %: %', NEW.member_id, SQLERRM;
  END;
  RETURN NULL;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_import_carry() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS zyron_import_carry ON public.zyron_member_context;
CREATE TRIGGER zyron_import_carry AFTER INSERT OR UPDATE OF crm_lead_id ON public.zyron_member_context
  FOR EACH ROW EXECUTE FUNCTION public.zyron_import_carry();
