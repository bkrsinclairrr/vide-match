-- Importados aprovados entram em Jogadores.
--
-- Atleta com conta e "aguardando cadastro" já apareciam em Jogadores (têm cadastro do funil ou conta). O pré-cadastro do
-- CRM (lead da wsltda.com que ainda não se cadastrou) só existia em Importados. Pedido do dono (23/10): aprovado, ele
-- passa a aparecer em Jogadores também.
--
-- Continua valendo a regra do pré-cadastro: nada é criado (atleta, membro, lead do funil, conta) e ninguém é contatado.
-- Ele aparece na lista da EQUIPE, lido daqui, com a chave 'crm:<id do lead no CRM>'. Os dados continuam vindo do CRM
-- (cada versão nova substitui a anterior); tirar a aprovação tira de Jogadores; descartar (só o administrador) apaga.
-- Quando a pessoa se cadastra e vira membro, o pré-cadastro já é ligado ao membro (zyron_prospect_link): a função
-- abaixo devolve essa ligação para a tela juntar as anotações feitas na chave 'crm:' ao jogador de verdade.
--
-- Aditivo e repetível. Nenhuma linha muda.

/* ------------------------------------------------------------------ */
/* Os pré-cadastros aprovados (e os que já viraram membro)             */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.zyron_imported_players()
RETURNS TABLE (
  crm_lead_id text, name text, guardian_name text, birth_date date, player_position text, category text, team text, city text,
  first_at timestamptz, approved_at timestamptz, linked_member_id uuid
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
  SELECT p.crm_lead_id,
         nullif(btrim(p.athlete_name), ''), nullif(btrim(p.guardian_name), ''),
         p.birth_date, p.position, p.category, public.zyron_team_clean(p.team), p.city,
         p.first_received_at, k.approved_at, p.linked_member_id
    FROM public.zyron_prospects p
    LEFT JOIN public.zyron_import_marks k ON k.kind = 'pre' AND k.ref = p.crm_lead_id
   WHERE p.discarded_at IS NULL
     AND (
       -- Já virou membro: só a ligação interessa (os textos daqui foram apagados).
       p.linked_member_id IS NOT NULL
       -- Aprovado e ainda pré-cadastro. Quem já chegou como "aguardando cadastro" tem cadastro do funil e já está em
       -- Jogadores por ele: não entra de novo.
       OR (k.approved_at IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM public.crm_context_events w
                            WHERE w.status = 'waiting_member' AND lower(coalesce(w.event->'link'->>'crm_lead_id', '')) = p.crm_lead_id))
     );
END
$fn$;

REVOKE ALL ON FUNCTION public.zyron_imported_players() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zyron_imported_players() TO authenticated;

/* ------------------------------------------------------------------ */
/* Vídeos e gráficos também para quem é pré-cadastro                   */
/* ------------------------------------------------------------------ */

-- A chave do jogador ganha a forma 'crm:<id do lead no CRM>' (as notas e a etapa já aceitavam qualquer chave curta).
ALTER TABLE public.voxen_player_materials DROP CONSTRAINT IF EXISTS voxen_player_materials_player_key_check;
ALTER TABLE public.voxen_player_materials ADD CONSTRAINT voxen_player_materials_player_key_check
  CHECK (player_key ~ '^(lead:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|atleta:[0-9]{1,18}|crm:[0-9a-z_-]{8,64})$');

ALTER TABLE public.voxen_player_charts DROP CONSTRAINT IF EXISTS voxen_player_charts_player_key_check;
ALTER TABLE public.voxen_player_charts ADD CONSTRAINT voxen_player_charts_player_key_check
  CHECK (player_key ~ '^(lead:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|atleta:[0-9]{1,18}|crm:[0-9a-z_-]{8,64})$');
