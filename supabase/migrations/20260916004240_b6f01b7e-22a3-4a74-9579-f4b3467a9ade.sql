ALTER VIEW public.iglesias_publicas SET (security_invoker = on);

GRANT SELECT (id, nombre, slug, links, logo, color, creado_en, pastor_nombre, pastor_foto) ON public.iglesias TO anon;

DROP POLICY IF EXISTS "Datos publicos de iglesias" ON public.iglesias;
CREATE POLICY "Datos publicos de iglesias"
ON public.iglesias FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Contenidos visibles" ON public.contenidos;
CREATE POLICY "Contenidos visibles para su iglesia"
ON public.contenidos FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND (u.rol = 'super_admin' OR u.iglesia_id = contenidos.iglesia_id))
  OR EXISTS (SELECT 1 FROM public.iglesias i WHERE i.id = contenidos.iglesia_id AND i.admin_uid = auth.uid())
);
REVOKE SELECT ON public.contenidos FROM anon;