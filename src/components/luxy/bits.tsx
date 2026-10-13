import { Link } from "@tanstack/react-router";
import { Crown, Star } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { escrowLabel, naira, statusLabel } from "@/lib/luxy/pricing";
import type { BookingStatus, Escrow } from "@/lib/luxy/types";

export function Wordmark({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-serif tracking-[0.18em]", className)}>
      <Crown className={cn("size-4", light ? "text-tint" : "text-accent")} aria-hidden />
      <span className={light ? "text-card" : "text-ink"}>LUXY</span>
    </span>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
};

export function Btn({ variant = "primary", className, type = "button", ...props }: BtnProps) {
  const look = {
    primary: "bg-accent text-card hover:bg-accent-hover",
    secondary: "border border-line bg-card text-ink hover:bg-page",
    danger: "bg-danger text-card hover:opacity-90",
    success: "bg-ok text-card hover:opacity-90",
    ghost: "text-body hover:bg-page",
  }[variant];
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition duration-200 disabled:opacity-50",
        look,
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-widest text-muted uppercase">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink outline-none placeholder:text-faint focus:border-accent";

export function Pill({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "danger" | "info" | "accent" | "muted";
  children: ReactNode;
}) {
  const look = {
    ok: "bg-ok-bg text-ok",
    warn: "bg-warn-bg text-warn",
    danger: "bg-danger-bg text-danger",
    info: "bg-info-bg text-info",
    accent: "bg-tint text-accent",
    muted: "bg-page text-muted",
  }[tone];
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", look)}>{children}</span>;
}

export function statusTone(status: BookingStatus): "ok" | "warn" | "danger" | "info" | "accent" | "muted" {
  if (status === "completed") return "ok";
  if (status === "active") return "info";
  if (status === "overdue" || status.startsWith("cancelled")) return status.startsWith("cancelled") ? "warn" : "danger";
  if (status === "confirmed") return "accent";
  return "muted";
}

export function StatusPill({ status, admin = false }: { status: BookingStatus; admin?: boolean }) {
  return <Pill tone={statusTone(status)}>{statusLabel(status, admin)}</Pill>;
}

export function EscrowPill({ status, admin = false }: { status: Escrow; admin?: boolean }) {
  const tone = status === "released" ? "ok" : status === "pending_approval" ? "warn" : status === "held" ? "muted" : "danger";
  return <Pill tone={tone}>{escrowLabel(status, admin)}</Pill>;
}

export function Stars({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-muted">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-ink">
      <Star className="size-3.5 fill-warn text-warn" aria-hidden />
      {value.toFixed(1)}
    </span>
  );
}

export function Money({ value, className }: { value: number; className?: string }) {
  return <span className={className}>{naira(value)}</span>;
}

export function Empty({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-card px-6 py-10 text-center">
      <p className="text-sm text-body">{title}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Stub({ title, copy }: { title: string; copy: string }) {
  return (
    <div>
      <h1 className="font-sans text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-sm text-body">{copy}</p>
      <div className="mt-6 rounded-xl border border-dashed border-line bg-card px-6 py-12 text-center text-sm text-muted">
        This section isn't built yet — coming soon.
      </div>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <p className="text-xs font-medium tracking-widest text-muted uppercase">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-line bg-card p-5", className)}>{children}</section>;
}

export function PageTitle({ title, sub, extra }: { title: string; sub?: string; extra?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {sub ? <p className="mt-1 text-sm text-body">{sub}</p> : null}
      </div>
      {extra}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-tint px-3 py-2 text-sm text-accent-deep">{children}</p>;
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return children ? <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{children}</p> : null;
}

export function TextLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={cn("text-sm font-medium text-accent hover:text-accent-hover", className)}>
      {children}
    </Link>
  );
}
