-- Membros automáticos: quem tem nome e sobrenome de verdade vira membro sozinho e fica sincronizado.
--
-- De onde vêm: funnel_leads (leads do funil) e "Atletas" (perfis de quem criou conta; o e-mail vem de auth.users).
-- O que acontece:
--   * cadastro novo ou editado com nome completo e e-mail válido  -> cria o membro (com a data de entrada original);
--   * o cadastro muda (posição, categoria, altura, peso, cidade...) -> o membro acompanha, enquanto a equipe não o editar;
--   * a equipe edita o membro à mão                               -> ele deixa de ser sobrescrito (auto_sync = false);
--   * a equipe exclui o membro                                    -> ele não volta sozinho (zyron_member_skips);
--   * qualquer falha da automação NUNCA impede o cadastro de entrar (o funil recebe tráfego pago).
-- Ninguém é avisado: o acesso vale quando a pessoa entra com a conta de mesmo e-mail (claim_zyron_membership).
-- A regra de "nome de verdade" é a mesma do filtro da central (src/pages/admin/console/names.ts).
-- Tudo aditivo e repetível (IF NOT EXISTS / OR REPLACE).

/* ------------------------------------------------------------------ */
/* Colunas e tabela de exclusões                                       */
/* ------------------------------------------------------------------ */

ALTER TABLE public.zyron_members ADD COLUMN IF NOT EXISTS auto_sync boolean NOT NULL DEFAULT false;
ALTER TABLE public.zyron_members ADD COLUMN IF NOT EXISTS athlete_id bigint REFERENCES public."Atletas"(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS zyron_members_athlete_key ON public.zyron_members (athlete_id) WHERE athlete_id IS NOT NULL;

-- E-mails de membros que a equipe excluiu de propósito: a sincronização não os recria.
CREATE TABLE IF NOT EXISTS public.zyron_member_skips (
  email      text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.zyron_member_skips ENABLE ROW LEVEL SECURITY; -- sem políticas: só as funções abaixo mexem

/* ------------------------------------------------------------------ */
/* Regras de nome e e-mail                                             */
/* ------------------------------------------------------------------ */

-- Nome e sobrenome que parecem de pessoa: ao menos duas palavras "boas" e nenhuma de teste ou com número/símbolo.
-- Uma palavra estranha sozinha (sobrenome curto como "Cruz", "John", "Hepp") não derruba o nome.
CREATE OR REPLACE FUNCTION public.zyron_real_name(p_name text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $fn$
DECLARE
  v_name  text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  tk      text;
  pl      text;
  letters text;
  vowels  int;
  good    int := 0;
BEGIN
  IF length(v_name) < 5 OR length(v_name) > 120 THEN
    RETURN false;
  END IF;

  FOREACH tk IN ARRAY string_to_array(v_name, ' ') LOOP
    pl := translate(lower(tk), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn');

    -- conectores, iniciais e "Jr" não contam como nome
    IF pl IN ('de','da','do','dos','das','e','di','du','del','la','le','van','von')
       OR tk ~ '^[[:alpha:]]\.$'
       OR pl ~ '^jr\.?$' THEN
      CONTINUE;
    END IF;

    -- número ou símbolo: não é nome
    IF tk !~ '^[[:alpha:]][[:alpha:]''’.-]*$' THEN
      RETURN false;
    END IF;

    letters := regexp_replace(pl, '[^a-z]', '', 'g');

    -- palavra de teste
    IF letters IN ('teste','testes','test','testando','tester','fulano','beltrano','ciclano','asdf','asdfg','qwerty','qwe',
                   'abc','abcd','xxx','xxxx','admin','null','undefined','nome','sobrenome','atleta','user','usuario',
                   'exemplo','example','fake','lorem','ipsum')
       OR letters ~ '^teste' THEN
      RETURN false;
    END IF;

    -- letras estranhas: não contam como palavra boa, mas não reprovam sozinhas
    IF length(letters) < 2 OR letters ~ '(.)\1{2,}' THEN
      CONTINUE;
    END IF;
    vowels := length(letters) - length(regexp_replace(letters, '[aeiouy]', '', 'g'));
    IF length(letters) >= 4 THEN
      IF vowels::numeric / length(letters) <= 0.25 OR letters ~ '[^aeiouy]{5,}' THEN
        CONTINUE;
      END IF;
    ELSIF vowels = 0 THEN
      CONTINUE;
    END IF;

    good := good + 1;
  END LOOP;

  RETURN good >= 2;
END
$fn$;

CREATE OR REPLACE FUNCTION public.zyron_test_email(p_email text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT coalesce(p_email ~* '(^|[^a-z])(teste|test|fake|fulano|example|exemplo|mailinator|asdf)([^a-z]|$)', false)
$fn$;

-- Número de um texto ("178", "1,78"); NULL se não for número.
CREATE OR REPLACE FUNCTION public.zyron_num(p text)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT CASE WHEN btrim(coalesce(p, '')) ~ '^\d+([.,]\d+)?$' THEN replace(btrim(p), ',', '.')::numeric END
$fn$;

/* ------------------------------------------------------------------ */
/* Sincronização de um lead e de um atleta                             */
/* ------------------------------------------------------------------ */

-- Devolve o que aconteceu: criado, atualizado, ja_existe:..., ignorado:...
CREATE OR REPLACE FUNCTION public.zyron_sync_lead(p_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  l       public.funnel_leads%ROWTYPE;
  m       public.zyron_members%ROWTYPE;
  v_name  text;
  v_email text;
  v_pos   text;
  v_cat   text;
  v_foot  text;
  v_city  text;
  v_h     smallint;
  v_w     smallint;
  n       numeric;
  v_mail_ok boolean;
BEGIN
  SELECT * INTO l FROM public.funnel_leads WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN 'ignorado:nao_existe';
  END IF;

  v_name  := left(btrim(regexp_replace(coalesce(l.name, ''), '\s+', ' ', 'g')), 120);
  v_email := lower(btrim(coalesce(l.email, '')));
  IF NOT public.zyron_real_name(v_name) THEN RETURN 'ignorado:sem_nome_completo'; END IF;
  IF public.zyron_test_email(v_email) THEN RETURN 'ignorado:email_de_teste'; END IF;
  IF length(v_email) > 254 OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN RETURN 'ignorado:email_invalido'; END IF;

  v_pos  := nullif(left(btrim(coalesce(l.profile->>'position', '')), 40), '');
  v_cat  := nullif(left(btrim(coalesce(l.profile->>'category', '')), 20), '');
  v_foot := nullif(left(initcap(lower(btrim(coalesce(l.profile->>'preferredFoot', '')))), 20), '');
  v_city := nullif(left(btrim(coalesce(nullif(btrim(l.profile->>'city'), ''), l.profile->>'state', '')), 80), '');
  n := public.zyron_num(l.profile->>'height'); v_h := CASE WHEN n BETWEEN 100 AND 230 THEN round(n)::smallint END;
  n := public.zyron_num(l.profile->>'weight'); v_w := CASE WHEN n BETWEEN 25 AND 160 THEN round(n)::smallint END;

  SELECT * INTO m FROM public.zyron_members WHERE lead_id = l.id;
  IF FOUND THEN
    IF NOT m.auto_sync THEN
      RETURN 'ja_existe:editado_pela_equipe';
    END IF;
    -- o e-mail só acompanha se a pessoa ainda não ligou a conta e ninguém mais usa o novo
    v_mail_ok := m.user_id IS NULL AND lower(coalesce(m.email, '')) <> v_email
                 AND NOT EXISTS (SELECT 1 FROM public.zyron_members x WHERE lower(x.email) = v_email AND x.id <> m.id);
    IF (m.full_name, m.position, m.category, m.preferred_foot, m.height_cm, m.weight_kg, m.city)
         IS NOT DISTINCT FROM (v_name, v_pos, v_cat, v_foot, v_h, v_w, v_city)
       AND NOT v_mail_ok THEN
      RETURN 'ja_existe:em_dia';
    END IF;
    PERFORM set_config('zyron.sync', 'on', true);
    UPDATE public.zyron_members
       SET full_name = v_name, position = v_pos, category = v_cat, preferred_foot = v_foot,
           height_cm = v_h, weight_kg = v_w, city = v_city,
           email = CASE WHEN v_mail_ok THEN v_email ELSE email END,
           updated_at = now()
     WHERE id = m.id;
    PERFORM set_config('zyron.sync', '', true);
    RETURN 'atualizado';
  END IF;

  IF EXISTS (SELECT 1 FROM public.zyron_member_skips WHERE email = v_email) THEN RETURN 'ignorado:excluido_pela_equipe'; END IF;
  IF EXISTS (SELECT 1 FROM public.zyron_members WHERE lower(email) = v_email) THEN RETURN 'ja_existe:mesmo_email'; END IF;

  INSERT INTO public.zyron_members
    (kind, email, full_name, position, category, preferred_foot, height_cm, weight_kg, city, lead_id, active, auto_sync, created_at, updated_at)
  VALUES
    ('membro', v_email, v_name, v_pos, v_cat, v_foot, v_h, v_w, v_city, l.id, true, true, l.created_at, now());
  RETURN 'criado';
EXCEPTION WHEN unique_violation THEN
  RETURN 'ja_existe:mesmo_email';
END
$fn$;

CREATE OR REPLACE FUNCTION public.zyron_sync_athlete(p_id bigint)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  a       public."Atletas"%ROWTYPE;
  m       public.zyron_members%ROWTYPE;
  v_name  text;
  v_email text;
  v_pos   text;
  v_foot  text;
  v_city  text;
  v_h     smallint;
  v_w     smallint;
  v_mail_ok boolean;
BEGIN
  SELECT * INTO a FROM public."Atletas" WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN 'ignorado:nao_existe';
  END IF;

  v_name := left(btrim(regexp_replace(
              coalesce(nullif(btrim(a.nome), ''), (SELECT nullif(btrim(p.full_name), '') FROM public.profiles p WHERE p.id = a.user_id), ''),
              '\s+', ' ', 'g')), 120);
  -- o e-mail do atleta com conta só existe em auth.users
  v_email := lower(btrim(coalesce((SELECT u.email FROM auth.users u WHERE u.id = a.user_id), '')));
  IF NOT public.zyron_real_name(v_name) THEN RETURN 'ignorado:sem_nome_completo'; END IF;
  IF v_email = '' THEN RETURN 'ignorado:sem_email'; END IF;
  IF public.zyron_test_email(v_email) THEN RETURN 'ignorado:email_de_teste'; END IF;
  IF length(v_email) > 254 OR v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN RETURN 'ignorado:email_invalido'; END IF;

  v_pos  := nullif(left(btrim(coalesce(a.posicao, '')), 40), '');
  v_foot := nullif(left(initcap(lower(btrim(coalesce(a.melhor_pe, '')))), 20), '');
  v_city := nullif(left(btrim(coalesce(a.cidade, '')), 80), '');
  v_h := CASE WHEN a.altura BETWEEN 100 AND 230 THEN round(a.altura)::smallint END;
  v_w := CASE WHEN a.peso BETWEEN 25 AND 160 THEN round(a.peso)::smallint END;

  SELECT * INTO m FROM public.zyron_members WHERE athlete_id = a.id;
  IF FOUND THEN
    IF NOT m.auto_sync THEN
      RETURN 'ja_existe:editado_pela_equipe';
    END IF;
    v_mail_ok := m.user_id IS NULL AND lower(coalesce(m.email, '')) <> v_email
                 AND NOT EXISTS (SELECT 1 FROM public.zyron_members x WHERE lower(x.email) = v_email AND x.id <> m.id);
    IF (m.full_name, m.position, m.preferred_foot, m.height_cm, m.weight_kg, m.city)
         IS NOT DISTINCT FROM (v_name, v_pos, v_foot, v_h, v_w, v_city)
       AND NOT v_mail_ok THEN
      RETURN 'ja_existe:em_dia';
    END IF;
    PERFORM set_config('zyron.sync', 'on', true);
    UPDATE public.zyron_members
       SET full_name = v_name, position = v_pos, preferred_foot = v_foot, height_cm = v_h, weight_kg = v_w, city = v_city,
           email = CASE WHEN v_mail_ok THEN v_email ELSE email END,
           updated_at = now()
     WHERE id = m.id;
    PERFORM set_config('zyron.sync', '', true);
    RETURN 'atualizado';
  END IF;

  IF EXISTS (SELECT 1 FROM public.zyron_member_skips WHERE email = v_email) THEN RETURN 'ignorado:excluido_pela_equipe'; END IF;
  IF EXISTS (SELECT 1 FROM public.zyron_members WHERE lower(email) = v_email) THEN RETURN 'ja_existe:mesmo_email'; END IF;

  INSERT INTO public.zyron_members
    (kind, email, full_name, position, preferred_foot, height_cm, weight_kg, city, athlete_id, active, auto_sync, created_at, updated_at)
  VALUES
    ('membro', v_email, v_name, v_pos, v_foot, v_h, v_w, v_city, a.id, true, true, a.created_at, now());
  RETURN 'criado';
EXCEPTION WHEN unique_violation THEN
  RETURN 'ja_existe:mesmo_email';
END
$fn$;

/* ------------------------------------------------------------------ */
/* Gatilhos: a cada cadastro novo ou editado                           */
/* ------------------------------------------------------------------ */

-- Falha aqui nunca pode impedir o cadastro: o erro vira só um aviso no log.
CREATE OR REPLACE FUNCTION public.zyron_trg_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  BEGIN
    PERFORM public.zyron_sync_lead(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'zyron_sync_lead falhou para %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END
$fn$;

CREATE OR REPLACE FUNCTION public.zyron_trg_athlete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  BEGIN
    PERFORM public.zyron_sync_athlete(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'zyron_sync_athlete falhou para %: %', NEW.id, SQLERRM;
  END;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS zyron_sync_lead_ins ON public.funnel_leads;
CREATE TRIGGER zyron_sync_lead_ins AFTER INSERT ON public.funnel_leads
  FOR EACH ROW EXECUTE FUNCTION public.zyron_trg_lead();

DROP TRIGGER IF EXISTS zyron_sync_lead_upd ON public.funnel_leads;
CREATE TRIGGER zyron_sync_lead_upd AFTER UPDATE OF name, email, profile ON public.funnel_leads
  FOR EACH ROW
  WHEN (OLD.name IS DISTINCT FROM NEW.name OR OLD.email IS DISTINCT FROM NEW.email OR OLD.profile IS DISTINCT FROM NEW.profile)
  EXECUTE FUNCTION public.zyron_trg_lead();

DROP TRIGGER IF EXISTS zyron_sync_athlete_ins ON public."Atletas";
CREATE TRIGGER zyron_sync_athlete_ins AFTER INSERT ON public."Atletas"
  FOR EACH ROW EXECUTE FUNCTION public.zyron_trg_athlete();

DROP TRIGGER IF EXISTS zyron_sync_athlete_upd ON public."Atletas";
CREATE TRIGGER zyron_sync_athlete_upd AFTER UPDATE ON public."Atletas"
  FOR EACH ROW WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.zyron_trg_athlete();

/* ------------------------------------------------------------------ */
/* Respeito ao que a equipe faz à mão                                  */
/* ------------------------------------------------------------------ */

-- A equipe mudou os dados do membro: ele passa a ser da equipe e a sincronização não o sobrescreve mais.
CREATE OR REPLACE FUNCTION public.zyron_members_manual_edit()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF NEW.auto_sync
     AND coalesce(current_setting('zyron.sync', true), '') <> 'on'
     AND (NEW.full_name, NEW.birth_date, NEW.position, NEW.category, NEW.preferred_foot, NEW.height_cm, NEW.weight_kg, NEW.city, NEW.team, NEW.photo_url, NEW.bio)
         IS DISTINCT FROM
         (OLD.full_name, OLD.birth_date, OLD.position, OLD.category, OLD.preferred_foot, OLD.height_cm, OLD.weight_kg, OLD.city, OLD.team, OLD.photo_url, OLD.bio) THEN
    NEW.auto_sync := false;
  END IF;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS zyron_members_manual_edit ON public.zyron_members;
CREATE TRIGGER zyron_members_manual_edit BEFORE UPDATE ON public.zyron_members
  FOR EACH ROW EXECUTE FUNCTION public.zyron_members_manual_edit();

-- Excluir um membro de propósito: o e-mail dele não volta pela sincronização.
CREATE OR REPLACE FUNCTION public.zyron_members_remember_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF OLD.kind = 'membro' AND OLD.email IS NOT NULL THEN
    INSERT INTO public.zyron_member_skips (email) VALUES (lower(OLD.email)) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS zyron_members_remember_delete ON public.zyron_members;
CREATE TRIGGER zyron_members_remember_delete AFTER DELETE ON public.zyron_members
  FOR EACH ROW EXECUTE FUNCTION public.zyron_members_remember_delete();

-- Cadastrar o membro de novo (à mão ou pela sincronização) tira o e-mail da lista de excluídos.
CREATE OR REPLACE FUNCTION public.zyron_members_forget_skip()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.email IS NOT NULL THEN
    DELETE FROM public.zyron_member_skips WHERE email = lower(NEW.email);
  END IF;
  RETURN NULL;
END
$fn$;

DROP TRIGGER IF EXISTS zyron_members_forget_skip ON public.zyron_members;
CREATE TRIGGER zyron_members_forget_skip AFTER INSERT ON public.zyron_members
  FOR EACH ROW EXECUTE FUNCTION public.zyron_members_forget_skip();

/* ------------------------------------------------------------------ */
/* Para a central: sincronizar agora e ver o estado                    */
/* ------------------------------------------------------------------ */

-- Passa por todos os cadastros e devolve quantos foram criados, atualizados, já existiam ou ficaram de fora (e por quê).
-- Só administrador. `p_include_excluded`: também recria os membros que a equipe excluiu.
CREATE OR REPLACE FUNCTION public.zyron_sync_all(p_include_excluded boolean DEFAULT false)
RETURNS TABLE (fonte text, resultado text, qtd bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Somente administradores podem sincronizar.' USING ERRCODE = '42501';
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

-- Números para o painel (equipe pode ver).
CREATE OR REPLACE FUNCTION public.zyron_sync_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  r jsonb;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_staff() THEN
    RAISE EXCEPTION 'Somente a equipe.' USING ERRCODE = '42501';
  END IF;
  SELECT jsonb_build_object(
    'leads',        (SELECT count(*) FROM public.funnel_leads),
    'contas',       (SELECT count(*) FROM public."Atletas"),
    'membros',      (SELECT count(*) FROM public.zyron_members WHERE kind = 'membro'),
    'automaticos',  (SELECT count(*) FROM public.zyron_members WHERE kind = 'membro' AND auto_sync),
    'da_equipe',    (SELECT count(*) FROM public.zyron_members WHERE kind = 'membro' AND NOT auto_sync),
    'excluidos',    (SELECT count(*) FROM public.zyron_member_skips),
    'pendentes',    (SELECT count(*) FROM public.funnel_leads l
                      WHERE public.zyron_real_name(l.name) AND NOT public.zyron_test_email(l.email)
                        AND l.email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
                        AND NOT EXISTS (SELECT 1 FROM public.zyron_members m WHERE m.lead_id = l.id OR lower(m.email) = lower(l.email))
                        AND NOT EXISTS (SELECT 1 FROM public.zyron_member_skips s WHERE s.email = lower(l.email)))
  ) INTO r;
  RETURN r;
END
$fn$;

/* ------------------------------------------------------------------ */
/* Permissões: só as duas funções do painel ficam abertas a usuários    */
/* ------------------------------------------------------------------ */

REVOKE ALL ON FUNCTION public.zyron_real_name(text), public.zyron_test_email(text), public.zyron_num(text),
  public.zyron_sync_lead(uuid), public.zyron_sync_athlete(bigint),
  public.zyron_trg_lead(), public.zyron_trg_athlete(), public.zyron_members_manual_edit(),
  public.zyron_members_remember_delete(), public.zyron_members_forget_skip(),
  public.zyron_sync_all(boolean), public.zyron_sync_status()
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.zyron_sync_all(boolean), public.zyron_sync_status() TO authenticated;
