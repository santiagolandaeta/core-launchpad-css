import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  Facebook,
  ImagePlus,
  Instagram,
  LayoutList,
  Menu,
  Pin,
  Plus,
  Radio,
  Settings2,
  Trash2,
  UserRound,
  Users,
  Youtube,
} from "lucide-react";
import { CalendarioMes } from "@/components/CalendarioMes";
import { MenuBar } from "@/components/MenuBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  actualizarLinks,
  actualizarPerfilPastor,
  alternarFijado,
  contenidosDe,
  crearContenido,
  eliminarContenido,
  iglesiaPorId,
  ingresarAdminIglesia,
  miembrosDe,
  salirAdminIglesia,
  seed,
  sesionAdminIglesia,
  type Contenido,
  type Iglesia,
  type LinksMenu,
  type Miembro,
} from "@/lib/manantial";

export const Route = createFileRoute("/admin-iglesia")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel del pastor | Manantial de Bendiciones" },
      {
        name: "description",
        content:
          "Panel del pastor: creá y gestioná los anuncios de tu comunidad, mirá tus miembros y configurá la barra de menú.",
      },
      { property: "og:title", content: "Panel del pastor | Manantial de Bendiciones" },
      {
        property: "og:description",
        content: "Comparte lo que Dios está haciendo: anuncios, eventos y links de tu sede.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminIglesia,
});

function AdminIglesia() {
  const [listo, setListo] = useState(false);
  const [iglesia, setIglesia] = useState<Iglesia | null>(null);

  useEffect(() => {
    seed();
    setIglesia(sesionAdminIglesia());
    setListo(true);
  }, []);

  if (!listo) return <main className="min-h-screen bg-surface-muted" />;
  if (!iglesia) return <LoginAdmin onEntrar={setIglesia} />;

  return (
    <Panel
      iglesia={iglesia}
      onCambio={(i) => setIglesia(i)}
      onSalir={() => {
        salirAdminIglesia();
        setIglesia(null);
      }}
    />
  );
}

function LoginAdmin({ onEntrar }: { onEntrar: (i: Iglesia) => void }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      onEntrar(ingresarAdminIglesia(form.email, form.password));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos ingresar.");
    }
  }

  return (
    <main className="gradient-night flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-gradient-gold text-center text-2xl font-black">Panel del Pastor</h1>
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
            Entrar a mi panel
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Demo: caseros@manantial.app / pastor123
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

const CAMPOS: { key: keyof LinksMenu; label: string; Icon: typeof Facebook }[] = [
  { key: "facebook", label: "Link Facebook", Icon: Facebook },
  { key: "youtube", label: "Link YouTube", Icon: Youtube },
  { key: "instagram", label: "Link Instagram", Icon: Instagram },
  { key: "radio", label: "Link Radio", Icon: Radio },
  { key: "libros", label: "Link Libros", Icon: BookOpen },
];

const TIPOS: { value: Contenido["tipo"]; label: string }[] = [
  { value: "anuncio", label: "Anuncio" },
  { value: "evento", label: "Evento" },
  { value: "urgente", label: "Urgente" },
  { value: "bautismo", label: "Bautismo" },
  { value: "mensaje_pastor", label: "Mensaje del Pastor" },
];

const ETIQUETA: Record<Contenido["tipo"], string> = {
  anuncio: "Anuncio",
  evento: "Evento",
  mensaje_pastor: "Mensaje del Pastor",
  urgente: "Urgente",
  bautismo: "Bautismo",
};

function Panel({
  iglesia,
  onCambio,
  onSalir,
}: {
  iglesia: Iglesia;
  onCambio: (i: Iglesia) => void;
  onSalir: () => void;
}) {
  const [links, setLinks] = useState<LinksMenu>(iglesia.links);
  const [guardado, setGuardado] = useState(false);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [publicaciones, setPublicaciones] = useState<Contenido[]>([]);
  const [vista, setVista] = useState<"lista" | "calendario">("lista");
  const [formAbierto, setFormAbierto] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMiembros(miembrosDe(iglesia.id));
    setPublicaciones(contenidosDe(iglesia.id));
    setLinks(iglesia.links);
  }, [iglesia]);

  function refrescar() {
    setPublicaciones(contenidosDe(iglesia.id));
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    actualizarLinks(iglesia.id, links);
    const actualizada = iglesiaPorId(iglesia.id);
    if (actualizada) onCambio(actualizada);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  }

  const porFecha = useMemo(
    () =>
      [...publicaciones]
        .filter((p) => p.fecha)
        .sort((a, b) => (a.fecha! < b.fecha! ? -1 : 1)),
    [publicaciones],
  );

  return (
    <div className="min-h-screen bg-surface-muted pb-28">
      <header className="sticky top-0 z-30 bg-navy text-navy-foreground shadow-[var(--shadow-elegant)]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3.5">
          <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Abrir menú del pastor"
                className="-ml-1 rounded-xl p-2 transition hover:bg-white/10"
              >
                <Menu className="h-6 w-6" aria-hidden />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[86vw] max-w-xs overflow-y-auto">
              <SheetHeader className="text-left">
                <SheetTitle className="text-navy">{iglesia.nombre}</SheetTitle>
                <SheetDescription>Panel del pastor</SheetDescription>
              </SheetHeader>

              <div className="mt-6 rounded-2xl bg-surface-muted p-5 text-center">
                <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" aria-hidden /> Miembros activos con la App
                </p>
                <p className="text-gradient-gold mt-1 text-4xl font-black">{miembros.length}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Código de acceso: {iglesia.codigo_acceso}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  setTimeout(() => {
                    document
                      .getElementById("configurar-barra-menu")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 250);
                }}
                className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-navy px-4 py-4 text-left text-base font-bold text-navy-foreground transition hover:opacity-90"
              >
                <Settings2 className="h-5 w-5" aria-hidden />
                Configurar mi barra de menú
              </button>

              <p className="mt-3 text-xs text-muted-foreground">
                Ahí podés cambiar los links de Facebook, YouTube, Instagram, radio y libros que ven
                tus miembros.
              </p>
            </SheetContent>
          </Sheet>
          <img
            src={iglesia.logo}
            alt={`Logo de ${iglesia.nombre}`}
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-full border border-white/30 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] tracking-[0.25em] uppercase opacity-70">Pastor</p>
            <h1 className="truncate text-base font-bold">{iglesia.nombre}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSalir}
            className="text-navy-foreground hover:bg-white/10"
          >
            Salir
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 pt-6">
        <section>
          <h2 className="text-3xl leading-tight font-black text-navy">
            Comparte lo que Dios está haciendo
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Crea y gestiona los anuncios de tu comunidad en un solo lugar.
          </p>
          <button
            type="button"
            onClick={() => setFormAbierto((v) => !v)}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-navy px-6 py-5 text-lg font-bold text-navy-foreground shadow-[var(--shadow-elegant)] transition hover:opacity-90"
          >
            <Plus className="h-6 w-6" aria-hidden />
            Nuevo anuncio
          </button>
        </section>

        {formAbierto && (
          <NuevoAnuncio
            iglesiaId={iglesia.id}
            onCreado={() => {
              refrescar();
              setFormAbierto(false);
            }}
            onCancelar={() => setFormAbierto(false)}
          />
        )}

        <div className="inline-flex rounded-2xl bg-card p-1.5 shadow-[var(--shadow-elegant)]">
          {(
            [
              { key: "lista", label: "Lista", Icon: LayoutList },
              { key: "calendario", label: "Calendario", Icon: CalendarDays },
            ] as const
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setVista(key)}
              aria-pressed={vista === key}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-base font-semibold transition ${
                vista === key ? "bg-surface-muted text-navy" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        {vista === "lista" ? (
          <div className="space-y-4">
            {publicaciones.length === 0 && (
              <p className="rounded-3xl bg-card p-5 text-sm text-muted-foreground shadow-[var(--shadow-elegant)]">
                Todavía no publicaste nada. Tocá “Nuevo anuncio”.
              </p>
            )}
            {publicaciones.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl bg-card shadow-[var(--shadow-elegant)]"
              >
                {item.imagen && (
                  <img src={item.imagen} alt={item.titulo} className="h-44 w-full object-cover" />
                )}
                <div className="space-y-3 p-5">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {ETIQUETA[item.tipo]}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        alternarFijado(item.id);
                        refrescar();
                      }}
                      className={`flex items-center gap-1 text-xs font-semibold transition ${
                        item.fijado ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <Pin className="h-3.5 w-3.5" aria-hidden />
                      {item.fijado ? "Fijado" : "Fijar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        eliminarContenido(item.id);
                        refrescar();
                      }}
                      aria-label={`Eliminar ${item.titulo}`}
                      className="ml-auto rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-5 w-5" aria-hidden />
                    </button>
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
            ))}
          </div>
        ) : (
          <CalendarioMes items={porFecha} />
        )}


        <section className="rounded-3xl bg-card p-6 text-center shadow-[var(--shadow-elegant)]">
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" aria-hidden /> Miembros con la App
          </p>
          <p className="text-gradient-gold mt-2 text-5xl font-black">{miembros.length}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Código de acceso: {iglesia.codigo_acceso} · /c/{iglesia.slug}
          </p>
        </section>

        <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-elegant)]">
          <h2 className="text-base font-bold text-navy">Mis miembros</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2">Descargó la app</th>
                </tr>
              </thead>
              <tbody>
                {miembros.map((m) => (
                  <tr key={m.id} className="border-t border-border/60">
                    <td className="py-2 pr-3 font-semibold">{m.nombre}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{m.email}</td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(m.fecha_registro).toLocaleDateString("es-AR")}
                    </td>
                  </tr>
                ))}
                {miembros.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-3 text-muted-foreground">
                      Todavía nadie se registró con tu código.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <PerfilPastorCard iglesia={iglesia} onCambio={onCambio} />

        <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-elegant)]">
          <h2 className="text-base font-bold text-navy">Configurar Mi Barra de Menu</h2>
          <form onSubmit={guardar} className="mt-4 space-y-4">
            {CAMPOS.map(({ key, label, Icon }) => (
              <div key={key}>
                <Label htmlFor={key} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                  {label}
                </Label>
                <Input
                  id={key}
                  value={links[key]}
                  onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            ))}
            <Button type="submit" variant="gold" size="lg" className="w-full sm:w-auto">
              Guardar
            </Button>
            {guardado && (
              <p className="text-sm text-primary">Links actualizados para tus miembros.</p>
            )}
          </form>
        </section>
      </main>

      <MenuBar links={iglesia.links} />
    </div>
  );
}

function NuevoAnuncio({
  iglesiaId,
  onCreado,
  onCancelar,
}: {
  iglesiaId: string;
  onCreado: () => void;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState({
    tipo: "anuncio" as Contenido["tipo"],
    titulo: "",
    detalle: "",
    fecha: "",
    imagen: "",
    fijado: false,
  });
  const [error, setError] = useState<string | null>(null);

  function elegirBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setError("La imagen es muy grande. Elegí una de menos de 1,5 MB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imagen: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    crearContenido({
      iglesia_id: iglesiaId,
      tipo: form.tipo,
      titulo: form.titulo.trim(),
      detalle: form.detalle.trim(),
      fijado: form.fijado,
      ...(form.fecha ? { fecha: form.fecha } : {}),
      ...(form.imagen ? { imagen: form.imagen } : {}),
    });
    onCreado();
  }

  return (
    <form
      onSubmit={enviar}
      className="space-y-5 rounded-3xl bg-card p-5 shadow-[var(--shadow-elegant)]"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-navy">Crear anuncio</h3>
        <button
          type="button"
          onClick={onCancelar}
          className="text-sm text-muted-foreground hover:underline"
        >
          Cancelar
        </button>
      </div>

      <div>
        <Label htmlFor="banner">Banner</Label>
        <label
          htmlFor="banner"
          className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-4 py-8 text-center transition hover:border-primary/60"
        >
          {form.imagen ? (
            <img
              src={form.imagen}
              alt="Vista previa del banner"
              className="max-h-40 w-full rounded-xl object-cover"
            />
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-muted-foreground" aria-hidden />
              <span className="text-sm text-muted-foreground">Subir imagen de banner</span>
            </>
          )}
        </label>
        <input
          id="banner"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={elegirBanner}
        />
        {form.imagen && (
          <button
            type="button"
            onClick={() => setForm({ ...form, imagen: "" })}
            className="mt-2 text-xs text-muted-foreground underline"
          >
            Quitar imagen
          </button>
        )}
      </div>

      <div>
        <Label htmlFor="titulo">Título del anuncio</Label>
        <Input
          id="titulo"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Ej. Culto de Adoración - Domingo 10am"
          required
        />
      </div>

      <div>
        <Label htmlFor="detalle">Contenido</Label>
        <Textarea
          id="detalle"
          value={form.detalle}
          onChange={(e) => setForm({ ...form, detalle: e.target.value })}
          placeholder="Escribe aquí los detalles del anuncio..."
          rows={4}
          required
        />
      </div>

      <div>
        <Label htmlFor="tipo">Categoría</Label>
        <select
          id="tipo"
          value={form.tipo}
          onChange={(e) => setForm({ ...form, tipo: e.target.value as Contenido["tipo"] })}
          className="mt-1 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="fecha">Fecha del evento</Label>
        <Input
          id="fecha"
          type="date"
          value={form.fecha}
          onChange={(e) => setForm({ ...form, fecha: e.target.value })}
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-navy">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          checked={form.fijado}
          onChange={(e) => setForm({ ...form, fijado: e.target.checked })}
        />
        Fijar este anuncio arriba
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-2xl bg-navy px-6 py-4 text-base font-bold text-navy-foreground shadow-[var(--shadow-elegant)] transition hover:opacity-90"
      >
        Publicar anuncio
      </button>
    </form>
  );
}

function PerfilPastorCard({
  iglesia,
  onCambio,
}: {
  iglesia: Iglesia;
  onCambio: (i: Iglesia) => void;
}) {
  const [form, setForm] = useState({
    pastor_nombre: iglesia.pastor_nombre ?? "",
    pastor_foto: iglesia.pastor_foto ?? "",
    email_contacto: iglesia.email_contacto ?? iglesia.email_admin,
  });
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    setForm({
      pastor_nombre: iglesia.pastor_nombre ?? "",
      pastor_foto: iglesia.pastor_foto ?? "",
      email_contacto: iglesia.email_contacto ?? iglesia.email_admin,
    });
  }, [iglesia]);

  function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      setError("La foto es muy grande. Elegí una de menos de 1,5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, pastor_foto: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      actualizarPerfilPastor(iglesia.id, form);
      const actualizada = iglesiaPorId(iglesia.id);
      if (actualizada) onCambio(actualizada);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar tu perfil.");
    }
  }

  return (
    <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-elegant)]">
      <h2 className="flex items-center gap-2 text-base font-bold text-navy">
        <UserRound className="h-4 w-4 text-primary" aria-hidden />
        Mi perfil
      </h2>
      <form onSubmit={guardar} className="mt-4 space-y-4">
        <div className="flex items-center gap-4">
          {form.pastor_foto ? (
            <img
              src={form.pastor_foto}
              alt="Tu foto de perfil"
              className="h-20 w-20 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-8 w-8" aria-hidden />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <Label htmlFor="foto">Foto</Label>
            <Input id="foto" type="file" accept="image/*" onChange={elegirFoto} />
            {form.pastor_foto && (
              <button
                type="button"
                onClick={() => setForm({ ...form, pastor_foto: "" })}
                className="text-xs text-muted-foreground underline"
              >
                Quitar foto
              </button>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="pastor_nombre">Nombre</Label>
          <Input
            id="pastor_nombre"
            value={form.pastor_nombre}
            onChange={(e) => setForm({ ...form, pastor_nombre: e.target.value })}
            placeholder="Pastor Juan Pérez"
            required
          />
        </div>
        <div>
          <Label htmlFor="email_contacto">Correo de contacto</Label>
          <Input
            id="email_contacto"
            type="email"
            value={form.email_contacto}
            onChange={(e) => setForm({ ...form, email_contacto: e.target.value })}
            placeholder="pastor@iglesia.com"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Este correo lo ven tus miembros para escribirte.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" variant="gold" size="lg" className="w-full sm:w-auto">
          Guardar mi perfil
        </Button>
        {guardado && <p className="text-sm text-primary">Perfil actualizado.</p>}
      </form>
    </section>
  );
}
