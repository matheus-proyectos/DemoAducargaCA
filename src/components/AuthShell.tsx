import { Globe } from "./three/Globe";
import { Logo } from "./Logo";
import { DemoBanner } from "./SiteChrome";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <>
      <DemoBanner />
      <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col px-4 py-8 sm:px-10">
          <Logo />
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 text-slate-500">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
        <div className="relative isolate hidden overflow-hidden bg-brand-dark lg:block">
          <Globe mode="hero" className="absolute inset-0 -z-10 [&>canvas]:!left-[-30%]" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-dark to-transparent p-12 text-white">
            <p className="max-w-sm text-2xl font-bold leading-snug">Cada movimiento de tu paquete, en un solo lugar.</p>
            <p className="mt-2 text-white/60">Del casillero internacional a tus manos en Venezuela.</p>
          </div>
        </div>
      </div>
    </>
  );
}
