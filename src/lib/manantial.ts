// Capa de datos local (localStorage) para MANANTIAL DE BENDICIONES v3.
// Multi-iglesia independiente: cada iglesia tiene slug, código de acceso,
// admin propio y links de menú. Todo se filtra siempre por iglesia_id.

export type Rol = "super_admin" | "admin_iglesia" | "miembro";

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
  password_admin: string;
  links: LinksMenu;
  logo: string;
  color: string;
  creado_en: string;
  pastor_nombre?: string;
  pastor_foto?: string;
  email_contacto?: string;
};

export type PerfilPastor = {
  pastor_nombre: string;
  pastor_foto: string;
  email_contacto: string;
};

export type Miembro = {
  id: string;
  nombre: string;
  email: string;
  password: string;
  iglesia_id: string | null;
  rol: Rol;
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

const K = {
  iglesias: "mdb.v3.iglesias",
  miembros: "mdb.v3.miembros",
  contenidos: "mdb.v3.contenidos",
  sesion: "mdb.v3.sesion",
  sesionAdmin: "mdb.v3.sesion_admin",
};

const LOGO_DEFAULT = "/images/logo.png";
const GOLD = "#1877F2";
const LINKS_VACIOS: LinksMenu = {
  facebook: "",
  youtube: "",
  instagram: "",
  radio: "",
  libros: "",
};

const isBrowser = () => typeof window !== "undefined";
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (isBrowser()) window.localStorage.setItem(key, JSON.stringify(value));
}

export function slugify(nombre: string) {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/manantial de bendiciones/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return limpio || "sede-" + uid().slice(0, 4);
}

export function generarCodigo(slug: string) {
  const prefijo = (slug.replace(/[^a-z]/g, "").slice(0, 3) || "mdb").toUpperCase();
  const numero = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefijo}-${numero}`;
}

export const getIglesias = () => read<Iglesia[]>(K.iglesias, []);
export const getMiembros = () => read<Miembro[]>(K.miembros, []);
export const getContenidos = () => read<Contenido[]>(K.contenidos, []);

export const iglesiaPorSlug = (slug: string) =>
  getIglesias().find((i) => i.slug === slug.toLowerCase()) ?? null;
export const iglesiaPorId = (id: string | null) =>
  id ? (getIglesias().find((i) => i.id === id) ?? null) : null;

export function buscarIglesias(texto: string) {
  const q = texto.trim().toLowerCase();
  if (!q) return [];
  return getIglesias().filter(
    (i) => i.nombre.toLowerCase().includes(q) || i.slug.includes(q),
  );
}

export function seed() {
  if (!isBrowser() || window.localStorage.getItem(K.iglesias)) return;
  const ahora = new Date().toISOString();

  const base = [
    { id: "igl_central", nombre: "Manantial de Bendiciones Central", slug: "central", codigo: "CEN-1207" },
    { id: "igl_caseros", nombre: "Manantial de Bendiciones Caseros", slug: "caseros", codigo: "CAS-4821" },
    { id: "igl_ramos", nombre: "Manantial de Bendiciones Ramos Mejía", slug: "ramos-mejia", codigo: "RAM-3390" },
  ];

  const iglesias: Iglesia[] = base.map((b) => ({
    id: b.id,
    nombre: b.nombre,
    slug: b.slug,
    codigo_acceso: b.codigo,
    email_admin: `${b.slug}@manantial.app`,
    password_admin: "pastor123",
    links: {
      facebook: `https://facebook.com/manantial.${b.slug}`,
      youtube: `https://youtube.com/@manantial.${b.slug}`,
      instagram: `https://instagram.com/manantial.${b.slug}`,
      radio: "",
      libros: "",
    },
    logo: LOGO_DEFAULT,
    color: GOLD,
    creado_en: ahora,
  }));
  write(K.iglesias, iglesias);

  const miembros: Miembro[] = [
    {
      id: uid(),
      nombre: "Super Admin",
      email: "super@manantial.app",
      password: "admin123",
      iglesia_id: null,
      rol: "super_admin",
      fecha_registro: ahora,
    },
    ...iglesias.flatMap((i, idx) => [
      {
        id: uid(),
        nombre: `Hermana Ana ${idx + 1}`,
        email: `ana${idx + 1}@mail.com`,
        password: "123456",
        iglesia_id: i.id,
        rol: "miembro" as const,
        fecha_registro: ahora,
      },
      {
        id: uid(),
        nombre: `Hermano Luis ${idx + 1}`,
        email: `luis${idx + 1}@mail.com`,
        password: "123456",
        iglesia_id: i.id,
        rol: "miembro" as const,
        fecha_registro: ahora,
      },
    ]),
  ];
  write(K.miembros, miembros);

  write(
    K.contenidos,
    iglesias.flatMap((i) => [
      {
        id: uid(),
        iglesia_id: i.id,
        tipo: "anuncio" as const,
        titulo: "Culto de celebración",
        detalle: `Domingos 11:00 hs en ${i.nombre}. Traé a tu familia.`,
        creado_en: ahora,
      },
      {
        id: uid(),
        iglesia_id: i.id,
        tipo: "evento" as const,
        titulo: "Noche de alabanza",
        detalle: "Encuentro de adoración con el grupo de jóvenes.",
        fecha: "2026-09-19",
        creado_en: ahora,
      },
      {
        id: uid(),
        iglesia_id: i.id,
        tipo: "mensaje_pastor" as const,
        titulo: "Palabra del pastor",
        detalle: "Dios sostiene a su pueblo. Esta semana caminemos en fe y gratitud.",
        creado_en: ahora,
      },
    ]),
  );
}

export function crearIglesia(input: {
  nombre: string;
  email_admin: string;
  password_admin: string;
}): Iglesia {
  const nombre = input.nombre.trim();
  const email = input.email_admin.trim().toLowerCase();
  if (nombre.length < 3) throw new Error("Escribí el nombre completo de la iglesia.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email de administrador inválido.");
  if (input.password_admin.length < 6)
    throw new Error("La contraseña del administrador necesita al menos 6 caracteres.");
  if (getIglesias().some((i) => i.email_admin === email))
    throw new Error("Ese email de administrador ya está en uso.");

  let slug = slugify(nombre);
  if (iglesiaPorSlug(slug)) slug = `${slug}-${uid().slice(0, 3)}`;

  const iglesia: Iglesia = {
    id: "igl_" + uid(),
    nombre,
    slug,
    codigo_acceso: generarCodigo(slug),
    email_admin: email,
    password_admin: input.password_admin,
    links: { ...LINKS_VACIOS },
    logo: LOGO_DEFAULT,
    color: GOLD,
    creado_en: new Date().toISOString(),
  };
  write(K.iglesias, [...getIglesias(), iglesia]);
  return iglesia;
}

export function actualizarLinks(iglesia_id: string, links: LinksMenu) {
  write(
    K.iglesias,
    getIglesias().map((i) => (i.id === iglesia_id ? { ...i, links } : i)),
  );
}

export function actualizarPerfilPastor(iglesia_id: string, perfil: PerfilPastor) {
  const nombre = perfil.pastor_nombre.trim();
  const email = perfil.email_contacto.trim().toLowerCase();
  if (nombre.length < 3) throw new Error("Escribí tu nombre completo.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("El correo de contacto no es válido.");
  write(
    K.iglesias,
    getIglesias().map((i) =>
      i.id === iglesia_id
        ? {
            ...i,
            pastor_nombre: nombre,
            pastor_foto: perfil.pastor_foto.trim(),
            email_contacto: email,
          }
        : i,
    ),
  );
}

export function eliminarIglesia(iglesia_id: string) {
  write(K.iglesias, getIglesias().filter((i) => i.id !== iglesia_id));
  write(K.miembros, getMiembros().filter((m) => m.iglesia_id !== iglesia_id));
  write(K.contenidos, getContenidos().filter((c) => c.iglesia_id !== iglesia_id));
}

export function registrar(input: {
  nombre: string;
  email: string;
  password: string;
  codigo: string;
  slug: string;
}): Miembro {
  const iglesia = iglesiaPorSlug(input.slug);
  if (!iglesia) throw new Error("Esta iglesia no existe.");
  if (input.codigo.trim().toUpperCase() !== iglesia.codigo_acceso)
    throw new Error(`Ese código no corresponde a ${iglesia.nombre}.`);
  const email = input.email.trim().toLowerCase();
  if (getMiembros().some((m) => m.email === email)) throw new Error("Ese email ya está registrado.");
  const miembro: Miembro = {
    id: uid(),
    nombre: input.nombre.trim(),
    email,
    password: input.password,
    iglesia_id: iglesia.id,
    rol: "miembro",
    fecha_registro: new Date().toISOString(),
  };
  write(K.miembros, [...getMiembros(), miembro]);
  write(K.sesion, miembro.id);
  return miembro;
}

export function ingresar(email: string, password: string, slug?: string): Miembro {
  const miembro = getMiembros().find(
    (m) => m.email === email.trim().toLowerCase() && m.password === password,
  );
  if (!miembro) throw new Error("Email o contraseña incorrectos.");
  if (slug) {
    const iglesia = iglesiaPorSlug(slug);
    if (miembro.rol !== "super_admin" && miembro.iglesia_id !== iglesia?.id)
      throw new Error("Tu cuenta pertenece a otra iglesia.");
  }
  write(K.sesion, miembro.id);
  return miembro;
}

export function salir() {
  if (isBrowser()) window.localStorage.removeItem(K.sesion);
}

export function sesionActual(): Miembro | null {
  const id = read<string | null>(K.sesion, null);
  if (!id) return null;
  return getMiembros().find((m) => m.id === id) ?? null;
}

// Sesión del admin de iglesia (panel /admin-iglesia)
export function ingresarAdminIglesia(email: string, password: string): Iglesia {
  const mail = email.trim().toLowerCase();
  const iglesia = getIglesias().find(
    (i) => i.email_admin === mail && i.password_admin === password,
  );
  if (!iglesia) throw new Error("Email o contraseña incorrectos.");
  write(K.sesionAdmin, iglesia.id);
  return iglesia;
}

export function sesionAdminIglesia(): Iglesia | null {
  const id = read<string | null>(K.sesionAdmin, null);
  return id ? iglesiaPorId(id) : null;
}

export function salirAdminIglesia() {
  if (isBrowser()) window.localStorage.removeItem(K.sesionAdmin);
}

export function crearContenido(input: Omit<Contenido, "id" | "creado_en">): Contenido {
  const item: Contenido = { ...input, id: uid(), creado_en: new Date().toISOString() };
  write(K.contenidos, [item, ...getContenidos()]);
  return item;
}

export function eliminarContenido(id: string) {
  write(K.contenidos, getContenidos().filter((c) => c.id !== id));
}

export function alternarFijado(id: string) {
  write(
    K.contenidos,
    getContenidos().map((c) => (c.id === id ? { ...c, fijado: !c.fijado } : c)),
  );
}

export const contenidosDe = (iglesia_id: string) =>
  getContenidos()
    .filter((c) => c.iglesia_id === iglesia_id)
    .sort((a, b) => Number(!!b.fijado) - Number(!!a.fijado));

export const miembrosDe = (iglesia_id: string) =>
  getMiembros().filter((m) => m.iglesia_id === iglesia_id && m.rol === "miembro");

export const totalMiembros = () => getMiembros().filter((m) => m.rol === "miembro").length;
