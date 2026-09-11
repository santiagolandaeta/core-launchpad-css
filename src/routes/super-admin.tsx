import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Church, Copy, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  crearIglesia,
  eliminarIglesia,
  getIglesias,
  ingresar,
  miembrosDe,
  salir,
  seed,
  sesionActual,
  totalMiembros,
  type Iglesia,
  type Miembro,
} from "@/lib/manantial";

export const Route = createFileRoute("/super-admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Super Admin | Manantial de Bendiciones" },
      {
        name: "description",
        content: "Panel general: iglesias totales, miembros totales y alta de nuevas sedes.",
      },
      { property: "og:title", content: "Super Admin | Manantial de Bendiciones" },
      {
        property: "og:description",
        content: "Creá iglesias independientes con su link de entrada, código y administrador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SuperAdmin,
});

function SuperAdmin() {
  const [listo, setListo] = useState(false);
  const [user, setUser] = useState<Miembro | null>(null);

  useEffect(() => {
    seed();
    const s = sesionActual();
    setUser(s && s.rol === "super_admin" ? s : null);
    setListo(true);
  }, []);

  if (!listo) return <main className="gradient-night min-h-screen" />;
  if (!user) return <LoginSuper onEntrar={setUser} />;
  return (
    <Panel
      onSalir={() => {
        salir();
        setUser(null);
      }}
    />
  );
}

function LoginSuper({ onEntrar }: { onEntrar: (m: Miembro) => void }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const m = ingresar(form.email, form.password);
      if (m.rol !== "super_admin") throw new Error("Esta cuenta no es de Super Admin.");
      onEntrar(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos ingresar.");
    }
  }

  return (
    <main className="gradient-night flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-gradient-gold text-center text-2xl font-black">Super Admin</h1>
        <form onSubmit={enviar} className="card-night mt-7 space-y-4 rounded-2xl p-5">
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
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" variant="gold" size="lg" className="w-full">
            Entrar
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Demo: super@manantial.app / admin123
          </p>
        </form>
        <div className="mt-5 text-center">
          <Link to="/" className="text-xs text-muted-foreground underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

function Panel({ onSalir }: { onSalir: () => void }) {
  const [iglesias, setIglesias] = useState<Iglesia[]>([]);
  const [miembros, setMiembros] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState({ nombre: "", email_admin: "", password_admin: "" });
  const [nueva, setNueva] = useState<Iglesia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [verMiembros, setVerMiembros] = useState<Iglesia | null>(null);

  function refrescar() {
    setIglesias(getIglesias());
    setMiembros(totalMiembros());
  }

  useEffect(refrescar, []);

  function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const iglesia = crearIglesia(form);
      setNueva(iglesia);
      setForm({ nombre: "", email_admin: "", password_admin: "" });
      setAbierto(false);
      refrescar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la iglesia.");
    }
  }

  async function copiar(texto: string, etiqueta: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(etiqueta);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      setCopiado(null);
    }
  }

  function borrar(i: Iglesia) {
    if (!window.confirm(`¿Eliminar ${i.nombre} con sus miembros y contenido?`)) return;
    eliminarIglesia(i.id);
    if (verMiembros?.id === i.id) setVerMiembros(null);
    refrescar();
  }

  const origen = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="gradient-night min-h-screen pb-16">
      <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 pt-8">
        <div>
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">Panel general</p>
          <h1 className="text-gradient-gold text-2xl font-black">Super Admin</h1>
        </div>
        <Button variant="ghost" onClick={onSalir}>
          Salir
        </Button>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-5 pt-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="card-night rounded-2xl p-6 text-center">
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Church className="h-4 w-4" aria-hidden /> Iglesias totales
            </p>
            <p className="text-gradient-gold mt-2 text-5xl font-black">{iglesias.length}</p>
          </div>
          <div className="card-night rounded-2xl p-6 text-center">
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" aria-hidden /> Miembros totales
            </p>
            <p className="text-gradient-gold mt-2 text-5xl font-black">{miembros}</p>
          </div>
        </section>

        <Button variant="gold" size="lg" onClick={() => setAbierto((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" aria-hidden /> Registrar nueva iglesia
        </Button>

        {abierto && (
          <form onSubmit={crear} className="card-night space-y-4 rounded-2xl p-5">
            <div>
              <Label htmlFor="nombre">Nombre iglesia</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Manantial de Bendiciones Caseros"
                required
              />
            </div>
            <div>
              <Label htmlFor="email_admin">Email administrador</Label>
              <Input
                id="email_admin"
                type="email"
                value={form.email_admin}
                onChange={(e) => setForm({ ...form, email_admin: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="password_admin">Contraseña administrador</Label>
              <Input
                id="password_admin"
                type="password"
                value={form.password_admin}
                onChange={(e) => setForm({ ...form, password_admin: e.target.value })}
                required
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" variant="gold">
              Guardar iglesia
            </Button>
          </form>
        )}

        {nueva && (
          <div className="card-night rounded-2xl border-primary/50 p-5">
            <p className="font-bold text-primary">¡Iglesia creada!</p>
            <p className="mt-2 text-sm">
              Link de entrada: <span className="font-mono">/c/{nueva.slug}</span> | Código para
              miembros: <span className="font-mono">{nueva.codigo_acceso}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="goldOutline"
                size="sm"
                onClick={() => copiar(`${origen}/c/${nueva.slug}`, "link")}
              >
                <Copy className="mr-1 h-4 w-4" aria-hidden /> Copiar link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copiar(nueva.codigo_acceso, "codigo")}
              >
                <Copy className="mr-1 h-4 w-4" aria-hidden /> Copiar código
              </Button>
            </div>
            {copiado && <p className="mt-2 text-xs text-primary">Copiado: {copiado}</p>}
          </div>
        )}

        <section className="card-night rounded-2xl p-5">
          <h2 className="text-base font-bold text-primary">Iglesias registradas</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Slug</th>
                  <th className="py-2 pr-3">Código acceso</th>
                  <th className="py-2 pr-3">Email admin</th>
                  <th className="py-2 pr-3">Miembros con App</th>
                  <th className="py-2 pr-3">Link</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {iglesias.map((i) => (
                  <tr key={i.id} className="border-t border-border/60 align-top">
                    <td className="py-3 pr-3 font-semibold">{i.nombre}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{i.slug}</td>
                    <td className="py-3 pr-3 font-mono text-primary">{i.codigo_acceso}</td>
                    <td className="py-3 pr-3 text-muted-foreground">{i.email_admin}</td>
                    <td className="py-3 pr-3 font-bold">{miembrosDe(i.id).length}</td>
                    <td className="py-3 pr-3">
                      <Link
                        to="/c/$slug"
                        params={{ slug: i.slug }}
                        className="text-primary underline"
                      >
                        /c/{i.slug}
                      </Link>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="goldOutline" size="sm">
                          <Link to="/admin-iglesia">Editar Links</Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setVerMiembros(verMiembros?.id === i.id ? null : i)}
                        >
                          Ver Miembros
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => borrar(i)}>
                          <Trash2 className="mr-1 h-4 w-4" aria-hidden /> Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {iglesias.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-3 text-muted-foreground">
                      Todavía no hay iglesias registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {verMiembros && (
          <section className="card-night rounded-2xl p-5">
            <h2 className="text-base font-bold text-primary">
              Miembros de {verMiembros.nombre}
            </h2>
            <ul className="mt-3 space-y-2">
              {miembrosDe(verMiembros.id).map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap justify-between gap-2 rounded-xl border border-border/70 p-3 text-sm"
                >
                  <span className="font-semibold">{m.nombre}</span>
                  <span className="text-muted-foreground">{m.email}</span>
                  <span className="text-muted-foreground">
                    {new Date(m.fecha_registro).toLocaleDateString("es-AR")}
                  </span>
                </li>
              ))}
              {miembrosDe(verMiembros.id).length === 0 && (
                <li className="text-sm text-muted-foreground">Sin miembros todavía.</li>
              )}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
