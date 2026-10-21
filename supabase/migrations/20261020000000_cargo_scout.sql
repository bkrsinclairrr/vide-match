-- Cargo Scout (VOXEN): o nível mais baixo da equipe, que alimenta e mantém os jogadores.
--
--   admin      faz tudo: o que o Scout faz, mais excluir, gerir contas e acessos e a central (/admin).
--   executive  faz tudo o que o Scout faz (até aqui só lia) e vê a lista de contas.
--   scout      mantém os jogadores: cadastro, notas e avaliação, membros, partidas e lances, setor
--              Atletas e "Sincronizar agora". Não exclui cadastro, membro, partida nem ficha do setor.
--   user       atleta: só a própria área.
--
-- As policies novas somam às do administrador (o Postgres junta as permissivas com OU): nada do que
-- o admin já faz muda, e excluir continua só dele. Tudo aditivo e repetível. O valor novo do enum
-- nunca é usado como literal (as funções comparam role::text), então o script roda de uma vez só.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'scout';

-- Quem é da equipe (lê a VOXEN). SECURITY DEFINER evita recursão de RLS.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid() AND role::text IN ('admin', 'executive', 'scout')
  )
$$;

-- Quem mantém jogador (escreve na VOXEN, sem excluir). Hoje é a equipe toda; fica separada de
-- is_staff() para um cargo futuro que só leia.
CREATE OR REPLACE FUNCTION public.can_scout()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid() AND role::text IN ('admin', 'executive', 'scout')
  )
$$;

-- A conta é da equipe? Usada para o Scout não mexer no perfil de quem é da equipe.
CREATE OR REPLACE FUNCTION public.is_staff_account(p_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = p_user AND role::text IN ('admin', 'executive', 'scout')
  )
$$;

REVOKE ALL ON FUNCTION public.is_staff(), public.can_scout(), public.is_staff_account(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_staff(), public.can_scout(), public.is_staff_account(uuid) TO authenticated;

-- Escrita da equipe, um comando por policy. Excluir (DELETE) só onde a matriz deixa: o lance de
-- uma partida (desfazer marcação). Tabelas que ainda não existem neste banco são ignoradas.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('zyron_members',      'INSERT'), ('zyron_members',      'UPDATE'),
      ('zyron_matches',      'INSERT'), ('zyron_matches',      'UPDATE'),
      ('zyron_match_events', 'INSERT'), ('zyron_match_events', 'UPDATE'), ('zyron_match_events', 'DELETE'),
      ('voxen_player_meta',  'INSERT'), ('voxen_player_meta',  'UPDATE'),
      ('zyron_athletes',     'INSERT'), ('zyron_athletes',     'UPDATE'),
      ('Atletas',            'UPDATE'),
      ('funnel_leads',       'UPDATE')
    ) AS v(tbl, cmd)
  LOOP
    IF to_regclass(format('public.%I', r.tbl)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Team can ' || lower(r.cmd) || ' ' || r.tbl, r.tbl);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR %s TO authenticated %s',
        'Team can ' || lower(r.cmd) || ' ' || r.tbl, r.tbl, r.cmd,
        CASE r.cmd
          WHEN 'INSERT' THEN 'WITH CHECK (public.can_scout())'
          WHEN 'UPDATE' THEN 'USING (public.can_scout()) WITH CHECK (public.can_scout())'
          ELSE 'USING (public.can_scout())'
        END
      );
    END IF;
  END LOOP;
END $$;

-- Perfil de login: a equipe edita o do atleta, nunca o de outra pessoa da equipe (o admin continua
-- com a policy dele, que vale para todos).
DROP POLICY IF EXISTS "Team can update profiles" ON public.profiles;
CREATE POLICY "Team can update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.can_scout() AND NOT public.is_staff_account(id))
  WITH CHECK (public.can_scout() AND NOT public.is_staff_account(id));

-- "Sincronizar agora" passa a ser da equipe; recriar os membros que a equipe excluiu continua só do
-- administrador. O resto da função fica igual.
CREATE OR REPLACE FUNCTION public.zyron_sync_all(p_include_excluded boolean DEFAULT false)
RETURNS TABLE (fonte text, resultado text, qtd bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.can_scout() THEN
    RAISE EXCEPTION 'Somente a equipe pode sincronizar.' USING ERRCODE = '42501';
  END IF;
  IF p_include_excluded AND auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Somente administradores podem recriar os membros excluídos.' USING ERRCODE = '42501';
  END IF;
  IF p_include_excluded THEN
    DELETE FROM public.zyron_member_skips;
  END IF;
  RETURN QUERY
    SELECT t.fonte, t.res, count(*)
      FROM (
        SELECT 'lead'::text AS fonte, public.zyron_sync_lead(l.id) AS res FROM public.funnel_leads l
        UNION ALL
        SELECT 'conta'::text, public.zyron_sync_athlete(a.id) FROM public."Atletas" a
      ) t
     GROUP BY t.fonte, t.res
     ORDER BY t.fonte, t.res;
END
$fn$;
