import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import type { Contenido } from "@/lib/manantial";

const ETIQUETA_TIPO: Record<Contenido["tipo"], string> = {
  anuncio: "Anuncio",
  evento: "Evento",
  mensaje_pastor: "Mensaje del pastor",
  urgente: "Urgente",
  bautismo: "Bautismo",
};

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function claveDia(fecha: Date) {
  const y = fecha.getFullYear();
  const m = `${fecha.getMonth() + 1}`.padStart(2, "0");
  const d = `${fecha.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function CalendarioMes({ items }: { items: Contenido[] }) {
  const hoy = new Date();
  const [mes, setMes] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [seleccion, setSeleccion] = useState<string | null>(claveDia(hoy));

  const porDia = useMemo(() => {
    const mapa = new Map<string, Contenido[]>();
    for (const item of items) {
      if (!item.fecha) continue;
      const clave = claveDia(new Date(item.fecha));
      mapa.set(clave, [...(mapa.get(clave) ?? []), item]);
    }
    return mapa;
  }, [items]);

  const celdas = useMemo(() => {
    const primero = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const diasEnMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate();
    const offset = (primero.getDay() + 6) % 7; // semana comienza el lunes
    const lista: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= diasEnMes; d += 1) {
      lista.push(new Date(mes.getFullYear(), mes.getMonth(), d));
    }
    return lista;
  }, [mes]);

  const delDia = seleccion ? (porDia.get(seleccion) ?? []) : [];

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-card p-5 shadow-[var(--shadow-elegant)]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Mes anterior"
            onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-surface-muted hover:text-navy"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <h2 className="text-base font-black text-navy capitalize">
            {mes.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
          </h2>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-surface-muted hover:text-navy"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {DIAS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {celdas.map((dia, i) => {
            if (!dia) return <span key={`v-${i}`} />;
            const clave = claveDia(dia);
            const cantidad = porDia.get(clave)?.length ?? 0;
            const esHoy = clave === claveDia(hoy);
            const activo = clave === seleccion;
            return (
              <button
                key={clave}
                type="button"
                onClick={() => setSeleccion(clave)}
                aria-pressed={activo}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold transition ${
                  activo
                    ? "bg-navy text-navy-foreground"
                    : esHoy
                      ? "bg-surface-muted text-navy"
                      : "text-navy hover:bg-surface-muted"
                }`}
              >
                {dia.getDate()}
                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                    cantidad > 0 ? "bg-primary" : "bg-transparent"
                  }`}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        {delDia.length === 0 ? (
          <p className="flex items-center gap-2 rounded-3xl bg-card p-5 text-sm text-muted-foreground shadow-[var(--shadow-elegant)]">
            <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
            No hay nada agendado para este día.
          </p>
        ) : (
          delDia.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl bg-card p-5 shadow-[var(--shadow-elegant)]"
            >
              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {ETIQUETA_TIPO[item.tipo]}
              </span>
              <h3 className="mt-3 text-lg font-black text-navy">{item.titulo}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.detalle}</p>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
