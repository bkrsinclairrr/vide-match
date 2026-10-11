-- Contas e acessos (VOXEN): papel "executive" (só lê) ao lado de "admin" (faz tudo).
--
--   admin      lê e altera tudo: editar, mudar, excluir, gerir contas e acessos.
--   executive  lê tudo na VOXEN; nenhuma escrita (não existe policy de escrita para ele).
--   user       atleta: só a própria área.
--
-- Tudo aditivo e repetível. O valor novo do enum nunca é usado como literal
-- aqui (as funções comparam role::text), então o script roda de uma vez só.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'executive';

-- Quem é da equipe (admin ou executivo). SECURITY DEFINER evita recursão de RLS.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid() AND role::text IN ('admin', 'executive')
  )
$$;

REVOKE ALL ON FUNCTION public.is_staff() FROM public;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- A equipe (inclusive o executivo) lê o que a VOXEN mostra. Só SELECT.
-- Tabelas que ainda não existem neste banco são ignoradas.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Atletas', 'profiles', 'funnel_leads', 'voxen_player_meta',
    'zyron_members', 'zyron_matches', 'zyron_match_events'
  ] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Staff can read ' || t, t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_staff())',
        'Staff can read ' || t, t
      );
    END IF;
  END LOOP;
END $$;

-- Admin passa a poder editar (as policies antigas só deixavam excluir).
DO $$
BEGIN
  IF to_regclass('public."Atletas"') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admins can update athlete records" ON public."Atletas";
    CREATE POLICY "Admins can update athlete records"
      ON public."Atletas" FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
    CREATE POLICY "Admins can update profiles"
      ON public.profiles FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF to_regclass('public.funnel_leads') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Admins can update funnel leads" ON public.funnel_leads;
    CREATE POLICY "Admins can update funnel leads"
      ON public.funnel_leads FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Rede de segurança: nunca remover o último administrador (nem em cascata,
-- ao excluir a conta dele).
CREATE OR REPLACE FUNCTION public.protect_last_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role::text = 'admin' AND NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role::text = 'admin' AND id <> OLD.id
  ) THEN
    RAISE EXCEPTION 'Não é possível remover o último administrador.';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS protect_last_admin ON public.user_roles;
CREATE TRIGGER protect_last_admin
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.protect_last_admin();
