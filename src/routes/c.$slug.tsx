import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bell, CalendarDays, Menu, Pin, Search } from "lucide-react";
import { MenuBar } from "@/components/MenuBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  buscarIglesias,
  contenidosDe,
  ingresar,
  iglesiaPorSlug,
  registrar,
  salir,
  seed,
  sesionActual,
  type Contenido,
  type Iglesia,
  type Miembro,
} from "@/lib/manantial";

export const Route = createFileRoute("/c/$slug")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrada de tu iglesia | Manantial de Bendiciones" },
      {
        name: "description",
        content:
          "Entrada independiente de cada sede: anuncios, eventos y mensaje del pastor solo de tu iglesia.",
      },
      { property: "og:title", content: "Entrada de tu iglesia | Manantial de Bendiciones" },
      {
        property: "og:description",
        content: "Registrate con el código de tu sede y accedé al contenido de tu iglesia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EntradaIglesia,
});

function EntradaIglesia() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [listo, setListo] = useState(false);
  const [iglesia, setIglesia] = useState<Iglesia | null>(null);
  const [user, setUser] = useState<Miembro | null>(null);

  useEffect(() => {
    seed();
    const igl = iglesiaPorSlug(slug);
    setIglesia(igl);
    const s = sesionActual();
    setUser(s && igl && s.iglesia_id === igl.id ? s : null);
    setListo(true);
  }, [slug]);

  if (!listo) return <main className="gradient-night min-h-screen" />;

  if (!iglesia) {
    return (
      <main className="gradient-night flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="text-2xl font-black">Esta iglesia no existe</h1>
        <p className="text-sm text-muted-foreground">
          Revisá el link que te compartió tu pastor.
        </p>
        <Button asChild variant="gold">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </main>
    );
  }

  if (!user) {
    return (
      <Acceso
        iglesia={iglesia}
        onEntrar={(m) => {
          setUser(m);
          if (m.rol === "super_admin") navigate({ to: "/super-admin" });
        }}
      />
    );
  }

  return (
    <Miembros
      iglesia={iglesia}
      user={user}
      onSalir={() => {
        salir();
        setUser(null);
      }}
    />
  );
}

function Acceso({
  iglesia,
  onEntrar,
}: {
  iglesia: Iglesia;
  onEntrar: (m: Miembro) => void;
}) {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [form, setForm] = useState({ nombre: "", email: "", password: "", codigo: "" });
  const [error, setError] = useState<string | null>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const m =
        modo === "login"
          ? ingresar(form.email, form.password, iglesia.slug)
          : registrar({ ...form, slug: iglesia.slug });
      onEntrar(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos completar el ingreso.");
    }
  }

  return (
    <main className="gradient-night flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <img
            src={iglesia.logo}
            alt={`Logo de ${iglesia.nombre}`}
            width={80}
            height={80}
            className="mx-auto h-20 w-20 rounded-2xl border shadow-[var(--shadow-elegant)]"
            style={{ borderColor: iglesia.color }}
          />
          <h1 className="mt-5 text-2xl font-black" style={{ color: iglesia.color }}>
            {iglesia.nombre}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">/c/{iglesia.slug}</p>
        </div>

        <div className="card-night mt-7 rounded-2xl p-5">
          <div className="mb-5 grid grid-cols-2 gap-2">
            <Button variant={modo === "login" ? "gold" : "ghost"} onClick={() => setModo("login")}>
              Ingresar
            </Button>
            <Button
              variant={modo === "registro" ? "gold" : "ghost"}
              onClick={() => setModo("registro")}
            >
              Registrarme
            </Button>
          </div>

          <form onSubmit={enviar} className="space-y-4">
            {modo === "registro" && (
              <div>
                <Label htmlFor="nombre">Nombre y apellido</Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            {modo === "registro" && (
              <div>
                <Label htmlFor="codigo">Código de acceso de esta iglesia</Label>
                <Input
                  id="codigo"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="Ej: CAS-4821"
                  required
                />
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" variant="gold" size="lg" className="w-full">
              {modo === "login" ? "Entrar" : "Crear mi cuenta"}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground underline">
            Buscar otra iglesia
          </Link>
        </div>
      </div>
    </main>
  );
}

function Miembros({
  iglesia,
  user,
  onSalir,
}: {
  iglesia: Iglesia;
  user: Miembro;
  onSalir: () => void;
}) {
  const [q, setQ] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const contenidos = useMemo<Contenido[]>(() => contenidosDe(iglesia.id), [iglesia.id]);
  const anuncios = contenidos.filter((c) => c.tipo === "anuncio");
  const eventos = contenidos.filter((c) => c.tipo === "evento");
  const mensajes = contenidos.filter((c) => c.tipo === "mensaje_pastor");
  const publicaciones = [...eventos, ...anuncios, ...mensajes];
  const encontradas = q.trim() ? buscarIglesias(q) : [];
  const iniciales = user.nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-surface-muted pb-28">
      <header className="sticky top-0 z-30 bg-navy text-navy-foreground shadow-[var(--shadow-elegant)]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3.5">
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
            className="rounded-lg p-1 transition hover:bg-white/10"
          >
            <Menu className="h-6 w-6" aria-hidden />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold">{iglesia.nombre}</h1>
          <span className="relative rounded-lg p-1">
            <Bell className="h-6 w-6" aria-hidden />
            <span className="absolute -top-0.5 -right-0.5 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
              {publicaciones.length}
            </span>
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-white/10 text-sm font-bold">
            {iniciales || "M"}
          </span>
        </div>
        {menuAbierto && (
          <div className="mx-auto max-w-3xl space-y-3 px-4 pb-4">
            <div>
              <Label htmlFor="buscar-iglesia" className="text-navy-foreground">
                Busca tu iglesia por nombre
              </Label>
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/95 px-2">
                <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
                <Input
                  id="buscar-iglesia"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ej: Caseros"
                  className="border-0 bg-transparent text-foreground shadow-none focus-visible:ring-0"
                />
              </div>
              <ul className="mt-3 space-y-2">
                {encontradas.map((i) => (
                  <li
                    key={i.id}
                    className="flex flex-col gap-2 rounded-xl bg-white/95 p-3 text-foreground sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-semibold">{i.nombre}</span>
                    <Button asChild variant="goldOutline" size="sm">
                      <Link to="/c/$slug" params={{ slug: i.slug }}>
                        Entrar a esta iglesia
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
            <Button
              variant="ghost"
              onClick={onSalir}
              className="w-full text-navy-foreground hover:bg-white/10"
            >
              Salir
            </Button>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-4">
        <section className="flex items-start gap-4 rounded-3xl bg-card p-5 shadow-[var(--shadow-elegant)]">
          <img
            src={iglesia.logo}
            alt={`Logo de ${iglesia.nombre}`}
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
          />
          <div className="min-w-0">
            <h2 className="text-xl leading-tight font-black text-navy">
              <span aria-hidden>👋</span> Bienvenido, {user.nombre}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Anuncios de {iglesia.nombre}.</p>
          </div>
        </section>

        {publicaciones.length === 0 && (
          <p className="rounded-3xl bg-card p-5 text-sm text-muted-foreground shadow-[var(--shadow-elegant)]">
            Todavía no hay publicaciones de tu iglesia.
          </p>
        )}

        {publicaciones.map((c) => (
          <Publicacion key={c.id} item={c} />
        ))}
      </main>

      <MenuBar links={iglesia.links} />
    </div>
  );
}

const ETIQUETA: Record<Contenido["tipo"], string> = {
  anuncio: "Anuncio",
  evento: "Evento",
  mensaje_pastor: "Mensaje del Pastor",
  urgente: "Urgente",
  bautismo: "Bautismo",
};

function Publicacion({ item }: { item: Contenido }) {
  return (
    <article className="overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-elegant)]">
      {item.imagen && (
        <img src={item.imagen} alt={item.titulo} className="h-44 w-full object-cover" />
      )}
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {ETIQUETA[item.tipo]}
          </span>
          {(item.fijado || item.tipo === "evento") && (
            <span className="flex items-center gap-1 text-xs font-semibold text-primary">
              <Pin className="h-3.5 w-3.5" aria-hidden /> Fijado
            </span>
          )}
        </div>
        <h3 className="text-xl font-black text-navy">{item.titulo}</h3>
        <p className="text-sm text-muted-foreground">{item.detalle}</p>
        {item.fecha && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
            {new Date(item.fecha).toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    </article>
  );
}

