import { AlertTriangle, CircleAlert, ShieldQuestion } from "lucide-react";
import { threatDisplay } from "@/lib/threat-display";
import type { ThreatEvent } from "@/lib/sim";
import { cn } from "@/lib/utils";

export function ThreatSeverity({ event }: { event: ThreatEvent }) {
  const display = threatDisplay(event);
  const Icon = display.severity === "high" ? AlertTriangle : display.severity === "medium" ? CircleAlert : ShieldQuestion;
  return (
    <span aria-label={display.scoreLabel} className={cn(
      "inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold",
      display.severity === "high" ? "bg-destructive/20 text-destructive" : display.severity === "medium" ? "bg-warning/20 text-warning" : "bg-success/15 text-success",
    )}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{display.severityLabel}</span>
      <span className="font-mono">{event.risk}/100</span>
    </span>
  );
}