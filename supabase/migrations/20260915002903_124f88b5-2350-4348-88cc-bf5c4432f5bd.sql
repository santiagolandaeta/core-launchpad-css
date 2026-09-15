-- 1) Vista pública con solo campos no sensibles
CREATE OR REPLACE VIEW public.iglesias_publicas AS
SELECT id, nombre, slug, links, logo, color, pastor_nombre, pastor_foto, creado_en
FROM public.iglesias;

GRANT SELECT ON public.iglesias_publicas TO anon, authenticated;

-- 2) La tabla completa deja de ser pública
DROP POLICY IF EXISTS "Iglesias visibles para todos" ON public.iglesias;
REVOKE SELECT ON public.iglesias FROM anon;
GRANT SELECT ON public.iglesias TO authenticated;

CREATE POLICY "Iglesia visible para su gente"
ON public.iglesias FOR SELECT TO authenticated
USING (
  admin_uid = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid() AND (u.rol = 'super_admin' OR u.iglesia_id = iglesias.id)
  )
);

-- 3) Verificación del código de acceso en el servidor
CREATE OR REPLACE FUNCTION public.codigo_valido(_slug text, _codigo text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.iglesias i
    WHERE i.slug = lower(_slug)
      AND upper(i.codigo_acceso) = upper(btrim(_codigo))
  )
$$;

REVOKE ALL ON FUNCTION public.codigo_valido(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.codigo_valido(text, text) TO anon, authenticated;

-- 4) Notificaciones: solo el pastor las crea, solo cuentas las leen
DROP POLICY IF EXISTS "Cualquiera puede crear notificaciones de anuncios" ON public.notificaciones;
DROP POLICY IF EXISTS "Cualquiera puede ver las notificaciones de una iglesia" ON public.notificaciones;
REVOKE ALL ON public.notificaciones FROM anon;
GRANT SELECT, INSERT ON public.notificaciones TO authenticated;

CREATE POLICY "El pastor crea notificaciones"
ON public.notificaciones FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.iglesias i
    WHERE i.id::text = notificaciones.iglesia_id AND i.admin_uid = auth.uid()
  )
);

CREATE POLICY "Notificaciones visibles para su iglesia"
ON public.notificaciones FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid()
      AND (u.rol = 'super_admin' OR u.iglesia_id::text = notificaciones.iglesia_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.iglesias i
    WHERE i.id::text = notificaciones.iglesia_id AND i.admin_uid = auth.uid()
  )
);