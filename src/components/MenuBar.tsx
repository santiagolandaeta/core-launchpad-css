import { BookOpen, Facebook, Instagram, Radio, Youtube } from "lucide-react";
import type { LinksMenu } from "@/lib/manantial";

const ITEMS: {
  key: keyof LinksMenu;
  label: string;
  Icon: typeof Facebook;
  tile: string;
  icono: string;
}[] = [
  {
    key: "facebook",
    label: "Facebook",
    Icon: Facebook,
    tile: "bg-brand-facebook-soft",
    icono: "text-brand-facebook",
  },
  {
    key: "youtube",
    label: "YouTube",
    Icon: Youtube,
    tile: "bg-brand-youtube-soft",
    icono: "text-brand-youtube",
  },
  {
    key: "instagram",
    label: "Instagram",
    Icon: Instagram,
    tile: "bg-brand-instagram-soft",
    icono: "text-brand-instagram",
  },
  {
    key: "radio",
    label: "La radio",
    Icon: Radio,
    tile: "bg-brand-radio-soft",
    icono: "text-brand-radio",
  },
  {
    key: "libros",
    label: "Libro",
    Icon: BookOpen,
    tile: "bg-brand-libros-soft",
    icono: "text-brand-libros",
  },
];

export function MenuBar({ links }: { links: LinksMenu }) {
  return (
    <nav
      aria-label="Menú principal de la iglesia"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-2 py-2 sm:gap-3 sm:px-4 sm:py-3">
        {ITEMS.map(({ key, label, Icon, tile, icono }) => {
          const href =
            key === "radio"
              ? "https://www.visionmanantial.com"
              : links?.[key]?.trim();
          const contenido = (
            <>
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tile} shadow-[var(--shadow-elegant)] sm:h-14 sm:w-14`}
              >
                <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${icono}`} aria-hidden />
              </span>
              <span className="text-[11px] font-semibold sm:text-xs">{label}</span>
            </>
          );
          const clases = "flex flex-col items-center gap-1.5 rounded-xl py-1 transition";
          return (
            <li key={key} className="flex justify-center">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className={`${clases} text-navy hover:opacity-80`}
                >
                  {contenido}
                </a>
              ) : (
                <span
                  aria-disabled="true"
                  title="El administrador de tu iglesia todavía no cargó este link"
                  className={`${clases} text-muted-foreground opacity-50`}
                >
                  {contenido}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
