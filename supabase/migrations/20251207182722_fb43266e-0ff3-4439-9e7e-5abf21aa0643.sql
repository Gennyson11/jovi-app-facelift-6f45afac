-- Criar enum para tipo de acesso
CREATE TYPE public.access_type AS ENUM ('credentials', 'link_only');

-- Adicionar coluna de tipo de acesso
ALTER TABLE public.streaming_platforms 
ADD COLUMN access_type access_type NOT NULL DEFAULT 'credentials';