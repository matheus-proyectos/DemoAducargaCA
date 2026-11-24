import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("card", className)}>{children}</div>;
}

type FieldBase = { label: string; hint?: string; className?: string };

export function Field({ label, hint, className, ...props }: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cx("block", className)}>
      <span className="label">
        {label}
        {props.required && <span className="text-accent-dark"> *</span>}
      </span>
      <input className="input" {...props} />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function SelectField({ label, hint, className, children, ...props }: FieldBase & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={cx("block", className)}>
      <span className="label">
        {label}
        {props.required && <span className="text-accent-dark"> *</span>}
      </span>
      <select className="input" {...props}>
        {children}
      </select>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function TextArea({ label, hint, className, ...props }: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={cx("block", className)}>
      <span className="label">{label}</span>
      <textarea className="input min-h-[88px]" {...props} />
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

type SP = Record<string, string | string[] | undefined>;
export const sp = (s: SP, k: string) => (typeof s[k] === "string" ? (s[k] as string) : "");

export function Flash({ searchParams }: { searchParams: SP }) {
  const ok = sp(searchParams, "ok");
  const error = sp(searchParams, "error");
  if (!ok && !error) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={cx(
        "mb-5 flex animate-rise items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
        error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{error || ok}</span>
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">{icon}</div>
      <p className="font-semibold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function KV({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">{icon}</div>}
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className="mt-0.5 break-words font-semibold text-slate-900">{value}</dd>
      </div>
    </div>
  );
}
