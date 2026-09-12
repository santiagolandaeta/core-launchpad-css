CREATE TABLE public.notificaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  iglesia_id text NOT NULL,
  contenido_id text NOT NULL,
  tipo text NOT NULL DEFAULT 'anuncio',
  titulo text NOT NULL,
  detalle text NOT NULL DEFAULT '',
  creada_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notificaciones_iglesia_idx ON public.notificaciones (iglesia_id, creada_en DESC);

GRANT SELECT, INSERT ON public.notificaciones TO anon;
GRANT SELECT, INSERT ON public.notificaciones TO authenticated;
GRANT ALL ON public.notificaciones TO service_role;

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver las notificaciones de una iglesia"
  ON public.notificaciones FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Cualquiera puede crear notificaciones de anuncios"
  ON public.notificaciones FOR INSERT TO anon, authenticated WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;