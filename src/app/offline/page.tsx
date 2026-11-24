export const metadata = {
  title: "Sin conexión",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--brand-soft)] p-8 text-center">
      <p className="text-5xl">📡</p>
      <h1 className="text-2xl font-bold text-[var(--brand)]">Sin conexión</h1>
      <p className="max-w-md text-sm text-slate-600">
        No pudimos recuperar tu información. Revisa tu conexión a internet y
        vuelve a intentarlo.
      </p>
      <a
        href="/"
        className="rounded-xl bg-[var(--brand)] px-6 py-3 font-semibold text-white"
      >
        Volver al inicio
      </a>
    </main>
  );
}
