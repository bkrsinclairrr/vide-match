-- Captura de contato do funil aberto (/avaliacao): o lead chega antes do login,
-- então a gravação passa por uma função SECURITY DEFINER em vez de acesso direto
-- à tabela — o cliente anônimo nunca lê nem escreve em funnel_leads.

CREATE TABLE IF NOT EXISTS public.funnel_leads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text,
  email      text NOT NULL UNIQUE,
  phone      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.funnel_leads ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.funnel_leads FROM anon;

DROP POLICY IF EXISTS "Admins can read funnel leads" ON public.funnel_leads;
CREATE POLICY "Admins can read funnel leads"
  ON public.funnel_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete funnel leads" ON public.funnel_leads;
CREATE POLICY "Admins can delete funnel leads"
  ON public.funnel_leads FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.capture_funnel_lead(
  p_name  text,
  p_email text,
  p_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name  text := NULLIF(btrim(COALESCE(p_name, '')), '');
  v_email text := lower(btrim(COALESCE(p_email, '')));
  v_phone text := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  v_id    uuid;
BEGIN
  IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' OR length(v_email) > 254 THEN
    RAISE EXCEPTION 'E-mail invalido' USING ERRCODE = '22023';
  END IF;

  IF length(v_phone) < 10 OR length(v_phone) > 15 THEN
    RAISE EXCEPTION 'Telefone invalido' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.funnel_leads (name, email, phone)
  VALUES (left(v_name, 100), v_email, v_phone)
  ON CONFLICT (email) DO UPDATE
    SET name       = COALESCE(EXCLUDED.name, funnel_leads.name),
        phone      = EXCLUDED.phone,
        updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_funnel_lead(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.capture_funnel_lead(text, text, text) TO anon, authenticated;
