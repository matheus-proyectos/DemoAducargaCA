import Link from "next/link";
import { AtSign, Mail, MessageCircle, Phone } from "lucide-react";
import { brand } from "@/lib/brand";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { isDemoMode } from "@/lib/db";
import { Logo } from "./Logo";
import { cx } from "./ui";

export function DemoBanner() {
  if (!isDemoMode()) return null;
  return (
    <div className="bg-accent px-4 py-1.5 text-center text-xs font-semibold text-brand-dark">
      Entorno de demostración · los clientes, paquetes y embarques mostrados son ficticios
    </div>
  );
}

const NAV = [
  { href: "/rastreo", label: "Rastrear" },
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#preguntas", label: "Preguntas" },
  { href: "/#contacto", label: "Contacto" },
];

export async function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const user = await getCurrentUser();
  const panel = user ? (isStaff(user.profile) ? "/admin" : "/cuenta") : null;
  return (
    <header className={cx("z-40 w-full", transparent ? "absolute inset-x-0 top-0" : "sticky top-0 border-b border-slate-200 bg-white/90 backdrop-blur")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo light={transparent} />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cx("rounded-lg px-3 py-2 text-sm font-medium transition", transparent ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-brand")}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {panel ? (
            <Link href={panel} className="btn-primary">Mi panel</Link>
          ) : (
            <>
              <Link href="/login" className={cx("btn", transparent ? "text-white hover:bg-white/10" : "text-brand hover:bg-brand-soft")}>Iniciar sesión</Link>
              <Link href="/registro" className="btn-primary hidden sm:inline-flex">Registrarse</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { contact } = brand;
  return (
    <footer className="bg-brand-dark text-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">{brand.tagline}. Control y visibilidad de cada movimiento, desde el casillero internacional hasta tus manos.</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Plataforma</p>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/rastreo">Rastrear envío</Link></li>
            <li><Link className="hover:text-white" href="/registro">Crear cuenta</Link></li>
            <li><Link className="hover:text-white" href="/login">Iniciar sesión</Link></li>
            <li><Link className="hover:text-white" href="/#preguntas">Preguntas frecuentes</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">Contacto</p>
          <ul className="space-y-2 text-sm">
            {contact.instagram && (
              <li><a className="inline-flex items-center gap-2 hover:text-white" href={`https://www.instagram.com/${contact.instagram}/`} target="_blank" rel="noopener noreferrer"><AtSign className="h-4 w-4" /> @{contact.instagram}</a></li>
            )}
            {contact.whatsapp && (
              <li><a className="inline-flex items-center gap-2 hover:text-white" href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" /> WhatsApp</a></li>
            )}
            {contact.email && <li><a className="inline-flex items-center gap-2 hover:text-white" href={`mailto:${contact.email}`}><Mail className="h-4 w-4" /> {contact.email}</a></li>}
            {contact.phone && <li className="inline-flex items-center gap-2"><Phone className="h-4 w-4" /> {contact.phone}</li>}
            <li><Link className="hover:text-white" href="/#contacto">Formulario de contacto</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs sm:flex-row sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} {brand.name}. Todos los derechos reservados.</span>
          <span>Horas expresadas en hora de Venezuela (UTC−4).</span>
        </div>
      </div>
    </footer>
  );
}
