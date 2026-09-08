-- Security hardening: all application records require an authenticated owner.
ALTER TABLE public."Atletas" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on Atletas" ON public."Atletas";
DROP POLICY IF EXISTS "Allow public select on Atletas" ON public."Atletas";
DROP POLICY IF EXISTS "Users can insert own data" ON public."Atletas";
DROP POLICY IF EXISTS "Users can read own data" ON public."Atletas";
DROP POLICY IF EXISTS "Users can update own data" ON public."Atletas";
DROP POLICY IF EXISTS "Admins can delete any data" ON public."Atletas";

CREATE POLICY "Authenticated users can insert own athlete record"
  ON public."Atletas" FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own athlete record"
  ON public."Atletas" FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own athlete record"
  ON public."Atletas" FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete athlete records"
  ON public."Atletas" FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Prevent clients from changing ownership or server-managed identity fields.
CREATE OR REPLACE FUNCTION public.prevent_athlete_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.id IS DISTINCT FROM OLD.id) THEN
    RAISE EXCEPTION 'Protected athlete fields cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_athlete_tampering ON public."Atletas";
CREATE TRIGGER prevent_athlete_tampering
  BEFORE UPDATE ON public."Atletas"
  FOR EACH ROW EXECUTE FUNCTION public.prevent_athlete_tampering();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;