-- Área de membros (/membros) e gestão pela VOXEN (/voxen/membros).
--
-- zyron_members       perfis: "membro" (atleta com acesso, ligado a uma conta
--                     pelo e-mail) e "referencia" (perfil de comparação criado
--                     pela equipe, sem conta).
-- zyron_matches       partidas analisadas, com o link do vídeo.
-- zyron_match_events  ações marcadas no vídeo (tempo, posição no campo e
--                     resultado). Delas saem as métricas e o mapa de calor.
--
-- Cada membro lê só o próprio perfil, as próprias partidas publicadas e as
-- referências ativas. Admin (user_roles) faz tudo. Tudo aditivo.

CREATE TABLE IF NOT EXISTS public.zyron_members (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind           text NOT NULL DEFAULT 'membro' CHECK (kind IN ('membro', 'referencia')),
  user_id        uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email          text CHECK (email IS NULL OR (length(email) <= 254 AND email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  full_name      text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 2 AND 120),
  birth_date     date,
  position       text CHECK (position IS NULL OR length(position) <= 40),
  category       text CHECK (category IS NULL OR length(category) <= 20),
  preferred_foot text CHECK (preferred_foot IS NULL OR length(preferred_foot) <= 20),
  height_cm      smallint CHECK (height_cm IS NULL OR height_cm BETWEEN 100 AND 230),
  weight_kg      smallint CHECK (weight_kg IS NULL OR weight_kg BETWEEN 25 AND 160),
  city           text CHECK (city IS NULL OR length(city) <= 80),
  team           text CHECK (team IS NULL OR length(team) <= 80),
  photo_url      text CHECK (photo_url IS NULL OR (length(photo_url) <= 500 AND photo_url ~ '^https://')),
  bio            text CHECK (bio IS NULL OR length(bio) <= 2000),
  scout          jsonb CHECK (scout IS NULL OR (jsonb_typeof(scout) = 'object' AND pg_column_size(scout) <= 4096)),
  lead_id        uuid REFERENCES public.funnel_leads(id) ON DELETE SET NULL,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT zyron_members_email_for_members CHECK (kind = 'referencia' OR email IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS zyron_members_email_key ON public.zyron_members (lower(email)) WHERE email IS NOT NULL;
-- Um lead do funil vira no máximo um membro.
CREATE UNIQUE INDEX IF NOT EXISTS zyron_members_lead_key ON public.zyron_members (lead_id) WHERE lead_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.zyron_matches (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id      uuid NOT NULL REFERENCES public.zyron_members(id) ON DELETE CASCADE,
  played_on      date NOT NULL,
  competition    text CHECK (competition IS NULL OR length(competition) <= 80),
  team           text NOT NULL CHECK (length(btrim(team)) BETWEEN 1 AND 80),
  opponent       text NOT NULL CHECK (length(btrim(opponent)) BETWEEN 1 AND 80),
  is_home        boolean NOT NULL DEFAULT true,
  goals_for      smallint CHECK (goals_for IS NULL OR goals_for BETWEEN 0 AND 99),
  goals_against  smallint CHECK (goals_against IS NULL OR goals_against BETWEEN 0 AND 99),
  minutes        smallint CHECK (minutes IS NULL OR minutes BETWEEN 0 AND 130),
  position       text CHECK (position IS NULL OR length(position) <= 40),
  video_url      text CHECK (video_url IS NULL OR (length(video_url) <= 1000 AND video_url ~ '^https://')),
  rating         numeric(3,1) CHECK (rating IS NULL OR rating BETWEEN 0 AND 10),
  summary        text CHECK (summary IS NULL OR length(summary) <= 4000),
  published      boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS zyron_matches_member_idx ON public.zyron_matches (member_id, played_on DESC);

CREATE TABLE IF NOT EXISTS public.zyron_match_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   uuid NOT NULL REFERENCES public.zyron_matches(id) ON DELETE CASCADE,
  t_seconds  numeric(8,2) NOT NULL CHECK (t_seconds BETWEEN 0 AND 36000),
  half       smallint CHECK (half IS NULL OR half IN (1, 2)),
  action     text NOT NULL CHECK (action ~ '^[a-z_]{2,30}$'),
  success    boolean,
  x          numeric(5,2) NOT NULL CHECK (x BETWEEN 0 AND 100),
  y          numeric(5,2) NOT NULL CHECK (y BETWEEN 0 AND 100),
  note       text CHECK (note IS NULL OR length(note) <= 300),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS zyron_match_events_match_idx ON public.zyron_match_events (match_id, t_seconds);

-- Perfil do membro logado (ativo). SECURITY DEFINER para as policies não
-- dependerem da RLS da própria tabela de membros.
CREATE OR REPLACE FUNCTION public.zyron_current_member_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.zyron_members
   WHERE user_id = auth.uid() AND kind = 'membro' AND active
   LIMIT 1
$$;

-- O perfil pode ser visto por quem está logado: o próprio membro, ou qualquer
-- membro ativo quando o perfil é uma referência.
CREATE OR REPLACE FUNCTION public.zyron_can_view_member(p_member uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.zyron_members m
     WHERE m.id = p_member
       AND m.active
       AND ((m.kind = 'membro' AND m.user_id = auth.uid())
         OR (m.kind = 'referencia' AND public.zyron_current_member_id() IS NOT NULL))
  )
$$;

-- Primeiro acesso: liga o convite (e-mail cadastrado pela equipe) à conta
-- logada, desde que o e-mail da conta esteja confirmado.
CREATE OR REPLACE FUNCTION public.claim_zyron_membership()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_id    uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_id FROM public.zyron_members WHERE user_id = auth.uid() LIMIT 1;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  SELECT lower(email) INTO v_email
    FROM auth.users
   WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.zyron_members
     SET user_id = auth.uid(), updated_at = now()
   WHERE user_id IS NULL AND kind = 'membro' AND lower(email) = v_email
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.zyron_current_member_id() FROM public;
REVOKE ALL ON FUNCTION public.zyron_can_view_member(uuid) FROM public;
REVOKE ALL ON FUNCTION public.claim_zyron_membership() FROM public;
GRANT EXECUTE ON FUNCTION public.zyron_current_member_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.zyron_can_view_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_zyron_membership() TO authenticated;

ALTER TABLE public.zyron_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zyron_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zyron_match_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.zyron_members, public.zyron_matches, public.zyron_match_events FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.zyron_members, public.zyron_matches, public.zyron_match_events TO authenticated;

DROP POLICY IF EXISTS "Admins manage zyron members" ON public.zyron_members;
CREATE POLICY "Admins manage zyron members"
  ON public.zyron_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Members read own profile and references" ON public.zyron_members;
CREATE POLICY "Members read own profile and references"
  ON public.zyron_members FOR SELECT TO authenticated
  USING (public.zyron_can_view_member(id));

DROP POLICY IF EXISTS "Admins manage zyron matches" ON public.zyron_matches;
CREATE POLICY "Admins manage zyron matches"
  ON public.zyron_matches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Members read visible matches" ON public.zyron_matches;
CREATE POLICY "Members read visible matches"
  ON public.zyron_matches FOR SELECT TO authenticated
  USING (published AND public.zyron_can_view_member(member_id));

DROP POLICY IF EXISTS "Admins manage zyron events" ON public.zyron_match_events;
CREATE POLICY "Admins manage zyron events"
  ON public.zyron_match_events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Members read visible events" ON public.zyron_match_events;
CREATE POLICY "Members read visible events"
  ON public.zyron_match_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.zyron_matches mt
     WHERE mt.id = match_id
       AND mt.published
       AND public.zyron_can_view_member(mt.member_id)
  ));
