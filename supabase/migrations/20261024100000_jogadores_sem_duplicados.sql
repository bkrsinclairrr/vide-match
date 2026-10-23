-- Jogadores sem duplicados: uma pessoa, um registro.
--
-- 1) zyron_player_links(): quais contas de atleta (tabela Atletas) são a MESMA pessoa de um lead do funil. O elo é o
--    e-mail: o lead guarda o e-mail que a pessoa digitou no funil e a conta de login tem o mesmo e-mail. Hoje são 14
--    pessoas que apareciam duas vezes em Jogadores (o caso do Juan Dérick Kretzer). A tela usa estes pares para mostrar
--    cada pessoa uma vez só. Só a equipe chama, e só devolve ids (nenhum e-mail sai daqui). Nada é apagado nem alterado.
--
-- 2) Corrige o clube "Sim": 49 membros ficaram com time = 'Sim' porque o leitor do CRM tratava a resposta "Sim" (à
--    pergunta "o atleta está vinculado a algum clube?") como nome de time. Zera só o que é resposta (sim, não, nenhum...)
--    pelo caminho da sincronização (não desliga o automático dos membros). O texto bruto da resposta continua em
--    zyron_member_context.current_club, então nada se perde. O leitor já foi corrigido (crm-context-parse.ts).
--
-- Aditivo e repetível.

CREATE OR REPLACE FUNCTION public.zyron_player_links()
RETURNS TABLE (atleta_id bigint, lead_id uuid)
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
  SELECT a.id, l.id
    FROM public."Atletas" a
    JOIN auth.users u ON u.id = a.user_id
    JOIN public.funnel_leads l ON lower(btrim(l.email)) = lower(btrim(u.email))
   WHERE a.user_id IS NOT NULL;
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_player_links() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_player_links() TO authenticated;

DO $do$
BEGIN
  PERFORM set_config('zyron.sync', 'on', true);
  UPDATE public.zyron_members
     SET team = NULL
   WHERE team IS NOT NULL
     AND lower(btrim(translate(team, 'ÁÀÂÃÉÊÍÓÔÕÚÇáàâãéêíóôõúç', 'AAAAEEIOOOUCaaaaeeiooouc')))
         IN ('sim', 's', 'nao', 'n', 'nenhum', 'nenhuma', 'sem clube', 'sem time', 'nao tenho', 'x', '-');
  PERFORM set_config('zyron.sync', '', true);
END
$do$;
