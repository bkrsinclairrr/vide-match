-- Imagens da VOXEN (escudos dos clubes e foto de corpo inteiro do atleta) no Storage.
--
-- Bucket zyron-media: leitura pública (as imagens aparecem na área do atleta pelo endereço público),
-- só PNG, JPEG e WebP, até 2 MB cada. Enviar, trocar e apagar: só quem mantém jogador (can_scout).
-- Caminhos usados pelo painel: clubs/<clube>/escudo-<hora>.webp e players/<membro>/corpo-<hora>-{640,1000}.webp.
-- Tudo repetível.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('zyron-media', 'zyron-media', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Team reads zyron media" ON storage.objects;
CREATE POLICY "Team reads zyron media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'zyron-media' AND public.can_scout());

DROP POLICY IF EXISTS "Team uploads zyron media" ON storage.objects;
CREATE POLICY "Team uploads zyron media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'zyron-media' AND public.can_scout());

DROP POLICY IF EXISTS "Team updates zyron media" ON storage.objects;
CREATE POLICY "Team updates zyron media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'zyron-media' AND public.can_scout())
  WITH CHECK (bucket_id = 'zyron-media' AND public.can_scout());

DROP POLICY IF EXISTS "Team deletes zyron media" ON storage.objects;
CREATE POLICY "Team deletes zyron media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'zyron-media' AND public.can_scout());
