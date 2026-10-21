-- Camada do Scout: o que a equipe escreve para cada jogador e o atleta lê (só o que foi publicado).
--
--   zyron_clubs              clubes com escudo próprio (do catálogo da Zyron ou criados pela equipe).
--   zyron_opportunities      oportunidade real de um jogador num clube: compatibilidade, prazo, notas.
--   zyron_player_controls    travas da área do atleta e a foto de corpo inteiro (fora de zyron_members
--                            de propósito: editar aqui não desliga a sincronização automática).
--   zyron_match_submissions  links do YouTube que o atleta envia para análise.
--
-- A equipe (is_staff) lê; quem mantém jogador (can_scout) cria e edita; excluir é só do administrador.
-- O atleta não lê nenhuma dessas tabelas direto: usa zyron_my_scout_layer() (só o publicado, nunca a
-- nota interna) e envia vídeo por zyron_submit_match_video() (validação no servidor).
-- Tudo aditivo e repetível (IF NOT EXISTS / OR REPLACE).

/* ------------------------------------------------------------------ */
/* Tabelas                                                             */
/* ------------------------------------------------------------------ */

-- Imagem guardada no bucket público zyron-media deste projeto.
CREATE OR REPLACE FUNCTION public.zyron_media_url(p text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT p IS NULL OR (length(p) <= 500 AND p ~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/zyron-media/[A-Za-z0-9/_.-]+$')
$fn$;

CREATE TABLE IF NOT EXISTS public.zyron_clubs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 80),
  country    text CHECK (country IS NULL OR length(country) <= 60),
  league     text CHECK (league IS NULL OR length(league) <= 80),
  crest_url  text CHECK (public.zyron_media_url(crest_url)),
  -- Escudo do catálogo (emoji) quando ainda não há imagem.
  emblem     text CHECK (emblem IS NULL OR length(emblem) <= 16),
  color      text CHECK (color IS NULL OR color ~ '^#[0-9a-fA-F]{6}$'),
  catalog_id text UNIQUE CHECK (catalog_id IS NULL OR length(catalog_id) <= 20),
  active     boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.zyron_opportunities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid NOT NULL REFERENCES public.zyron_members(id) ON DELETE CASCADE,
  club_id       uuid NOT NULL REFERENCES public.zyron_clubs(id) ON DELETE RESTRICT,
  compatibility smallint NOT NULL CHECK (compatibility BETWEEN 0 AND 100),
  deadline      date,
  status        text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'enviada', 'encerrada', 'recusada')),
  published     boolean NOT NULL DEFAULT false,
  published_at  timestamptz,
  athlete_note  text CHECK (athlete_note IS NULL OR length(athlete_note) <= 600),
  internal_note text CHECK (internal_note IS NULL OR length(internal_note) <= 2000),
  created_by    uuid DEFAULT auth.uid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS zyron_opportunities_member_idx ON public.zyron_opportunities (member_id, created_at DESC);
-- Um jogador não tem duas oportunidades abertas no mesmo clube.
CREATE UNIQUE INDEX IF NOT EXISTS zyron_opportunities_open_key ON public.zyron_opportunities (member_id, club_id) WHERE status = 'aberta';

-- Travas válidas: { "<parte>": "open" | "locked" } só com as partes da área do atleta.
CREATE OR REPLACE FUNCTION public.zyron_valid_locks(p jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT jsonb_typeof(p) = 'object'
     AND NOT EXISTS (
       SELECT 1 FROM jsonb_each(p) e
        WHERE e.key NOT IN ('opportunities', 'analysis', 'matches', 'performance', 'compare')
           OR e.value NOT IN ('"open"'::jsonb, '"locked"'::jsonb)
     )
$fn$;

CREATE TABLE IF NOT EXISTS public.zyron_player_controls (
  member_id            uuid PRIMARY KEY REFERENCES public.zyron_members(id) ON DELETE CASCADE,
  locks                jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (public.zyron_valid_locks(locks)),
  body_photo_url       text CHECK (public.zyron_media_url(body_photo_url)),
  body_photo_small_url text CHECK (public.zyron_media_url(body_photo_small_url)),
  body_photo_on        boolean NOT NULL DEFAULT false,
  body_photo_style     text NOT NULL DEFAULT 'moldura' CHECK (body_photo_style IN ('moldura', 'recorte')),
  -- A foto anterior, para restaurar: { url, small_url, style }.
  body_photo_prev      jsonb CHECK (body_photo_prev IS NULL OR (jsonb_typeof(body_photo_prev) = 'object' AND pg_column_size(body_photo_prev) <= 2048)),
  kit_club_id          uuid REFERENCES public.zyron_clubs(id) ON DELETE SET NULL,
  -- Na lista da aba Oportunidades (escolhido à mão pela equipe) desde quando; NULL = fora da lista.
  shortlisted_at       timestamptz,
  -- Scout que acompanha o jogador ("Meus jogadores").
  scout_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by           uuid DEFAULT auth.uid(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.zyron_match_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id   uuid REFERENCES public.zyron_members(id) ON DELETE SET NULL,
  video_id    text NOT NULL CHECK (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  url         text NOT NULL CHECK (length(url) <= 300 AND url ~ '^https://www\.youtube\.com/watch\?v=[A-Za-z0-9_-]{11}$'),
  opponent    text CHECK (opponent IS NULL OR length(opponent) <= 80),
  played_on   date CHECK (played_on IS NULL OR played_on >= DATE '2000-01-01'),
  note        text CHECK (note IS NULL OR length(note) <= 500),
  status      text NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'em_analise', 'analisado', 'recusado')),
  match_id    uuid REFERENCES public.zyron_matches(id) ON DELETE SET NULL,
  review_note text CHECK (review_note IS NULL OR length(review_note) <= 500),
  reviewed_by uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS zyron_match_submissions_status_idx ON public.zyron_match_submissions (status, created_at DESC);

/* ------------------------------------------------------------------ */
/* Data da última alteração, sempre pelo banco                         */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.zyron_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_touch() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['zyron_clubs', 'zyron_opportunities', 'zyron_player_controls', 'zyron_match_submissions'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS zyron_touch ON public.%I', t);
    EXECUTE format('CREATE TRIGGER zyron_touch BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.zyron_touch()', t);
  END LOOP;
END $$;

-- Publicar guarda quando; despublicar limpa.
CREATE OR REPLACE FUNCTION public.zyron_opportunity_published_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF NEW.published AND (TG_OP = 'INSERT' OR NOT OLD.published) THEN
    NEW.published_at := now();
  ELSIF NOT NEW.published THEN
    NEW.published_at := NULL;
  END IF;
  RETURN NEW;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_opportunity_published_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS zyron_opportunity_published_at ON public.zyron_opportunities;
CREATE TRIGGER zyron_opportunity_published_at BEFORE INSERT OR UPDATE OF published ON public.zyron_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.zyron_opportunity_published_at();

/* ------------------------------------------------------------------ */
/* Acesso: equipe lê, quem mantém jogador escreve, admin exclui        */
/* ------------------------------------------------------------------ */

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['zyron_clubs', 'zyron_opportunities', 'zyron_player_controls', 'zyron_match_submissions'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Staff can read ' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_staff())', 'Staff can read ' || t, t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Team can update ' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_scout()) WITH CHECK (public.can_scout())', 'Team can update ' || t, t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins can delete ' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.has_role(auth.uid(), %L))', 'Admins can delete ' || t, t, 'admin');

    -- O envio de vídeo só nasce pela função do atleta (com validação); a equipe não cria envio.
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Team can insert ' || t, t);
    IF t <> 'zyron_match_submissions' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_scout())', 'Team can insert ' || t, t);
    END IF;
  END LOOP;
END $$;

/* ------------------------------------------------------------------ */
/* O atleta logado                                                     */
/* ------------------------------------------------------------------ */

-- O cadastro de membro da pessoa logada: pela conta, pelo perfil em "Atletas" ou pelo e-mail confirmado
-- (a mesma regra de zyron_my_journey e claim_zyron_membership).
CREATE OR REPLACE FUNCTION public.zyron_my_member()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  WITH me AS (
    SELECT u.id, CASE WHEN u.email_confirmed_at IS NOT NULL THEN lower(u.email) END AS email
      FROM auth.users u
     WHERE u.id = auth.uid()
  )
  SELECT m.id
    FROM public.zyron_members m
    JOIN me ON true
   WHERE m.kind = 'membro'
     AND (m.user_id = me.id
       OR m.athlete_id IN (SELECT t.id FROM public."Atletas" t WHERE t.user_id = me.id)
       OR (me.email IS NOT NULL AND lower(m.email) = me.email))
   ORDER BY (m.user_id IS NOT DISTINCT FROM me.id) DESC, m.active DESC, m.updated_at DESC
   LIMIT 1
$fn$;

REVOKE ALL ON FUNCTION public.zyron_my_member() FROM PUBLIC, anon, authenticated;

-- O clube como o atleta pode ver (sem quem criou nem datas).
CREATE OR REPLACE FUNCTION public.zyron_club_public(k public.zyron_clubs)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $fn$
  SELECT jsonb_strip_nulls(jsonb_build_object(
    'id', k.id, 'name', k.name, 'country', k.country, 'league', k.league,
    'crest_url', k.crest_url, 'emblem', k.emblem, 'color', k.color, 'catalog_id', k.catalog_id
  ))
$fn$;

REVOKE ALL ON FUNCTION public.zyron_club_public(public.zyron_clubs) FROM PUBLIC, anon, authenticated;

-- Tudo o que a equipe publicou para a pessoa logada: travas, foto de corpo inteiro (se ligada),
-- oportunidades publicadas e em andamento (sem a nota interna) e os vídeos que ela enviou.
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

  RETURN jsonb_build_object(
    'member_id', v_member,
    'locks', coalesce(c.locks, '{}'::jsonb),
    'body_photo', CASE WHEN c.body_photo_on AND c.body_photo_url IS NOT NULL THEN jsonb_strip_nulls(jsonb_build_object(
      'url', c.body_photo_url, 'small_url', c.body_photo_small_url, 'style', c.body_photo_style, 'kit', v_kit)) END,
    'opportunities', coalesce((
      SELECT jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
               'id', o.id, 'club', public.zyron_club_public(k), 'compatibility', o.compatibility, 'deadline', o.deadline,
               'status', o.status, 'athlete_note', o.athlete_note, 'published_at', o.published_at
             )) ORDER BY o.compatibility DESC, o.deadline NULLS LAST)
        FROM public.zyron_opportunities o
        JOIN public.zyron_clubs k ON k.id = o.club_id
       WHERE o.member_id = v_member AND o.published AND o.status IN ('aberta', 'enviada')
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

-- Id do vídeo do YouTube num link (youtube.com/watch?v=, youtu.be/, /embed/, /shorts/, /live/, /v/). NULL se não for.
CREATE OR REPLACE FUNCTION public.zyron_youtube_id(p_url text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $fn$
DECLARE
  v_url  text := btrim(coalesce(p_url, ''));
  v_host text;
BEGIN
  IF length(v_url) > 500 OR v_url !~* '^https://' THEN
    RETURN NULL;
  END IF;
  v_host := lower(substring(v_url from '^[Hh][Tt][Tt][Pp][Ss]://([^/?#:]+)'));
  IF v_host = 'youtu.be' THEN
    RETURN substring(v_url from '^[^:]+://[^/]+/([A-Za-z0-9_-]{11})(?:[?#/&]|$)');
  END IF;
  IF v_host NOT IN ('youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com') THEN
    RETURN NULL;
  END IF;
  RETURN coalesce(
    substring(v_url from '[?&]v=([A-Za-z0-9_-]{11})(?:[&#]|$)'),
    substring(v_url from '^[^:]+://[^/]+/(?:embed|shorts|live|v)/([A-Za-z0-9_-]{11})(?:[?#/&]|$)')
  );
END
$fn$;

-- O atleta envia o link de um jogo para a análise. Só YouTube, até 5 envios esperando a equipe por
-- conta e sem repetir o mesmo vídeo. O link guardado é refeito a partir do id (nunca o texto cru).
CREATE OR REPLACE FUNCTION public.zyron_submit_match_video(
  p_url       text,
  p_opponent  text DEFAULT NULL,
  p_played_on date DEFAULT NULL,
  p_note      text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_id       text;
  v_opponent text := nullif(left(btrim(regexp_replace(coalesce(p_opponent, ''), '\s+', ' ', 'g')), 80), '');
  v_note     text := nullif(left(btrim(coalesce(p_note, '')), 500), '');
  r          public.zyron_match_submissions%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Entre na sua conta para enviar um jogo.' USING ERRCODE = '42501';
  END IF;
  v_id := public.zyron_youtube_id(p_url);
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Envie um link do YouTube (youtube.com ou youtu.be).' USING ERRCODE = '22023';
  END IF;
  IF p_played_on IS NOT NULL AND (p_played_on > current_date + 1 OR p_played_on < DATE '2000-01-01') THEN
    RAISE EXCEPTION 'Confira a data do jogo.' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM public.zyron_match_submissions WHERE user_id = auth.uid() AND video_id = v_id) THEN
    RAISE EXCEPTION 'Este vídeo já foi enviado.' USING ERRCODE = '23505';
  END IF;
  IF (SELECT count(*) FROM public.zyron_match_submissions WHERE user_id = auth.uid() AND status IN ('enviado', 'em_analise')) >= 5 THEN
    RAISE EXCEPTION 'Você já tem 5 jogos esperando a equipe. Assim que ela analisar, dá para enviar outro.' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.zyron_match_submissions (user_id, member_id, video_id, url, opponent, played_on, note)
  VALUES (auth.uid(), public.zyron_my_member(), v_id, 'https://www.youtube.com/watch?v=' || v_id, v_opponent, p_played_on, v_note)
  RETURNING * INTO r;

  RETURN jsonb_strip_nulls(jsonb_build_object(
    'id', r.id, 'video_id', r.video_id, 'opponent', r.opponent, 'played_on', r.played_on, 'note', r.note,
    'status', r.status, 'created_at', r.created_at
  ));
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_youtube_id(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.zyron_submit_match_video(text, text, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_submit_match_video(text, text, date, text) TO authenticated;
