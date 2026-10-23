-- Oportunidade com proposta: além do clube, da compatibilidade e do prazo, o que o clube oferece.
--
--   kind             tipo: avaliacao (teste), formacao (contrato de formação), profissional,
--                    emprestimo, bolsa (bolsa de estudos) ou outro
--   position         a posição que o clube procura
--   category         a categoria (Sub 17, Sub 20, Profissional...)
--   amount           valor da proposta, na moeda e no período abaixo (NULL = a combinar)
--   currency         BRL, EUR, USD ou GBP
--   amount_period    mes, ano ou total (o contrato inteiro)
--   signing_bonus    luvas, na mesma moeda
--   contract_months  duração do contrato, em meses
--   starts_on        início previsto (apresentação no clube)
--   benefits         moradia, alimentacao, estudos, transporte, saude, passagens
--   urgency          baixa, media, alta ou urgente
--   status           ganha "negociacao" (em andamento) e "aceita" (fim feliz)
--
-- Tudo isso é da equipe. O atleta continua vendo, por zyron_my_scout_layer(), só o clube, o encaixe,
-- o prazo, a situação e o recado: valor, urgência e nota interna não saem do painel. A única mudança
-- para ele é que a oportunidade "em negociação" continua aparecendo (ainda está em andamento).
--
-- Aditivo e repetível. Em 23/10 não havia nenhuma oportunidade no banco: nenhuma linha muda.

/* ------------------------------------------------------------------ */
/* Colunas da proposta                                                 */
/* ------------------------------------------------------------------ */

ALTER TABLE public.zyron_opportunities
  ADD COLUMN IF NOT EXISTS kind text
    CHECK (kind IS NULL OR kind IN ('avaliacao', 'formacao', 'profissional', 'emprestimo', 'bolsa', 'outro')),
  ADD COLUMN IF NOT EXISTS position text
    CHECK (position IS NULL OR length(position) BETWEEN 2 AND 40),
  ADD COLUMN IF NOT EXISTS category text
    CHECK (category IS NULL OR length(category) BETWEEN 2 AND 30),
  ADD COLUMN IF NOT EXISTS amount numeric(14, 2)
    CHECK (amount IS NULL OR (amount > 0 AND amount < 1e12)),
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BRL'
    CHECK (currency IN ('BRL', 'EUR', 'USD', 'GBP')),
  ADD COLUMN IF NOT EXISTS amount_period text NOT NULL DEFAULT 'mes'
    CHECK (amount_period IN ('mes', 'ano', 'total')),
  ADD COLUMN IF NOT EXISTS signing_bonus numeric(14, 2)
    CHECK (signing_bonus IS NULL OR (signing_bonus > 0 AND signing_bonus < 1e12)),
  ADD COLUMN IF NOT EXISTS contract_months smallint
    CHECK (contract_months IS NULL OR contract_months BETWEEN 1 AND 120),
  ADD COLUMN IF NOT EXISTS starts_on date
    CHECK (starts_on IS NULL OR starts_on >= DATE '2000-01-01'),
  ADD COLUMN IF NOT EXISTS benefits text[] NOT NULL DEFAULT '{}'
    CHECK (cardinality(benefits) <= 6 AND benefits <@ ARRAY['moradia', 'alimentacao', 'estudos', 'transporte', 'saude', 'passagens']::text[]),
  ADD COLUMN IF NOT EXISTS urgency text NOT NULL DEFAULT 'media'
    CHECK (urgency IN ('baixa', 'media', 'alta', 'urgente'));

-- Duas situações novas: "em negociação" (em andamento) e "aceita" (fim, como encerrada e recusada).
ALTER TABLE public.zyron_opportunities DROP CONSTRAINT IF EXISTS zyron_opportunities_status_check;
ALTER TABLE public.zyron_opportunities ADD CONSTRAINT zyron_opportunities_status_check
  CHECK (status IN ('aberta', 'enviada', 'negociacao', 'aceita', 'encerrada', 'recusada'));

-- Texto aparado (em branco vira vazio) e benefícios sem repetição, antes das regras acima.
CREATE OR REPLACE FUNCTION public.zyron_opportunity_tidy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  NEW.position := nullif(btrim(regexp_replace(coalesce(NEW.position, ''), '\s+', ' ', 'g')), '');
  NEW.category := nullif(btrim(regexp_replace(coalesce(NEW.category, ''), '\s+', ' ', 'g')), '');
  NEW.benefits := coalesce((SELECT array_agg(DISTINCT b ORDER BY b) FROM unnest(NEW.benefits) b WHERE b IS NOT NULL), '{}');
  RETURN NEW;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_opportunity_tidy() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS zyron_opportunity_tidy ON public.zyron_opportunities;
CREATE TRIGGER zyron_opportunity_tidy BEFORE INSERT OR UPDATE ON public.zyron_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.zyron_opportunity_tidy();

/* ------------------------------------------------------------------ */
/* O atleta: a mesma saída de antes, com "em negociação" em andamento  */
/* ------------------------------------------------------------------ */

-- Igual à versão de 20261025100000_foto_escolhida_e_materiais; só a lista de situações mudou.
CREATE OR REPLACE FUNCTION public.zyron_my_scout_layer()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_member uuid;
  c        public.zyron_player_controls%ROWTYPE;
  v_kit    jsonb;
  v_photo  jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  v_member := public.zyron_my_member();

  IF v_member IS NOT NULL THEN
    SELECT * INTO c FROM public.zyron_player_controls WHERE member_id = v_member;
    IF c.kit_club_id IS NOT NULL THEN
      SELECT public.zyron_club_public(k) INTO v_kit FROM public.zyron_clubs k WHERE k.id = c.kit_club_id;
    END IF;
  END IF;

  IF c.body_photo_url IS NOT NULL THEN
    v_photo := jsonb_strip_nulls(jsonb_build_object(
      'url', c.body_photo_url, 'small_url', c.body_photo_small_url, 'style', c.body_photo_style, 'kit', v_kit));
  END IF;

  RETURN jsonb_build_object(
    'member_id', v_member,
    'locks', coalesce(c.locks, '{}'::jsonb),
    'body_photo', CASE WHEN c.body_photo_on THEN v_photo END,
    'body_photo_option', v_photo,
    'photo_mode', CASE WHEN c.body_photo_on AND v_photo IS NOT NULL THEN 'corpo' ELSE 'perfil' END,
    'photo_choice_by', c.photo_choice_by,
    'photo_choice_at', c.photo_choice_at,
    'opportunities', coalesce((
      SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
               'id', o.id, 'club', public.zyron_club_public(k), 'compatibility', o.compatibility, 'deadline', o.deadline,
               'status', o.status, 'athlete_note', o.athlete_note, 'published_at', o.published_at
             )) ORDER BY o.compatibility DESC, o.deadline NULLS LAST)
        FROM public.zyron_opportunities o
        JOIN public.zyron_clubs k ON k.id = o.club_id
       WHERE o.member_id = v_member AND o.published AND o.status IN ('aberta', 'enviada', 'negociacao')
    ), '[]'::jsonb),
    'submissions', coalesce((
      SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
               'id', s.id, 'video_id', s.video_id, 'opponent', s.opponent, 'played_on', s.played_on, 'note', s.note,
               'status', s.status, 'review_note', s.review_note, 'match_id', s.match_id, 'created_at', s.created_at
             )) ORDER BY s.created_at DESC)
        FROM public.zyron_match_submissions s
       WHERE s.user_id = auth.uid()
    ), '[]'::jsonb)
  );
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_my_scout_layer() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_my_scout_layer() TO authenticated;
