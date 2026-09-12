// Notificaciones de anuncios guardadas en la nube (Lovable Cloud).
import { supabase } from "@/integrations/supabase/client";

export type Notificacion = {
  id: string;
  iglesia_id: string;
  contenido_id: string;
  tipo: string;
  titulo: string;
  detalle: string;
  creada_en: string;
};

const claveLeidas = (iglesia_id: string) => `mdb.v3.notif_leidas.${iglesia_id}`;

export async function crearNotificacion(input: {
  iglesia_id: string;
  contenido_id: string;
  tipo: string;
  titulo: string;
  detalle: string;
}) {
  const { error } = await supabase.from("notificaciones").insert({
    iglesia_id: input.iglesia_id,
    contenido_id: input.contenido_id,
    tipo: input.tipo,
    titulo: input.titulo,
    detalle: input.detalle.slice(0, 500),
  });
  if (error) throw new Error(error.message);
}

export async function listarNotificaciones(iglesia_id: string): Promise<Notificacion[]> {
  const { data, error } = await supabase
    .from("notificaciones")
    .select("*")
    .eq("iglesia_id", iglesia_id)
    .order("creada_en", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as Notificacion[];
}

export function ultimaLectura(iglesia_id: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(claveLeidas(iglesia_id));
}

export function marcarLeidas(iglesia_id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(claveLeidas(iglesia_id), new Date().toISOString());
}

export function contarNoLeidas(iglesia_id: string, lista: Notificacion[]) {
  const desde = ultimaLectura(iglesia_id);
  if (!desde) return lista.length;
  return lista.filter((n) => n.creada_en > desde).length;
}
