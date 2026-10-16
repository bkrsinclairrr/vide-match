-- Jornada do atleta: o contrato no Setor Atletas e a leitura do próprio progresso pela área do atleta.
--
-- A área do atleta (/minha-area) mostra a jornada em seis etapas: perfil, análise dos jogos, 3 jogos
-- analisados, seleção pela equipe, encaminhamento para um clube e fechamento de contrato. As três
-- últimas vêm do Setor Atletas (zyron_athletes), que só a equipe lê. Esta migração:
--   * acrescenta o contrato à ficha (fechado ou não, com qual clube e quando);
--   * cria zyron_my_journey(): o atleta logado lê SÓ as marcas da própria ficha (está no setor, foi
--     encaminhado, fechou contrato, as datas e, depois de assinado, o clube do contrato). Notas,
--     temperatura, assessoria, próximos passos e para onde foi encaminhado continuam só da equipe.
-- A ficha é da pessoa quando aponta para a conta dela (Atletas), para o membro ligado à conta ou para o
-- e-mail confirmado da conta (a mesma regra de claim_zyron_membership).
-- Tudo aditivo e repetível (IF NOT EXISTS / OR REPLACE). Nada que já existe é alterado.

ALTER TABLE public.zyron_athletes
  ADD COLUMN IF NOT EXISTS contract_signed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contract_club   text,
  ADD COLUMN IF NOT EXISTS contract_on     date;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zyron_athletes_contract_club_len') THEN
    ALTER TABLE public.zyron_athletes
      ADD CONSTRAINT zyron_athletes_contract_club_len CHECK (contract_club IS NULL OR length(contract_club) <= 120);
  END IF;
END
$do$;

CREATE OR REPLACE FUNCTION public.zyron_my_journey()
RETURNS TABLE (
  selected        boolean,
  selected_on     date,
  forwarded       boolean,
  forwarded_on    date,
  contract_signed boolean,
  contract_on     date,
  contract_club   text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  WITH me AS (
    SELECT u.id,
           CASE WHEN u.email_confirmed_at IS NOT NULL THEN lower(u.email) END AS email
      FROM auth.users u
     WHERE u.id = auth.uid()
  )
  SELECT true,
         a.created_at::date,
         a.forwarded,
         a.forwarded_on,
         a.contract_signed,
         a.contract_on,
         CASE WHEN a.contract_signed THEN a.contract_club END
    FROM public.zyron_athletes a
    JOIN me ON true
   WHERE a.athlete_id IN (SELECT t.id FROM public."Atletas" t WHERE t.user_id = me.id)
      OR a.member_id IN (SELECT m.id FROM public.zyron_members m WHERE m.user_id = me.id)
      OR (me.email IS NOT NULL AND lower(a.email) = me.email)
   ORDER BY a.contract_signed DESC, a.forwarded DESC, a.updated_at DESC
   LIMIT 1
$fn$;

REVOKE ALL ON FUNCTION public.zyron_my_journey() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_my_journey() TO authenticated;
