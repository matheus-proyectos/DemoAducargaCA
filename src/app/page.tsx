import Link from "next/link";
import {
  ArrowRight, BellRing, Boxes, ChevronDown, Headset, PackageCheck, Plane, Radar, Ship, ShieldCheck, ShoppingBag,
  Smartphone, Truck, UserPlus, Warehouse, type LucideIcon,
} from "lucide-react";
import { brand } from "@/lib/brand";
import { ADVANTAGES, FAQ, HERO, SERVICES, STEPS } from "@/lib/content";
import { sendContactMessage } from "./actions/public";
import { DemoBanner, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { TrackingSearch } from "@/components/TrackingSearch";
import { Globe } from "@/components/three/Globe";
import { HomeMotion } from "@/components/three/HomeMotion";
import { Field, Flash, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

const ICONS: Record<string, LucideIcon> = {
  UserPlus, ShoppingBag, Plane, PackageCheck, Radar, ShieldCheck, BellRing, Boxes, Smartphone, Headset, Warehouse, Ship, Truck,
};

type SP = Record<string, string | string[] | undefined>;

export default function Home({ searchParams }: { searchParams: SP }) {
  return (
    <>
      <HomeMotion />
      <DemoBanner />
      <div className="relative">
        <SiteHeader transparent />

        {/* ── HERO ── */}
        <section className="relative isolate overflow-hidden bg-brand-dark text-white">
          <Globe mode="hero" className="absolute inset-0 -z-20" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-brand-dark via-brand-dark/85 to-brand-dark/10 max-md:bg-gradient-to-b max-md:from-brand-dark max-md:via-brand-dark/90 max-md:to-brand-dark/30" />
          <div className="mx-auto flex min-h-[640px] max-w-7xl flex-col justify-center px-4 pb-44 pt-28 sm:px-6 md:min-h-[720px] md:pb-24 md:pt-32">
            <div className="max-w-2xl">
              <p data-hero-fade className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Casillero internacional · Venezuela
              </p>
              <h1 data-split className="text-[40px] font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                {HERO.title}
              </h1>
              <p data-hero-fade className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{HERO.subtitle}</p>
              <div data-hero-fade id="rastrear" className="mt-8 rounded-3xl border border-white/10 bg-white/[.07] p-3 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-4">
                <TrackingSearch />
                <p className="px-1 pt-2.5 text-xs text-white/55">
                  Prueba con la guía de demostración <Link href="/rastreo?guia=ADU-2026-000125" className="font-semibold text-accent underline-offset-2 hover:underline">ADU-2026-000125</Link>
                </p>
              </div>
              <div data-hero-fade className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
                <span className="inline-flex items-center gap-2"><Radar className="h-4 w-4 text-accent" /> 14 etapas rastreables</span>
                <span className="inline-flex items-center gap-2"><BellRing className="h-4 w-4 text-accent" /> Avisos de cada cambio</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Acceso seguro</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <main>
        {/* ── CÓMO FUNCIONA ── */}
        <section id="como-funciona" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24">
          <SectionTitle eyebrow="Cómo funciona" title="De tu compra a tus manos en cuatro pasos" />
          <ol data-stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => {
              const Icon = ICONS[s.icon];
              return (
                <li key={s.title} className="card relative p-6">
                  <span className="absolute right-5 top-4 text-5xl font-extrabold text-brand-soft">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-accent"><Icon className="h-6 w-6" /></div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ── VENTAJAS ── */}
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionTitle eyebrow={`Ventajas ${brand.name}`} title="Control, transparencia y cercanía en cada envío" />
            <div data-stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ADVANTAGES.map((a) => {
                const Icon = ICONS[a.icon];
                return (
                  <div key={a.title} className="group rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg hover:shadow-brand/5">
                    <Icon className="h-7 w-7 text-brand transition group-hover:text-accent-dark" />
                    <h3 className="mt-4 font-bold text-slate-900">{a.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{a.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SERVICIOS ── */}
        <section id="servicios" className="scroll-mt-20 bg-brand py-20 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionTitle eyebrow="Servicios" title="Soluciones logísticas hacia Venezuela" light />
            <div data-stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICES.map((s) => {
                const Icon = ICONS[s.icon];
                return (
                  <div key={s.title} className="rounded-2xl border border-white/10 bg-white/[.04] p-6 transition hover:bg-white/[.08]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-brand-dark"><Icon className="h-6 w-6" /></div>
                    <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{s.text}</p>
                  </div>
                );
              })}
            </div>
            <div data-reveal className="mt-12 flex flex-col items-start justify-between gap-5 rounded-3xl bg-white p-6 text-slate-800 sm:flex-row sm:items-center sm:p-8">
              <div>
                <p className="text-xl font-bold text-brand">¿Listo para recibir tus compras en Venezuela?</p>
                <p className="mt-1 text-sm text-slate-600">Crea tu cuenta y obtén tu código de casillero en minutos.</p>
              </div>
              <Link href="/registro" className="btn-primary h-12 px-6">Crear mi cuenta <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="preguntas" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24">
          <SectionTitle eyebrow="Preguntas frecuentes" title="Resolvemos tus dudas" />
          <div data-stagger className="mt-10 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="card group px-5 py-4 open:shadow-md">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-slate-900">
                  {f.q}
                  <ChevronDown className="faq-chevron h-5 w-5 shrink-0 text-slate-400 transition" />
                </summary>
                <p className="pt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── CONTACTO ── */}
        <section id="contacto" className="scroll-mt-20 bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr]">
            <div data-reveal>
              <SectionTitle eyebrow="Atención al cliente" title="Estamos para ayudarte" align="left" />
              <p className="mt-4 max-w-md text-slate-600">Escríbenos con tu número de guía y te responderemos a la brevedad.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {brand.contact.instagram && (
                  <li><a className="font-semibold text-brand hover:text-accent-dark" href={`https://www.instagram.com/${brand.contact.instagram}/`} target="_blank" rel="noopener noreferrer">Instagram · @{brand.contact.instagram}</a></li>
                )}
                {brand.contact.whatsapp && <li><a className="font-semibold text-brand" href={`https://wa.me/${brand.contact.whatsapp}`}>WhatsApp</a></li>}
                {brand.contact.email && <li><a className="font-semibold text-brand" href={`mailto:${brand.contact.email}`}>{brand.contact.email}</a></li>}
                {brand.contact.hours && <li className="text-slate-500">{brand.contact.hours}</li>}
              </ul>
            </div>
            <form data-reveal action={sendContactMessage} className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
              <div className="sm:col-span-2"><Flash searchParams={searchParams} /></div>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
              <Field label="Nombre" name="name" required autoComplete="name" />
              <Field label="Correo electrónico" name="email" type="email" required autoComplete="email" />
              <Field label="Teléfono" name="phone" autoComplete="tel" />
              <Field label="Número de guía (opcional)" name="tracking" placeholder="ADU-2026-000000" />
              <TextArea className="sm:col-span-2" label="Mensaje" name="body" required minLength={10} />
              <div className="sm:col-span-2"><SubmitButton pendingText="Enviando…">Enviar mensaje</SubmitButton></div>
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SectionTitle({ eyebrow, title, light, align = "center" }: { eyebrow: string; title: string; light?: boolean; align?: "center" | "left" }) {
  return (
    <div data-reveal className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
      <p className={`text-xs font-bold uppercase tracking-[0.2em] ${light ? "text-accent" : "text-accent-dark"}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl ${light ? "text-white" : "text-slate-900"}`}>{title}</h2>
    </div>
  );
}
