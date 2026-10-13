-- VOXEN (/voxen): plataforma interna dos admins com os atletas do funil.
--
-- 1. O funil passa a guardar o perfil do atleta (posição, categoria, idade,
--    cidade...) e o relatório mostrado na tela de resultado. Até aqui esses
--    dados ficavam só no sessionStorage do visitante e se perdiam.
-- 2. Mesa de trabalho dos admins: etapa no funil comercial, notas e a
--    avaliação do scout (notas de 1 a 5), por atleta.
--
-- Tudo aditivo: nenhuma coluna existente muda, capture_funnel_lead fica igual.

ALTER TABLE public.funnel_leads
  ADD COLUMN IF NOT EXISTS profile jsonb,
  ADD COLUMN IF NOT EXISTS report  jsonb;

-- Escrita do perfil pelo visitante anônimo. Exige o id do lead (só quem
-- acabou de passar pelo capture_funnel_lead o conhece) e o mesmo e-mail.
-- Só chaves conhecidas entram, com tamanho limitado — nunca a foto.
CREATE OR REPLACE FUNCTION public.capture_funnel_profile(
  p_lead_id uuid,
  p_email   text,
  p_profile jsonb DEFAULT NULL,
  p_report  jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email   text := lower(btrim(COALESCE(p_email, '')));
  v_profile jsonb;
  v_report  jsonb;
BEGIN
  IF p_profile IS NOT NULL AND jsonb_typeof(p_profile) = 'object' THEN
    v_profile := jsonb_strip_nulls(jsonb_build_object(
      'age',                   left(NULLIF(btrim(p_profile->>'age'), ''), 3),
      'height',                left(NULLIF(btrim(p_profile->>'height'), ''), 5),
      'weight',                left(NULLIF(btrim(p_profile->>'weight'), ''), 5),
      'preferredFoot',         left(NULLIF(btrim(p_profile->>'preferredFoot'), ''), 20),
      'nationality',           left(NULLIF(btrim(p_profile->>'nationality'), ''), 60),
      'position',              left(NULLIF(btrim(p_profile->>'position'), ''), 40),
      'category',              left(NULLIF(btrim(p_profile->>'category'), ''), 20),
      'state',                 left(NULLIF(btrim(p_profile->>'state'), ''), 40),
      'city',                  left(NULLIF(btrim(p_profile->>'city'), ''), 80),
      'hasDualCitizenship',    left(NULLIF(btrim(p_profile->>'hasDualCitizenship'), ''), 10),
      'dualCitizenshipCountry',left(NULLIF(btrim(p_profile->>'dualCitizenshipCountry'), ''), 60)
    ));
  END IF;

  IF p_report IS NOT NULL AND jsonb_typeof(p_report) = 'object' AND pg_column_size(p_report) <= 2048 THEN
    v_report := p_report;
  END IF;

  UPDATE public.funnel_leads
     SET profile    = COALESCE(v_profile, profile),
         report     = COALESCE(v_report, report),
         updated_at = now()
   WHERE id = p_lead_id
     AND email = v_email;
END;
$$;

REVOKE ALL ON FUNCTION public.capture_funnel_profile(uuid, text, jsonb, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.capture_funnel_profile(uuid, text, jsonb, jsonb) TO anon, authenticated;

-- Mesa de trabalho dos admins. player_key = 'lead:<uuid>' (funil) ou
-- 'atleta:<id>' (conta), para cobrir as duas origens com uma tabela só.
CREATE TABLE IF NOT EXISTS public.voxen_player_meta (
  player_key text PRIMARY KEY CHECK (length(player_key) <= 80),
  stage      text NOT NULL DEFAULT 'novo'
             CHECK (stage IN ('novo', 'contato', 'avaliacao', 'aprovado', 'descartado')),
  notes      text CHECK (notes IS NULL OR length(notes) <= 5000),
  scout      jsonb CHECK (scout IS NULL OR pg_column_size(scout) <= 4096),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.voxen_player_meta ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.voxen_player_meta FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.voxen_player_meta TO authenticated;

DROP POLICY IF EXISTS "Admins manage voxen meta" ON public.voxen_player_meta;
CREATE POLICY "Admins manage voxen meta"
  ON public.voxen_player_meta FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
