import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardState } from "@/components/dashboard-state";
import { useAiAccess } from "@/hooks/use-ai-access";
import { askAegis } from "@/lib/ai.functions";
import { aiResultSchemas } from "@/lib/ai.schemas";
import { USAGE, predictions, type ThreatEvent, type AppRes } from "@/lib/sim";
import type { z } from "zod";

type Briefing = z.infer<typeof aiResultSchemas.briefing>;

export function DailyBriefing({ events, apps }: { events: ThreatEvent[]; apps: AppRes[] }) {
  const ask = useServerFn(askAegis);
  const { allowed } = useAiAccess();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [capturedAt, setCapturedAt] = useState("");
  async function generate() {
    if (busy || !allowed) return;
    setBusy(true); setError("");
    const captured = new Date().toISOString();
    try {
      const out = await ask({ data: { kind: "briefing", context: {
        simulated: true, capturedAt: captured,
        events: events.map(({ id, time, app, type, target, risk }) => ({ id, time, app, type, target, risk })),
        apps: apps.map(({ app, cpu, ram, state }) => ({ app, cpu, ram, state })),
        weeklyMinutes: Object.fromEntries(Object.entries(USAGE).map(([app, days]) => [app, days.flat().reduce((sum, minutes) => sum + minutes, 0)])),
        predictions: predictions(),
      } } });
      if (out.error) { setError(out.error); return; }
      const parsed = aiResultSchemas.briefing.safeParse(out.result);
      if (!parsed.success) { setError("The AI returned an unexpected briefing."); return; }
      setBriefing(parsed.data); setCapturedAt(captured);
    } catch { setError("Couldn't generate your briefing. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <section aria-labelledby="daily-briefing-title" className="mt-6 border-y py-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 id="daily-briefing-title" className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" aria-hidden="true" />Daily briefing</h2>
        <p className="mt-1 text-sm text-muted-foreground">OpenAI · Sample snapshot, not a daily device report. Suggestions only; nothing is applied.</p></div>
      <Button className="min-h-11" disabled={busy || !allowed || !events.length || !apps.length} onClick={() => { void generate(); }}>
        {briefing ? <RefreshCw aria-hidden="true" /> : <Sparkles aria-hidden="true" />}{busy ? "Preparing briefing…" : briefing ? "Refresh briefing" : "Generate briefing"}
      </Button>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">Uses one request from your shared daily AI allowance. Generated only when requested.</p>
    {busy && <DashboardState kind="loading" title="Preparing your sample briefing…" message="Analysing this snapshot of sample threats, weekly app usage and resource figures." />}
    {error && <DashboardState kind="error" title="Briefing unavailable" message={error} />}
    {briefing && <div className="mt-5" aria-live="polite">
      <p className="text-xs text-muted-foreground">Sample snapshot · {new Date(capturedAt).toLocaleString()}{error || busy ? " · Previous briefing" : ""}</p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed">{briefing.summary}</p>
      <ol className="mt-4 grid gap-4 md:grid-cols-3">{briefing.priorities.map((item, index) => <li key={`${index}-${item.category}`} className="min-w-0 rounded-md border bg-card p-4 [overflow-wrap:anywhere]">
        <p className="text-xs font-medium uppercase text-primary">{index + 1} · {item.category}</p>
        <h3 className="mt-2 font-semibold">{item.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.observation}</p>
        <p className="mt-3 text-sm leading-relaxed"><span className="font-medium">Suggestion: </span>{item.suggestion}</p>
      </li>)}</ol>
    </div>}
  </section>;
}