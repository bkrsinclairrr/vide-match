-- capture_funnel_lead e o unico endpoint de escrita aberto a visitantes anonimos.
-- Sem limite, qualquer um inunda a tabela de leads. O balde e por IP, guardado
-- como hash com sal: serve para contar, nao para identificar quem acessou.

CREATE TABLE IF NOT EXISTS public.funnel_lead_throttle (
  client_key   text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  hits         integer NOT NULL DEFAULT 0
);

ALTER TABLE public.funnel_lead_throttle ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.funnel_lead_throttle FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.capture_funnel_lead(
  p_name  text,
  p_email text,
  p_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_name   text := NULLIF(btrim(COALESCE(p_name, '')), '');
  v_email  text := lower(btrim(COALESCE(p_email, '')));
  v_phone  text := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  v_ip     text;
  v_key    text;
  v_hits   integer;
  v_id     uuid;
  c_limit  constant integer := 10;
  c_window constant interval := interval '1 hour';
BEGIN
  IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' OR length(v_email) > 254 THEN
    RAISE EXCEPTION 'E-mail invalido' USING ERRCODE = '22023';
  END IF;

  IF length(v_phone) < 10 OR length(v_phone) > 15 THEN
    RAISE EXCEPTION 'Telefone invalido' USING ERRCODE = '22023';
  END IF;

  v_ip := btrim(split_part(
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1));

  -- Sem IP identificavel (ex: chamada administrativa direta) o limite e ignorado:
  -- travar o funil inteiro seria pior do que deixar passar essas chamadas.
  IF v_ip <> '' THEN
    v_key := encode(digest('zyron-funnel-lead|' || v_ip, 'sha256'), 'hex');

    INSERT INTO public.funnel_lead_throttle (client_key, window_start, hits)
    VALUES (v_key, now(), 1)
    ON CONFLICT (client_key) DO UPDATE
      SET hits = CASE
            WHEN funnel_lead_throttle.window_start < now() - c_window THEN 1
            ELSE funnel_lead_throttle.hits + 1
          END,
          window_start = CASE
            WHEN funnel_lead_throttle.window_start < now() - c_window THEN now()
            ELSE funnel_lead_throttle.window_start
          END
    RETURNING hits INTO v_hits;

    IF v_hits > c_limit THEN
      -- PT429: o PostgREST traduz o sufixo do codigo no status HTTP.
      RAISE EXCEPTION 'Muitas tentativas. Tente novamente mais tarde.' USING ERRCODE = 'PT429';
    END IF;
  END IF;

  INSERT INTO public.funnel_leads (name, email, phone)
  VALUES (left(v_name, 100), v_email, v_phone)
  ON CONFLICT (email) DO UPDATE
    SET name       = COALESCE(EXCLUDED.name, funnel_leads.name),
        phone      = EXCLUDED.phone,
        updated_at = now()
  RETURNING id INTO v_id;

  DELETE FROM public.funnel_lead_throttle WHERE window_start < now() - interval '1 day';

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_funnel_lead(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.capture_funnel_lead(text, text, text) TO anon, authenticated;
