import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buscarIglesias,
  iglesiaPorId,
  ingresar,
  listarIglesiasPublicas,
  perfilActual,
  suscribirIglesias,
  type Iglesia,
} from "@/lib/manantial";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Manantial de Bendiciones | Inicia sesión" },
      {
        name: "description",
        content:
          "Entrada principal de Manantial de Bendiciones: inicia sesión con tu correo y contraseña y accedé a los anuncios de tu iglesia.",
      },
      { property: "og:title", content: "Manantial de Bendiciones | Inicia sesión" },
      {
        property: "og:description",
        content: "Una sola entrada para todos: cada miembro ve el contenido de su propia sede.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ver, setVer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Iglesia[]>([]);
  const [buscando, setBuscando] = useState(false);

  // Iglesias siempre desde la base de datos, con actualización en vivo.
  useEffect(() => {
    let activo = true;
    const cargar = () =>
      listarIglesiasPublicas()
        .then((lista) => {
          if (activo) setResultados(lista);
        })
        .catch(() => undefined);
    cargar();
    const cortar = suscribirIglesias(cargar);
    return () => {
      activo = false;
      cortar();
    };
  }, []);

  useEffect(() => {
    if (!q.trim()) return;
    let activo = true;
    buscarIglesias(q)
      .then((lista) => {
        if (activo) setResultados(lista);
      })
      .catch(() => undefined);
    return () => {
      activo = false;
    };
  }, [q]);

  useEffect(() => {
    let activo = true;
    perfilActual()
      .then(async (p) => {
        if (!activo || !p) return;
        if (p.rol === "super_admin") {
          navigate({ to: "/super-admin" });
          return;
        }
        if (p.rol === "pastor") {
          navigate({ to: "/admin-iglesia" });
          return;
        }
        const igl = await iglesiaPorId(p.iglesia_id);
        if (activo && igl) navigate({ to: "/c/$slug", params: { slug: igl.slug } });
      })
      .catch(() => undefined);
    return () => {
      activo = false;
    };
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const p = await ingresar(email, password);
      if (p.rol === "super_admin") {
        navigate({ to: "/super-admin" });
        return;
      }
      if (p.rol === "pastor") {
        navigate({ to: "/admin-iglesia" });
        return;
      }
      const igl = await iglesiaPorId(p.iglesia_id);
      if (!igl) throw new Error("Tu cuenta todavía no tiene una iglesia asignada.");
      navigate({ to: "/c/$slug", params: { slug: igl.slug } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="gradient-night flex min-h-screen flex-col items-center px-6 py-12">
      <div className="w-full max-w-sm">
        <img
          src="/images/logo.png"
          alt="Logo de Manantial de Bendiciones"
          width={128}
          height={128}
          className="mx-auto h-32 w-32 rounded-[28px] shadow-[var(--shadow-elegant)]"
        />
        <h1 className="mt-7 text-center text-2xl font-black tracking-tight">
          MANANTIAL DE BENDICIONES
        </h1>
        <p className="mt-2 text-center text-base text-muted-foreground">
          Inicia sesión para continuar
        </p>

        <form onSubmit={entrar} className="mt-8 space-y-4">
          <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm focus-within:border-primary">
            <label htmlFor="email" className="text-xs text-muted-foreground">
              Correo electrónico
            </label>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@gmail.com"
                required
                className="border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm focus-within:border-primary">
            <label htmlFor="password" className="text-xs text-muted-foreground">
              Contraseña
            </label>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <Input
                id="password"
                type={ver ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                className="border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
              />
              <button
                type="button"
                onClick={() => setVer((v) => !v)}
                aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="text-muted-foreground"
              >
                {ver ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() =>
                setAviso("Pedile a tu pastor que restablezca tu contraseña desde su panel.")
              }
              className="text-sm font-semibold text-primary"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {aviso && <p className="text-sm text-muted-foreground">{aviso}</p>}

          <Button
            type="submit"
            variant="gold"
            size="lg"
            disabled={enviando}
            className="h-14 w-full rounded-full text-base"
          >
            {enviando ? "Ingresando..." : "Iniciar sesión"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setBuscando((b) => !b)}
            className="text-sm font-semibold text-primary underline"
          >
            No tengo cuenta: buscar mi iglesia
          </button>
        </div>

        {buscando && (
          <section className="card-night mt-5 rounded-2xl p-4 text-left">
            <label htmlFor="buscar" className="text-sm font-semibold text-primary">
              Busca tu iglesia por nombre
            </label>
            <div className="mt-2 flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" aria-hidden />
              <Input
                id="buscar"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ej: Caseros"
                autoComplete="off"
              />
            </div>
            <ul className="mt-4 space-y-3">
              {resultados.map((i) => (
                <li
                  key={i.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{i.nombre}</p>
                    <p className="text-xs text-muted-foreground">/c/{i.slug}</p>
                  </div>
                  <Button asChild variant="goldOutline" size="sm">
                    <Link to="/c/$slug" params={{ slug: i.slug }}>
                      Entrar a esta iglesia
                    </Link>
                  </Button>
                </li>
              ))}
              {resultados.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  No encontramos una iglesia con ese nombre.
                </li>
              )}
            </ul>
          </section>
        )}

        <div className="mt-8 flex flex-col items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin-iglesia">Soy pastor / admin de iglesia</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/super-admin">Acceso Super Admin</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
