-- Importados: dados básicos, levas (quem chegou de novo) e contexto de verdade.
--
-- Muda só a LEITURA da seção Importados (nenhuma tabela, a ponte nem as marcas mudam):
--   * zyron_imported_base() passa a devolver também idade, nascimento, time (para saber quem já tem os dados básicos
--     preenchidos e mostrar esses primeiro) e QUANDO cada versão chegou do CRM ("recibos"), para a tela separar quem
--     é novo de quem já havia sido importado e chegou de novo na leva seguinte.
--   * "tem contexto" passa a querer dizer SÓ contexto de verdade (respostas do formulário, notas, responsável, histórico,
--     objetivo...). Posição, categoria, cidade e time são dados básicos e não contam como contexto.
--   * quem veio antes como pré-cadastro e depois chegou como "aguardando cadastro" aparece UMA vez só (como aguardando),
--     com a subseção que tinha, e marcado "veio antes como pré-cadastro".
--   * zyron_imported_details(): vários detalhes de uma vez, para exportar o contexto em arquivo.
-- Aditivo e repetível.

/* ------------------------------------------------------------------ */
/* 1. Pequenos auxiliares (puros)                                       */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.zyron_any_text(VARIADIC p_texts text[])
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT coalesce(bool_or(btrim(coalesce(x, '')) <> ''), false) FROM unnest(p_texts) AS x
$fn$;

-- "Sim" e parentes não são nome de time (49 membros ficaram assim por um erro do leitor do CRM, já corrigido).
CREATE OR REPLACE FUNCTION public.zyron_team_clean(p_team text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT CASE
    WHEN p_team IS NULL OR btrim(p_team) = '' THEN NULL
    WHEN lower(btrim(translate(p_team, 'ÁÀÂÃÉÊÍÓÔÕÚÇáàâãéêíóôõúç', 'AAAAEEIOOOUCaaaaeeiooouc')))
         IN ('sim', 's', 'nao', 'n', 'nenhum', 'nenhuma', 'sem clube', 'sem time', 'nao tenho', 'x', '-') THEN NULL
    ELSE btrim(p_team)
  END
$fn$;

CREATE OR REPLACE FUNCTION public.zyron_age_ok(p_age integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT CASE WHEN p_age BETWEEN 4 AND 60 THEN p_age END
$fn$;

-- Idade em anos completos a partir do nascimento (fora de 4 a 60 anos: nada).
CREATE OR REPLACE FUNCTION public.zyron_age_from(p_birth date)
RETURNS integer
LANGUAGE sql
STABLE
AS $fn$
  SELECT CASE WHEN p_birth IS NULL THEN NULL ELSE public.zyron_age_ok(extract(year from age(current_date, p_birth))::integer) END
$fn$;

-- A idade que a pessoa digitou no funil ("17"), só se for plausível ("1211" não vale).
CREATE OR REPLACE FUNCTION public.zyron_profile_age(p_profile jsonb)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT public.zyron_age_ok(nullif(left(regexp_replace(coalesce(p_profile->>'age', ''), '[^0-9]', '', 'g'), 3), '')::integer)
$fn$;

-- Nascimento vindo do CRM em texto: só data de verdade, de 1990 até hoje (a mesma regra da ponte).
CREATE OR REPLACE FUNCTION public.zyron_safe_birth(p_text text)
RETURNS date
LANGUAGE plpgsql
STABLE
AS $fn$
DECLARE
  d date;
BEGIN
  IF p_text IS NULL OR p_text !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RETURN NULL;
  END IF;
  d := p_text::date;
  IF d < DATE '1990-01-01' OR d > current_date THEN
    RETURN NULL;
  END IF;
  RETURN d;
EXCEPTION WHEN others THEN
  RETURN NULL;
END
$fn$;

/* ------------------------------------------------------------------ */
/* 2. A lista (interna) e o que a tela lê                               */
/* ------------------------------------------------------------------ */

DROP FUNCTION IF EXISTS public.zyron_imported_list();
DROP FUNCTION IF EXISTS public.zyron_imported_base();

-- Tudo o que veio do CRM, uma linha por pessoa, sem os textos longos. Interna: ninguém a chama direto.
CREATE FUNCTION public.zyron_imported_base()
RETURNS TABLE (
  kind text, ref text, name text, guardian_name text, player_position text, category text, city text, team text,
  birth_date date, age integer, answers_count integer, notes_count integer, has_context boolean, review_count integer,
  revision integer, first_at timestamptz, updated_at timestamptz, receipts timestamptz[], was_prospect boolean, member_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  -- Pré-cadastro: lead do CRM que ainda não se cadastrou. Se o contexto dele já chegou como "aguardando cadastro", ele
  -- aparece lá (uma vez só), não aqui.
  SELECT 'pre'::text, p.crm_lead_id, p.athlete_name, p.guardian_name, p.position, p.category, p.city,
         public.zyron_team_clean(p.team), p.birth_date,
         public.zyron_age_from(p.birth_date),
         jsonb_array_length(p.answers), jsonb_array_length(p.notes),
         (jsonb_array_length(p.answers) > 0 OR jsonb_array_length(p.notes) > 0 OR p.crm_qualification IS NOT NULL
          OR public.zyron_any_text(p.guardian_name, p.crm_observations, p.past_clubs, p.trials, p.opportunities_received, p.goal, p.blocker,
                                   p.evaluated_clubs, p.strengths_and_improvements, p.commitment_score)),
         jsonb_array_length(p.review),
         p.source_revision, p.first_received_at, p.updated_at,
         coalesce((SELECT array_agg(ev.received_at ORDER BY ev.received_at DESC)
                     FROM public.crm_prospect_events ev
                    WHERE ev.source_lead_id::text = p.crm_lead_id AND ev.status = 'applied' AND coalesce(ev.detail->>'ensaio', '') = ''),
                  ARRAY[]::timestamptz[]),
         false, NULL::uuid
    FROM public.zyron_prospects p
   WHERE p.linked_member_id IS NULL AND p.discarded_at IS NULL
     AND NOT EXISTS (SELECT 1 FROM public.crm_context_events w
                      WHERE w.status = 'waiting_member' AND lower(coalesce(w.event->'link'->>'crm_lead_id', '')) = p.crm_lead_id)
  UNION ALL
  -- Atleta com conta: o contexto do CRM mora na ficha do membro; o resto do perfil pode estar no membro ou no funil.
  SELECT 'conta'::text, m.id::text, m.full_name, c.guardian_name,
         coalesce(m.position, nullif(btrim(l.profile->>'position'), '')),
         coalesce(m.category, nullif(btrim(l.profile->>'category'), '')),
         coalesce(m.city, nullif(btrim(l.profile->>'city'), ''), nullif(btrim(l.profile->>'state'), '')),
         public.zyron_team_clean(m.team), m.birth_date,
         coalesce(public.zyron_age_from(m.birth_date), public.zyron_profile_age(l.profile)),
         jsonb_array_length(c.answers), jsonb_array_length(c.notes),
         (jsonb_array_length(c.answers) > 0 OR jsonb_array_length(c.notes) > 0 OR c.crm_qualification IS NOT NULL
          OR public.zyron_any_text(c.guardian_name, c.crm_observations, c.past_clubs, c.trials, c.opportunities_received, c.goal,
                                   c.blocker, c.evaluated_clubs, c.strengths_and_improvements, c.commitment_score)),
         (SELECT count(*)::integer FROM public.zyron_crm_conflicts k WHERE k.member_id = m.id AND k.status = 'aberto'),
         coalesce(c.source_revision, 1),
         coalesce((SELECT min(ev.received_at) FROM public.crm_context_events ev WHERE ev.source_lead_id = m.lead_id AND ev.status <> 'quarantined'), c.imported_at),
         coalesce(c.imported_at, c.updated_at),
         coalesce((SELECT array_agg(ev.received_at ORDER BY ev.received_at DESC)
                     FROM public.crm_context_events ev
                    WHERE ev.source_lead_id = m.lead_id AND ev.status <> 'quarantined'),
                  CASE WHEN c.imported_at IS NOT NULL THEN ARRAY[c.imported_at] ELSE ARRAY[]::timestamptz[] END),
         EXISTS (SELECT 1 FROM public.zyron_prospects zp WHERE zp.linked_member_id = m.id),
         m.id
    FROM public.zyron_member_context c
    JOIN public.zyron_members m ON m.id = c.member_id
    LEFT JOIN public.funnel_leads l ON l.id = m.lead_id
   WHERE c.imported_at IS NOT NULL
  UNION ALL
  -- Aguardando cadastro: o CRM mandou o contexto, mas a pessoa ainda não virou membro.
  SELECT 'espera'::text, e.source_lead_id::text,
         coalesce(nullif(btrim(e.event->'structured'->>'athlete_name'), ''), nullif(btrim(f.name), '')),
         nullif(btrim(coalesce(e.event->'guardian'->>'name', '')), ''),
         coalesce(nullif(btrim(coalesce(e.parsed->>'position', '')), ''), nullif(btrim(f.profile->>'position'), '')),
         coalesce(nullif(btrim(coalesce(e.parsed->>'category', '')), ''), nullif(btrim(f.profile->>'category'), '')),
         coalesce(nullif(btrim(coalesce(e.parsed->>'city', '')), ''), nullif(btrim(f.profile->>'city'), ''), nullif(btrim(f.profile->>'state'), '')),
         public.zyron_team_clean(e.parsed->>'team'), public.zyron_safe_birth(e.parsed->>'birth_date'),
         coalesce(public.zyron_age_from(public.zyron_safe_birth(e.parsed->>'birth_date')), public.zyron_profile_age(f.profile)),
         CASE WHEN jsonb_typeof(e.event->'answers') = 'array' THEN jsonb_array_length(e.event->'answers') ELSE 0 END,
         CASE WHEN jsonb_typeof(e.event->'notes') = 'array' THEN jsonb_array_length(e.event->'notes') ELSE 0 END,
         (CASE WHEN jsonb_typeof(e.event->'answers') = 'array' THEN jsonb_array_length(e.event->'answers') ELSE 0 END > 0
          OR CASE WHEN jsonb_typeof(e.event->'notes') = 'array' THEN jsonb_array_length(e.event->'notes') ELSE 0 END > 0
          OR jsonb_typeof(e.event->'crm'->'qualification') = 'object'
          OR public.zyron_any_text(e.event->'guardian'->>'name', e.event->'crm'->>'observations', e.event->'context'->>'past_clubs',
                                   e.event->'context'->>'trials', e.event->'context'->>'opportunities_received', e.event->'context'->>'goal',
                                   e.event->'context'->>'blocker', e.event->'context'->>'evaluated_clubs',
                                   e.event->'context'->>'strengths_and_improvements', e.event->'context'->>'commitment_score_raw')),
         CASE WHEN jsonb_typeof(e.parsed->'review') = 'array' THEN jsonb_array_length(e.parsed->'review') ELSE 0 END,
         e.source_revision,
         coalesce((SELECT min(ev.received_at) FROM public.crm_context_events ev WHERE ev.source_lead_id = e.source_lead_id AND ev.status <> 'quarantined'), e.received_at),
         e.received_at,
         coalesce((SELECT array_agg(ev.received_at ORDER BY ev.received_at DESC)
                     FROM public.crm_context_events ev
                    WHERE ev.source_lead_id = e.source_lead_id AND ev.status <> 'quarantined'),
                  ARRAY[e.received_at]),
         EXISTS (SELECT 1 FROM public.zyron_prospects zp
                  WHERE zp.crm_lead_id = lower(coalesce(e.event->'link'->>'crm_lead_id', '')) AND zp.discarded_at IS NULL),
         NULL::uuid
    FROM (SELECT DISTINCT ON (source_lead_id) * FROM public.crm_context_events
           WHERE status = 'waiting_member' ORDER BY source_lead_id, source_revision DESC) e
    LEFT JOIN public.funnel_leads f ON f.id = e.source_lead_id
$fn$;

REVOKE ALL ON FUNCTION public.zyron_imported_base() FROM PUBLIC, anon, authenticated;

-- A lista que a tela mostra: cada importado com a sua subseção e a situação da aprovação.
CREATE FUNCTION public.zyron_imported_list()
RETURNS TABLE (
  kind text, ref text, name text, guardian_name text, player_position text, category text, city text, team text,
  birth_date date, age integer, answers_count integer, notes_count integer, has_context boolean, review_count integer,
  revision integer, first_at timestamptz, updated_at timestamptz, receipts timestamptz[], was_prospect boolean, member_id uuid,
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
  SELECT b.kind, b.ref, b.name, b.guardian_name, b.player_position, b.category, b.city, b.team,
         b.birth_date, b.age, b.answers_count, b.notes_count, b.has_context, b.review_count,
         b.revision, b.first_at, b.updated_at, b.receipts, b.was_prospect, b.member_id,
         -- Quem veio como pré-cadastro e agora espera virar membro leva a subseção que já tinha.
         coalesce(k.section_id, k2.section_id), k.approved_at,
         CASE WHEN k.approved_at IS NULL THEN NULL
              ELSE coalesce(nullif(btrim(pr.full_name), ''), nullif(split_part(u.email, '@', 1), '')) END,
         k.approved_revision
    FROM public.zyron_imported_base() b
    LEFT JOIN public.zyron_import_marks k ON k.kind = b.kind AND k.ref = b.ref
    LEFT JOIN public.zyron_import_marks k2 ON b.kind = 'espera' AND k2.kind = 'pre'
         AND k2.ref = (SELECT lower(coalesce(e.event->'link'->>'crm_lead_id', ''))
                         FROM public.crm_context_events e
                        WHERE e.source_lead_id::text = b.ref AND e.status = 'waiting_member'
                        ORDER BY e.source_revision DESC LIMIT 1)
    LEFT JOIN public.profiles pr ON pr.id = k.approved_by
    LEFT JOIN auth.users u ON u.id = k.approved_by
   ORDER BY b.updated_at DESC;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_imported_list() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_imported_list() TO authenticated;

-- Vários importados por inteiro de uma vez (para exportar o contexto em arquivo). De 1 a 60 por chamada.
CREATE OR REPLACE FUNCTION public.zyron_imported_details(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  it  jsonb;
  d   jsonb;
  out jsonb := '[]'::jsonb;
BEGIN
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Somente a equipe.' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) < 1 OR jsonb_array_length(p_items) > 60 THEN
    RAISE EXCEPTION 'Escolha de 1 a 60 importados por vez.' USING ERRCODE = '22023';
  END IF;
  FOR it IN SELECT value FROM jsonb_array_elements(p_items) LOOP
    d := public.zyron_imported_detail(it->>'kind', it->>'ref');
    IF d IS NOT NULL THEN
      out := out || jsonb_build_array(d);
    END IF;
  END LOOP;
  RETURN out;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_imported_details(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_imported_details(jsonb) TO authenticated;
