-- Foto escolhida (perfil redondo ou corpo inteiro) e materiais de vídeo de cada jogador.
--
--   * Foto: "aparecer com a foto de perfil (redonda) ou de corpo inteiro" passa a ser escolha do atleta E da
--     equipe. A escolha continua na mesma coluna de antes (zyron_player_controls.body_photo_on: ligada = corpo
--     inteiro), então o que já funciona não muda. Novo: quem escolheu por último e quando (photo_choice_by/at,
--     gravados só pelo gatilho), a função zyron_set_my_photo_mode() para o próprio atleta trocar, e a
--     zyron_my_scout_layer() devolvendo também a foto de corpo inteiro disponível, para o atleta ver as duas
--     opções antes de escolher. Corpo inteiro só existe com a foto enviada pela equipe.
--   * Materiais: voxen_player_materials guarda os vídeos de cada jogador (link do YouTube, Drive, Vimeo ou outro
--     endereço https), pela chave do jogador na VOXEN ('lead:<uuid>' ou 'atleta:<id>', como voxen_player_meta).
--     Só a equipe lê e coloca; remover é do administrador ou de quem colocou o vídeo.
-- Aditivo e repetível.

/* ------------------------------------------------------------------ */
/* 1. A escolha da foto                                                */
/* ------------------------------------------------------------------ */

ALTER TABLE public.zyron_player_controls
  ADD COLUMN IF NOT EXISTS photo_choice_by text CHECK (photo_choice_by IS NULL OR photo_choice_by IN ('atleta', 'equipe'));
ALTER TABLE public.zyron_player_controls
  ADD COLUMN IF NOT EXISTS photo_choice_at timestamptz;

-- Quem escolheu e quando: só este gatilho grava. O atleta escolhe pela função abaixo (que avisa o gatilho);
-- qualquer outra troca é da equipe. Trocar para corpo inteiro sem a foto enviada é recusado aqui, na troca,
-- e não por uma restrição da tabela: a ficha do Scout grava por "upsert" com só as colunas que mudam, e o
-- Postgres confere as restrições na linha proposta antes de ver que ela já existe.
CREATE OR REPLACE FUNCTION public.zyron_photo_choice()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.body_photo_on THEN
      NEW.photo_choice_at := now();
      NEW.photo_choice_by := CASE WHEN current_setting('zyron.photo_by', true) = 'atleta' THEN 'atleta' ELSE 'equipe' END;
    ELSE
      NEW.photo_choice_at := NULL;
      NEW.photo_choice_by := NULL;
    END IF;
  ELSIF NEW.body_photo_on IS DISTINCT FROM OLD.body_photo_on THEN
    IF NEW.body_photo_on AND NEW.body_photo_url IS NULL THEN
      RAISE EXCEPTION 'Envie a foto de corpo inteiro antes de escolher aparecer de corpo inteiro.' USING ERRCODE = '23514';
    END IF;
    NEW.photo_choice_at := now();
    NEW.photo_choice_by := CASE WHEN current_setting('zyron.photo_by', true) = 'atleta' THEN 'atleta' ELSE 'equipe' END;
  ELSE
    NEW.photo_choice_at := OLD.photo_choice_at;
    NEW.photo_choice_by := OLD.photo_choice_by;
  END IF;
  RETURN NEW;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_photo_choice() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS zyron_photo_choice ON public.zyron_player_controls;
CREATE TRIGGER zyron_photo_choice BEFORE INSERT OR UPDATE ON public.zyron_player_controls
  FOR EACH ROW EXECUTE FUNCTION public.zyron_photo_choice();

-- O próprio atleta escolhe como aparece: 'perfil' (foto redonda) ou 'corpo' (corpo inteiro, se a equipe já enviou a foto).
CREATE OR REPLACE FUNCTION public.zyron_set_my_photo_mode(p_mode text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_member uuid;
  v_has    boolean;
  c        public.zyron_player_controls%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Entre na sua conta para escolher a foto.' USING ERRCODE = '42501';
  END IF;
  IF p_mode IS NULL OR p_mode NOT IN ('perfil', 'corpo') THEN
    RAISE EXCEPTION 'Escolha a foto de perfil ou a de corpo inteiro.' USING ERRCODE = '22023';
  END IF;
  v_member := public.zyron_my_member();
  IF v_member IS NULL THEN
    RAISE EXCEPTION 'A sua área ainda não está ligada a um cadastro de atleta. Fale com a equipe.' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO c FROM public.zyron_player_controls WHERE member_id = v_member FOR UPDATE;
  v_has := FOUND;
  IF p_mode = 'corpo' AND (NOT v_has OR c.body_photo_url IS NULL) THEN
    RAISE EXCEPTION 'A sua foto de corpo inteiro ainda não foi feita pela equipe.' USING ERRCODE = 'P0002';
  END IF;

  IF v_has AND c.body_photo_on IS DISTINCT FROM (p_mode = 'corpo') THEN
    PERFORM set_config('zyron.photo_by', 'atleta', true);
    UPDATE public.zyron_player_controls SET body_photo_on = (p_mode = 'corpo'), updated_by = auth.uid()
     WHERE member_id = v_member
    RETURNING * INTO c;
    PERFORM set_config('zyron.photo_by', '', true);
  END IF;

  RETURN jsonb_build_object(
    'photo_mode', CASE WHEN v_has AND c.body_photo_on AND c.body_photo_url IS NOT NULL THEN 'corpo' ELSE 'perfil' END,
    'photo_choice_by', c.photo_choice_by,
    'photo_choice_at', c.photo_choice_at
  );
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_set_my_photo_mode(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_set_my_photo_mode(text) TO authenticated;

-- Tudo o que a equipe publicou para a pessoa logada. Igual a antes, mais a foto de corpo inteiro disponível
-- (body_photo_option, mesmo com a escolha em "perfil") e a escolha atual (photo_mode, quem e quando).
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

/* ------------------------------------------------------------------ */
/* 2. Materiais (vídeos) de cada jogador                               */
/* ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS public.voxen_player_materials (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_key  text NOT NULL CHECK (player_key ~ '^(lead:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|atleta:[0-9]{1,18})$'),
  url         text NOT NULL CHECK (length(url) <= 500 AND url ~ '^https://[^[:space:]<>"]+$'),
  title       text CHECK (title IS NULL OR length(title) BETWEEN 1 AND 80),
  category    text NOT NULL DEFAULT 'lances' CHECK (category IN ('lances', 'jogo', 'gols', 'treino', 'entrevista', 'outro')),
  recorded_on date CHECK (recorded_on IS NULL OR recorded_on >= DATE '2000-01-01'),
  -- Ordem dos quadrados (menor primeiro). "Destacar" põe o vídeo antes de todos.
  position    integer NOT NULL DEFAULT 0 CHECK (position BETWEEN -1000000 AND 1000000),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS voxen_player_materials_key_idx ON public.voxen_player_materials (player_key, position, created_at);
-- O mesmo link não entra duas vezes para o mesmo jogador.
CREATE UNIQUE INDEX IF NOT EXISTS voxen_player_materials_url_key ON public.voxen_player_materials (player_key, url);

-- Quem colocou e quando são do banco; o jogador de um material não muda; até 60 por jogador; textos aparados.
CREATE OR REPLACE FUNCTION public.voxen_material_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.created_at := now();
    IF (SELECT count(*) FROM public.voxen_player_materials WHERE player_key = NEW.player_key) >= 60 THEN
      RAISE EXCEPTION 'Este jogador já tem 60 materiais. Remova algum antes de colocar outro.' USING ERRCODE = '54000';
    END IF;
  ELSE
    NEW.player_key := OLD.player_key;
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  NEW.url := btrim(NEW.url);
  NEW.title := nullif(btrim(NEW.title), '');
  NEW.updated_at := now();
  RETURN NEW;
END
$fn$;

REVOKE ALL ON FUNCTION public.voxen_material_guard() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS voxen_material_guard ON public.voxen_player_materials;
CREATE TRIGGER voxen_material_guard BEFORE INSERT OR UPDATE ON public.voxen_player_materials
  FOR EACH ROW EXECUTE FUNCTION public.voxen_material_guard();

ALTER TABLE public.voxen_player_materials ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.voxen_player_materials FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.voxen_player_materials TO authenticated;

DROP POLICY IF EXISTS "Staff can read voxen_player_materials" ON public.voxen_player_materials;
CREATE POLICY "Staff can read voxen_player_materials"
  ON public.voxen_player_materials FOR SELECT TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS "Team can insert voxen_player_materials" ON public.voxen_player_materials;
CREATE POLICY "Team can insert voxen_player_materials"
  ON public.voxen_player_materials FOR INSERT TO authenticated WITH CHECK (public.can_scout());

DROP POLICY IF EXISTS "Team can update voxen_player_materials" ON public.voxen_player_materials;
CREATE POLICY "Team can update voxen_player_materials"
  ON public.voxen_player_materials FOR UPDATE TO authenticated USING (public.can_scout()) WITH CHECK (public.can_scout());

DROP POLICY IF EXISTS "Admin or author can delete voxen_player_materials" ON public.voxen_player_materials;
CREATE POLICY "Admin or author can delete voxen_player_materials"
  ON public.voxen_player_materials FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR (public.can_scout() AND created_by = auth.uid()));
