-- Criar enum para status da streaming
CREATE TYPE public.streaming_status AS ENUM ('online', 'maintenance');

-- Adicionar colunas à tabela de plataformas
ALTER TABLE public.streaming_platforms 
ADD COLUMN cover_image_url TEXT,
ADD COLUMN status streaming_status NOT NULL DEFAULT 'online';

-- Criar bucket de storage para as imagens de capa
INSERT INTO storage.buckets (id, name, public) 
VALUES ('streaming-covers', 'streaming-covers', true);

-- Política para qualquer um visualizar as imagens
CREATE POLICY "Public can view streaming covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'streaming-covers');

-- Política para admins fazerem upload
CREATE POLICY "Admins can upload streaming covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'streaming-covers' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Política para admins deletarem
CREATE POLICY "Admins can delete streaming covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'streaming-covers' 
  AND public.has_role(auth.uid(), 'admin')
);