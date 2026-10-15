import type { ReactNode } from "react";
import { FlaskConical, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function SimulationBanner() {
  return (
    <div
      role="note"
      aria-label="Simulation mode"
      className="mb-6 flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm"
    >
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
      <p>
        <strong className="font-semibold text-warning">Simulation Mode.</strong>{" "}
        <span className="text-muted-foreground">
          All apps, events, usage and resource figures on this page are generated sample data. Nothing is being
          monitored, blocked or limited on your device.
        </span>
      </p>
    </div>
  );
}

export function AiLockedNotice({ state }: { state: "checking" | "signed-in" | "signed-out" }) {
  if (state === "signed-in") return null;
  return (
    <p role="status" className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {state === "checking"
        ? "Checking sign-in…"
        : "Sign in to use AI analysis."}
    </p>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub: string; children?: ReactNode }) {
  return (
    <>
      <SimulationBanner />
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-muted-foreground">{sub}</p>
        </div>
        {children}
      </div>
    </>
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
      aria-label={`Risk ${risk} (${lvl})`}
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
