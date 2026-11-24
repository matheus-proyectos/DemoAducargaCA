import { Search } from "lucide-react";
import { cx } from "./ui";

/** Buscador de guía. Funciona sin JavaScript (GET a /rastreo). */
export function TrackingSearch({ defaultValue = "", size = "lg", action = "/rastreo" }: { defaultValue?: string; size?: "lg" | "md"; action?: string }) {
  return (
    <form action={action} method="get" role="search" className="w-full">
      <label htmlFor={`guia-${size}`} className="sr-only">Número de guía</label>
      <div className={cx("flex w-full flex-col gap-2 sm:flex-row", size === "lg" && "sm:gap-3")}>
        <div className="relative flex-1">
          <Search className={cx("pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400", size === "lg" ? "h-5 w-5" : "h-4 w-4")} />
          <input
            id={`guia-${size}`}
            name="guia"
            defaultValue={defaultValue}
            required
            autoComplete="off"
            spellCheck={false}
            placeholder="Ej.: ADU-2026-000125"
            className={cx("input pl-12 font-semibold uppercase tracking-wide placeholder:normal-case placeholder:font-normal placeholder:tracking-normal", size === "lg" ? "h-14 rounded-2xl text-base" : "h-11")}
          />
        </div>
        <button type="submit" className={cx("btn-primary whitespace-nowrap", size === "lg" ? "h-14 rounded-2xl px-6 text-[15px] tracking-wide" : "h-11")}>
          RASTREAR MI ENVÍO
        </button>
      </div>
    </form>
  );
}
