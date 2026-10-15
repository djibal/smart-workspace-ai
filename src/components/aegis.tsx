import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-muted-foreground">{sub}</p>
      </div>
      {children}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="panel p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono text-3xl font-semibold text-primary">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function RiskBadge({ risk }: { risk: number }) {
  const lvl = risk >= 70 ? "high" : risk >= 35 ? "medium" : "low";
  return (
    <span
      className={cn(
        "inline-flex min-w-12 justify-center rounded px-2 py-0.5 font-mono text-xs font-semibold",
        lvl === "high" && "bg-destructive/20 text-destructive",
        lvl === "medium" && "bg-warning/20 text-warning",
        lvl === "low" && "bg-success/15 text-success",
      )}
    >
      {risk}
    </span>
  );
}
