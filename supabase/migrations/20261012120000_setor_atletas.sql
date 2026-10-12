-- Setor Atletas: os atletas que a equipe escolheu para trabalhar com mais cuidado.
--
-- Cada ficha nasce de um cadastro (lead do funil, conta em "Atletas" ou membro) ou é criada do zero.
-- Ela guarda uma cópia dos dados (a equipe completa e corrige sem mexer na origem) e o acompanhamento:
--   * temperatura: frio, morno ou quente;
--   * encaminhado ou não (para onde e quando: clube, peneira, avaliação...);
--   * em trabalho de assessoria ou não (desde quando);
--   * próximo passo (com data) e notas da equipe.
-- Uma ficha por pessoa: o mesmo lead, conta, membro ou e-mail não entra duas vezes.
-- A equipe (administrador e executivo) lê; só o administrador grava.
-- Tudo aditivo e repetível (IF NOT EXISTS / OR REPLACE). Nada que já existe é alterado.

CREATE TABLE IF NOT EXISTS public.zyron_athletes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin            text NOT NULL DEFAULT 'manual' CHECK (origin IN ('funil', 'conta', 'membro', 'manual')),
  lead_id           uuid REFERENCES public.funnel_leads(id) ON DELETE SET NULL,
  athlete_id        bigint REFERENCES public."Atletas"(id) ON DELETE SET NULL,
  member_id         uuid REFERENCES public.zyron_members(id) ON DELETE SET NULL,
  full_name         text NOT NULL CHECK (length(btrim(full_name)) BETWEEN 2 AND 120),
  email             text CHECK (email IS NULL OR (length(email) <= 254 AND email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  phone             text CHECK (phone IS NULL OR phone ~ '^[0-9]{8,15}$'),
  birth_date        date CHECK (birth_date IS NULL OR birth_date >= DATE '1950-01-01'),
  age               smallint CHECK (age IS NULL OR age BETWEEN 4 AND 60),
  nationality       text CHECK (nationality IS NULL OR length(nationality) <= 60),
  position          text CHECK (position IS NULL OR length(position) <= 40),
  category          text CHECK (category IS NULL OR length(category) <= 20),
  preferred_foot    text CHECK (preferred_foot IS NULL OR length(preferred_foot) <= 20),
  height_cm         smallint CHECK (height_cm IS NULL OR height_cm BETWEEN 100 AND 230),
  weight_kg         smallint CHECK (weight_kg IS NULL OR weight_kg BETWEEN 25 AND 160),
  city              text CHECK (city IS NULL OR length(city) <= 80),
  team              text CHECK (team IS NULL OR length(team) <= 80),
  temperature       text NOT NULL DEFAULT 'morno' CHECK (temperature IN ('frio', 'morno', 'quente')),
  forwarded         boolean NOT NULL DEFAULT false,
  forwarded_to      text CHECK (forwarded_to IS NULL OR length(forwarded_to) <= 120),
  forwarded_on      date,
  advisory          boolean NOT NULL DEFAULT false,
  advisory_since    date,
  next_step         text CHECK (next_step IS NULL OR length(next_step) <= 200),
  next_step_on      date,
  notes             text CHECK (notes IS NULL OR length(notes) <= 4000),
  -- Quando a pessoa entrou no cadastro de origem (a ficha guarda mesmo se a origem for apagada).
  source_created_at timestamptz,
  created_by        uuid DEFAULT auth.uid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS zyron_athletes_lead_key    ON public.zyron_athletes (lead_id)      WHERE lead_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS zyron_athletes_athlete_key ON public.zyron_athletes (athlete_id)   WHERE athlete_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS zyron_athletes_member_key  ON public.zyron_athletes (member_id)    WHERE member_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS zyron_athletes_email_key   ON public.zyron_athletes (lower(email)) WHERE email IS NOT NULL;

-- Data da última alteração, sempre pelo banco.
CREATE OR REPLACE FUNCTION public.zyron_athletes_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS zyron_athletes_touch ON public.zyron_athletes;
CREATE TRIGGER zyron_athletes_touch BEFORE UPDATE ON public.zyron_athletes
  FOR EACH ROW EXECUTE FUNCTION public.zyron_athletes_touch();

REVOKE ALL ON FUNCTION public.zyron_athletes_touch() FROM PUBLIC, anon, authenticated;

/* ------------------------------------------------------------------ */
/* Acesso: equipe lê, administrador grava                              */
/* ------------------------------------------------------------------ */

ALTER TABLE public.zyron_athletes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.zyron_athletes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.zyron_athletes TO authenticated;

DROP POLICY IF EXISTS "Staff can read zyron athletes" ON public.zyron_athletes;
CREATE POLICY "Staff can read zyron athletes"
  ON public.zyron_athletes FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS "Admins manage zyron athletes" ON public.zyron_athletes;
CREATE POLICY "Admins manage zyron athletes"
  ON public.zyron_athletes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
