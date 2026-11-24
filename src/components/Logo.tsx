import Link from "next/link";
import { brand } from "@/lib/brand";
import { cx } from "./ui";

/**
 * Logotipo. Mientras ADUCARGA no entregue su archivo oficial se muestra un
 * wordmark tipográfico neutro. Al definir `brand.logo.src` se usa la imagen real.
 */
export function Logo({ light = false, href = "/", className }: { light?: boolean; href?: string; className?: string }) {
  return (
    <Link href={href} className={cx("inline-flex items-center gap-2.5", className)} aria-label={`${brand.name} — inicio`}>
      {brand.logo.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logo.src} alt={brand.logo.alt} className="h-9 w-auto" />
      ) : (
        <>
          <span className={cx("flex h-9 w-9 items-center justify-center rounded-xl", light ? "bg-white/10 ring-1 ring-white/20" : "bg-brand")}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
              <path d="M12 2.5 3.5 7v10L12 21.5 20.5 17V7L12 2.5Z" stroke={light ? "#fff" : "#fff"} strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M3.8 7.2 12 11.6l8.2-4.4M12 11.6v9.6" stroke="rgb(var(--accent))" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
          </span>
          <span className={cx("text-lg font-extrabold tracking-[0.08em]", light ? "text-white" : "text-brand")}>{brand.name}</span>
        </>
      )}
    </Link>
  );
}
