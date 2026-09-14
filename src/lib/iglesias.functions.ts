// Altas y bajas de iglesias: crean también la cuenta real del pastor en Auth.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function slugify(nombre: string) {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/manantial de bendiciones/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return limpio || "sede-" + Math.random().toString(36).slice(2, 6);
}

function generarCodigo(slug: string) {
  const prefijo = (slug.replace(/[^a-z]/g, "").slice(0, 3) || "mdb").toUpperCase();
  return `${prefijo}-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

async function exigirSuperAdmin(supabase: {
  from: (t: string) => {
    select: (c: string) => { eq: (a: string, b: string) => { maybeSingle: () => Promise<{ data: { rol?: string } | null }> } };
  };
}, userId: string) {
  const { data } = await supabase.from("usuarios").select("rol").eq("id", userId).maybeSingle();
  if (data?.rol !== "super_admin") throw new Error("Solo el Super Admin puede hacer esto.");
}

export const crearIglesia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        nombre: z.string().min(3, "Escribí el nombre completo de la iglesia."),
        email_admin: z.string().email("Email de administrador inválido."),
        password_admin: z.string().min(6, "La contraseña necesita al menos 6 caracteres."),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await exigirSuperAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const nombre = data.nombre.trim();
    const email = data.email_admin.trim().toLowerCase();

    const { data: existente } = await supabaseAdmin
      .from("iglesias")
      .select("id")
      .eq("email_admin", email)
      .maybeSingle();
    if (existente) throw new Error("Ese email de administrador ya está en uso.");

    let slug = slugify(nombre);
    const { data: mismoSlug } = await supabaseAdmin
      .from("iglesias")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (mismoSlug) slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;

    // Cuenta real del pastor en Auth.
    let uid: string | null = null;
    const creado = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password_admin,
      email_confirm: true,
      user_metadata: { nombre },
    });
    if (creado.error) {
      const { data: lista } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const previo = lista?.users.find((u) => u.email?.toLowerCase() === email);
      if (!previo) throw new Error(creado.error.message);
      uid = previo.id;
      await supabaseAdmin.auth.admin.updateUserById(previo.id, { password: data.password_admin });
    } else {
      uid = creado.data.user?.id ?? null;
    }
    if (!uid) throw new Error("No pudimos crear la cuenta del pastor.");

    const { data: iglesia, error } = await supabaseAdmin
      .from("iglesias")
      .insert({
        nombre,
        slug,
        codigo_acceso: generarCodigo(slug),
        email_admin: email,
        admin_uid: uid,
        pastor_nombre: nombre,
        email_contacto: email,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("usuarios")
      .upsert({ id: uid, email, nombre, rol: "pastor", iglesia_id: iglesia.id });

    return iglesia;
  });

export const eliminarIglesia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await exigirSuperAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: iglesia } = await supabaseAdmin
      .from("iglesias")
      .select("id, admin_uid")
      .eq("id", data.id)
      .maybeSingle();
    if (!iglesia) return { ok: true };

    await supabaseAdmin.from("notificaciones").delete().eq("iglesia_id", data.id);
    await supabaseAdmin.from("iglesias").delete().eq("id", data.id);
    if (iglesia.admin_uid) {
      await supabaseAdmin.from("usuarios").delete().eq("id", iglesia.admin_uid);
      await supabaseAdmin.auth.admin.deleteUser(iglesia.admin_uid);
    }
    return { ok: true };
  });
