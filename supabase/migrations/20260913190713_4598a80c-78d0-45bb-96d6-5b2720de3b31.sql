CREATE TABLE public.usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nombre text NOT NULL DEFAULT '',
  rol text NOT NULL DEFAULT 'miembro',
  iglesia_id uuid,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.iglesias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  slug text NOT NULL UNIQUE,
  codigo_acceso text NOT NULL,
  email_admin text NOT NULL,
  admin_uid uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  links jsonb NOT NULL DEFAULT '{"facebook":"","youtube":"","instagram":"","radio":"","libros":""}'::jsonb,
  logo text NOT NULL DEFAULT '/images/logo.png',
  color text NOT NULL DEFAULT '#1877F2',
  pastor_nombre text NOT NULL DEFAULT '',
  pastor_foto text NOT NULL DEFAULT '',
  email_contacto text NOT NULL DEFAULT '',
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.miembros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  iglesia_id uuid NOT NULL REFERENCES public.iglesias(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  email text NOT NULL,
  rol text NOT NULL DEFAULT 'miembro',
  fecha_registro timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contenidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iglesia_id uuid NOT NULL REFERENCES public.iglesias(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'anuncio',
  titulo text NOT NULL,
  detalle text NOT NULL DEFAULT '',
  fecha date,
  imagen text,
  fijado boolean NOT NULL DEFAULT false,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_miembros_iglesia ON public.miembros(iglesia_id);
CREATE INDEX idx_contenidos_iglesia ON public.contenidos(iglesia_id);

GRANT SELECT ON public.iglesias TO anon;
GRANT SELECT, UPDATE ON public.iglesias TO authenticated;
GRANT ALL ON public.iglesias TO service_role;

GRANT SELECT ON public.usuarios TO authenticated;
GRANT INSERT, UPDATE ON public.usuarios TO authenticated;
GRANT ALL ON public.usuarios TO service_role;

GRANT SELECT, INSERT ON public.miembros TO authenticated;
GRANT ALL ON public.miembros TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contenidos TO authenticated;
GRANT SELECT ON public.contenidos TO anon;
GRANT ALL ON public.contenidos TO service_role;

CREATE OR REPLACE FUNCTION public.rol_actual()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.usuarios WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.es_pastor_de(_iglesia uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.iglesias WHERE id = _iglesia AND admin_uid = auth.uid()
  )
$$;

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iglesias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miembros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contenidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfil propio o super admin" ON public.usuarios
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.rol_actual() = 'super_admin');

CREATE POLICY "Crea su propio perfil" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Edita su propio perfil" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Iglesias visibles para todos" ON public.iglesias
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "El pastor edita su iglesia" ON public.iglesias
  FOR UPDATE TO authenticated
  USING (admin_uid = auth.uid())
  WITH CHECK (admin_uid = auth.uid());

CREATE POLICY "Miembros visibles para su pastor" ON public.miembros
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.rol_actual() = 'super_admin'
    OR public.es_pastor_de(iglesia_id)
  );

CREATE POLICY "Cada persona crea su registro de miembro" ON public.miembros
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Contenidos visibles" ON public.contenidos
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "El pastor crea contenidos" ON public.contenidos
  FOR INSERT TO authenticated
  WITH CHECK (public.es_pastor_de(iglesia_id));

CREATE POLICY "El pastor edita contenidos" ON public.contenidos
  FOR UPDATE TO authenticated
  USING (public.es_pastor_de(iglesia_id))
  WITH CHECK (public.es_pastor_de(iglesia_id));

CREATE POLICY "El pastor borra contenidos" ON public.contenidos
  FOR DELETE TO authenticated
  USING (public.es_pastor_de(iglesia_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.iglesias;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contenidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.miembros;