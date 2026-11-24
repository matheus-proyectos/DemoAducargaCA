"use client";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle className="h-7 w-7" /></div>
      <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Algo salió mal</h1>
      <p className="mt-1 max-w-md text-slate-500">No pudimos completar la operación. Inténtalo de nuevo; si persiste, contacta a soporte.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-slate-400">Ref.: {error.digest}</p>}
      <button onClick={reset} className="btn-brand mt-6">Reintentar</button>
    </div>
  );
}
