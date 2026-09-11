-- Persiste a atribuição capturada na entrada de /avaliacao junto do lead.
-- O script oficial da Utmify continua responsável pelo pixel e propagação no
-- navegador; estes campos preservam a mesma origem no backend da Zyron.

ALTER TABLE public.funnel_leads
  ADD COLUMN IF NOT EXISTS utm_source   text,
  ADD COLUMN IF NOT EXISTS utm_medium   text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content  text,
  ADD COLUMN IF NOT EXISTS utm_term     text,
  ADD COLUMN IF NOT EXISTS fbclid       text,
  ADD COLUMN IF NOT EXISTS gclid        text,
  ADD COLUMN IF NOT EXISTS ttclid       text;

DROP FUNCTION IF EXISTS public.capture_funnel_lead(text, text, text);

CREATE FUNCTION public.capture_funnel_lead(
  p_name         text,
  p_email        text,
  p_phone        text,
  p_utm_source   text DEFAULT NULL,
  p_utm_medium   text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL,
  p_utm_content  text DEFAULT NULL,
  p_utm_term     text DEFAULT NULL,
  p_fbclid       text DEFAULT NULL,
  p_gclid        text DEFAULT NULL,
  p_ttclid       text DEFAULT NULL
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
      RAISE EXCEPTION 'Muitas tentativas. Tente novamente mais tarde.' USING ERRCODE = 'PT429';
    END IF;
  END IF;

  INSERT INTO public.funnel_leads (
    name, email, phone, utm_source, utm_medium, utm_campaign, utm_content,
    utm_term, fbclid, gclid, ttclid
  )
  VALUES (
    left(v_name, 100),
    v_email,
    v_phone,
    NULLIF(left(btrim(COALESCE(p_utm_source, '')), 500), ''),
    NULLIF(left(btrim(COALESCE(p_utm_medium, '')), 500), ''),
    NULLIF(left(btrim(COALESCE(p_utm_campaign, '')), 500), ''),
    NULLIF(left(btrim(COALESCE(p_utm_content, '')), 500), ''),
    NULLIF(left(btrim(COALESCE(p_utm_term, '')), 500), ''),
    NULLIF(left(btrim(COALESCE(p_fbclid, '')), 2048), ''),
    NULLIF(left(btrim(COALESCE(p_gclid, '')), 2048), ''),
    NULLIF(left(btrim(COALESCE(p_ttclid, '')), 2048), '')
  )
  ON CONFLICT (email) DO UPDATE
    SET name         = COALESCE(EXCLUDED.name, funnel_leads.name),
        phone        = EXCLUDED.phone,
        utm_source   = COALESCE(EXCLUDED.utm_source, funnel_leads.utm_source),
        utm_medium   = COALESCE(EXCLUDED.utm_medium, funnel_leads.utm_medium),
        utm_campaign = COALESCE(EXCLUDED.utm_campaign, funnel_leads.utm_campaign),
        utm_content  = COALESCE(EXCLUDED.utm_content, funnel_leads.utm_content),
        utm_term     = COALESCE(EXCLUDED.utm_term, funnel_leads.utm_term),
        fbclid       = COALESCE(EXCLUDED.fbclid, funnel_leads.fbclid),
        gclid        = COALESCE(EXCLUDED.gclid, funnel_leads.gclid),
        ttclid       = COALESCE(EXCLUDED.ttclid, funnel_leads.ttclid),
        updated_at   = now()
  RETURNING id INTO v_id;

  DELETE FROM public.funnel_lead_throttle WHERE window_start < now() - interval '1 day';

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_funnel_lead(
  text, text, text, text, text, text, text, text, text, text, text
) FROM public;
GRANT EXECUTE ON FUNCTION public.capture_funnel_lead(
  text, text, text, text, text, text, text, text, text, text, text
) TO anon, authenticated;
