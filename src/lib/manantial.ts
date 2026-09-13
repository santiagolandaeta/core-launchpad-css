// Capa de datos real sobre Lovable Cloud (Postgres + Auth).
// Nada se guarda en memoria ni en arrays locales: todo vive en la base de datos.
import { supabase } from "@/integrations/supabase/client";

export type Rol = "super_admin" | "pastor" | "miembro";

export type LinksMenu = {
  facebook: string;
  youtube: string;
  instagram: string;
  radio: string;
  libros: string;
};

export type Iglesia = {
  id: string;
  nombre: string;
  slug: string;
  codigo_acceso: string;
  email_admin: string;
  admin_uid: string | null;
  links: LinksMenu;
  logo: string;
  color: string;
  creado_en: string;
  pastor_nombre: string;
  pastor_foto: string;
  email_contacto: string;
};

export type PerfilPastor = {
  pastor_nombre: string;
  pastor_foto: string;
  email_contacto: string;
};

export type Perfil = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  iglesia_id: string | null;
};

export type Miembro = {
  id: string;
  nombre: string;
  email: string;
  iglesia_id: string;
  fecha_registro: string;
};

export type Contenido = {
  id: string;
  iglesia_id: string;
  tipo: "anuncio" | "evento" | "mensaje_pastor" | "urgente" | "bautismo";
  titulo: string;
  detalle: string;
  fecha?: string;
  imagen?: string;
  fijado?: boolean;
  creado_en: string;
};

const LINKS_VACIOS: LinksMenu = {
  facebook: "",
  youtube: "",
  instagram: "",
  radio: "",
  libros: "",
};

/* ---------------------------------- utils --------------------------------- */

export function slugify(nombre: string) {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/manantial de bendiciones/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return limpio || "sede-" + Math.random().toString(36).slice(2, 6);
}

export function generarCodigo(slug: string) {
  const prefijo = (slug.replace(/[^a-z]/g, "").slice(0, 3) || "mdb").toUpperCase();
  return `${prefijo}-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

type FilaIglesia = {
  id: string;
  nombre: string;
  slug: string;
  codigo_acceso: string;
  email_admin: string;
  admin_uid: string | null;
  links: unknown;
  logo: string;
  color: string;
  creado_en: string;
  pastor_nombre: string;
  pastor_foto: string;
  email_contacto: string;
};

function aIglesia(fila: FilaIglesia): Iglesia {
  const links = (fila.links ?? {}) as Partial<LinksMenu>;
  return { ...fila, links: { ...LINKS_VACIOS, ...links } };
}

function aContenido(fila: Record<string, unknown>): Contenido {
  return {
    id: String(fila['id']),
    iglesia_id: String(fila['iglesia_id']),
    tipo: fila['tipo'] as Contenido["tipo"],
    titulo: String(fila['titulo'] ?? ""),
    detalle: String(fila['detalle'] ?? ""),
    creado_en: String(fila['creado_en']),
    fijado: Boolean(fila['fijado']),
    ...(fila['fecha'] ? { fecha: String(fila['fecha']) } : {}),
    ...(fila['imagen'] ? { imagen: String(fila['imagen']) } : {}),
  };
}

/* --------------------------------- iglesias -------------------------------- */

export async function listarIglesias(): Promise<Iglesia[]> {
  const { data, error } = await supabase.from("iglesias").select("*").order("nombre");
  if (error) throw new Error(error.message);
  return (data ?? []).map((f) => aIglesia(f as FilaIglesia));
}

export async function iglesiaPorSlug(slug: string): Promise<Iglesia | null> {
  const { data, error } = await supabase
    .from("iglesias")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? aIglesia(data as FilaIglesia) : null;
}

export async function iglesiaPorId(id: string | null): Promise<Iglesia | null> {
  if (!id) return null;
  const { data, error } = await supabase.from("iglesias").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? aIglesia(data as FilaIglesia) : null;
}

export async function buscarIglesias(texto: string): Promise<Iglesia[]> {
  const q = texto.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from("iglesias")
    .select("*")
    .or(`nombre.ilike.%${q}%,slug.ilike.%${q}%`)
    .order("nombre");
  if (error) throw new Error(error.message);
  return (data ?? []).map((f) => aIglesia(f as FilaIglesia));
}

// Equivalente a onSnapshot: se vuelve a leer la tabla ante cualquier cambio.
export function suscribirIglesias(cb: () => void) {
  const canal = supabase
    .channel(`iglesias-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "iglesias" }, () => cb())
    .on("postgres_changes", { event: "*", schema: "public", table: "miembros" }, () => cb())
    .subscribe();
  return () => {
    void supabase.removeChannel(canal);
  };
}

export async function actualizarLinks(iglesia_id: string, links: LinksMenu) {
  const { error } = await supabase.from("iglesias").update({ links }).eq("id", iglesia_id);
  if (error) throw new Error(error.message);
}

export async function actualizarPerfilPastor(iglesia_id: string, perfil: PerfilPastor) {
  const nombre = perfil.pastor_nombre.trim();
  const email = perfil.email_contacto.trim().toLowerCase();
  if (nombre.length < 3) throw new Error("Escribí tu nombre completo.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("El correo de contacto no es válido.");
  const { error } = await supabase
    .from("iglesias")
    .update({ pastor_nombre: nombre, pastor_foto: perfil.pastor_foto.trim(), email_contacto: email })
    .eq("id", iglesia_id);
  if (error) throw new Error(error.message);
}

/* --------------------------------- miembros -------------------------------- */

export async function miembrosDe(iglesia_id: string): Promise<Miembro[]> {
  const { data, error } = await supabase
    .from("miembros")
    .select("id, nombre, email, iglesia_id, fecha_registro")
    .eq("iglesia_id", iglesia_id)
    .order("fecha_registro", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Miembro[];
}

export async function totalMiembros(): Promise<number> {
  const { count, error } = await supabase
    .from("miembros")
    .select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function contarMiembros(iglesia_id: string): Promise<number> {
  const { count, error } = await supabase
    .from("miembros")
    .select("id", { count: "exact", head: true })
    .eq("iglesia_id", iglesia_id);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/* ----------------------------- cuentas / sesión ---------------------------- */

async function perfilDe(userId: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, email, nombre, rol, iglesia_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? ({ ...data, rol: data.rol as Rol } as Perfil) : null;
}

export async function perfilActual(): Promise<Perfil | null> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return perfilDe(data.user.id);
}

export async function ingresar(email: string, password: string): Promise<Perfil> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error("Email o contraseña incorrectos.");
  const perfil = await perfilDe(data.user.id);
  if (!perfil) throw new Error("Tu cuenta todavía no tiene perfil asignado.");
  return perfil;
}

export async function salir() {
  await supabase.auth.signOut();
}

export async function registrarMiembro(input: {
  nombre: string;
  email: string;
  password: string;
  codigo: string;
  slug: string;
}): Promise<Perfil> {
  const iglesia = await iglesiaPorSlug(input.slug);
  if (!iglesia) throw new Error("Esta iglesia no existe.");
  if (input.codigo.trim().toUpperCase() !== iglesia.codigo_acceso.toUpperCase())
    throw new Error(`Ese código no corresponde a ${iglesia.nombre}.`);

  const email = input.email.trim().toLowerCase();
  const nombre = input.nombre.trim();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { emailRedirectTo: window.location.origin, data: { nombre } },
  });
  if (error) {
    throw new Error(
      error.message.toLowerCase().includes("already")
        ? "Ese email ya está registrado. Probá ingresando."
        : error.message,
    );
  }
  const userId = data.user?.id;
  if (!userId || !data.session) {
    await supabase.auth.signInWithPassword({ email, password: input.password });
  }
  const { data: sesion } = await supabase.auth.getUser();
  const uid = sesion.user?.id ?? userId;
  if (!uid) throw new Error("No pudimos crear tu cuenta.");

  const { error: e1 } = await supabase
    .from("usuarios")
    .upsert({ id: uid, email, nombre, rol: "miembro", iglesia_id: iglesia.id });
  if (e1) throw new Error(e1.message);

  const { error: e2 } = await supabase
    .from("miembros")
    .insert({ user_id: uid, iglesia_id: iglesia.id, nombre, email, rol: "miembro" });
  if (e2 && !e2.message.includes("duplicate")) throw new Error(e2.message);

  return { id: uid, email, nombre, rol: "miembro", iglesia_id: iglesia.id };
}

/* -------------------------------- contenidos ------------------------------- */

export async function contenidosDe(iglesia_id: string): Promise<Contenido[]> {
  const { data, error } = await supabase
    .from("contenidos")
    .select("*")
    .eq("iglesia_id", iglesia_id)
    .order("fijado", { ascending: false })
    .order("creado_en", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((f) => aContenido(f as Record<string, unknown>));
}

export function suscribirContenidos(iglesia_id: string, cb: () => void) {
  const canal = supabase
    .channel(`contenidos-${iglesia_id}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "contenidos" }, () => cb())
    .subscribe();
  return () => {
    void supabase.removeChannel(canal);
  };
}

export async function crearContenido(input: {
  iglesia_id: string;
  tipo: Contenido["tipo"];
  titulo: string;
  detalle: string;
  fecha?: string;
  imagen?: string;
  fijado?: boolean;
}): Promise<Contenido> {
  const { data, error } = await supabase
    .from("contenidos")
    .insert({
      iglesia_id: input.iglesia_id,
      tipo: input.tipo,
      titulo: input.titulo,
      detalle: input.detalle,
      fijado: input.fijado ?? false,
      fecha: input.fecha ? input.fecha : null,
      imagen: input.imagen ? input.imagen : null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return aContenido(data as Record<string, unknown>);
}

export async function eliminarContenido(id: string) {
  const { error } = await supabase.from("contenidos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function alternarFijado(id: string, fijado: boolean) {
  const { error } = await supabase.from("contenidos").update({ fijado: !fijado }).eq("id", id);
  if (error) throw new Error(error.message);
}
