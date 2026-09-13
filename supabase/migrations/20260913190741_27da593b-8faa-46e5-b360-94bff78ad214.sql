DROP POLICY "Perfil propio o super admin" ON public.usuarios;
DROP POLICY "Miembros visibles para su pastor" ON public.miembros;
DROP POLICY "El pastor crea contenidos" ON public.contenidos;
DROP POLICY "El pastor edita contenidos" ON public.contenidos;
DROP POLICY "El pastor borra contenidos" ON public.contenidos;

DROP FUNCTION IF EXISTS public.rol_actual();
DROP FUNCTION IF EXISTS public.es_pastor_de(uuid);

CREATE POLICY "Perfil propio" ON public.usuarios
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Miembros visibles para su pastor" ON public.miembros
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.iglesias i WHERE i.id = miembros.iglesia_id AND i.admin_uid = auth.uid())
    OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol = 'super_admin')
  );

CREATE POLICY "El pastor crea contenidos" ON public.contenidos
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.iglesias i WHERE i.id = contenidos.iglesia_id AND i.admin_uid = auth.uid()));

CREATE POLICY "El pastor edita contenidos" ON public.contenidos
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.iglesias i WHERE i.id = contenidos.iglesia_id AND i.admin_uid = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.iglesias i WHERE i.id = contenidos.iglesia_id AND i.admin_uid = auth.uid()));

CREATE POLICY "El pastor borra contenidos" ON public.contenidos
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.iglesias i WHERE i.id = contenidos.iglesia_id AND i.admin_uid = auth.uid()));