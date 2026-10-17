import { DashboardState, dashboardPage } from "@/components/dashboard-state";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, RiskBadge, AiLockedNotice } from "@/components/aegis";
import { useThreatFeed, type ThreatEvent } from "@/lib/sim";
import { askAegis } from "@/lib/ai.functions";
import { useAiAccess } from "@/hooks/use-ai-access";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/threats")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Threat Intelligence · AegisDesk" },
      { name: "description", content: "Simulated demo of AI analysis of network traffic and permission requests." },
      { property: "og:title", content: "AegisDesk Threat Intelligence" },
      { property: "og:description", content: "Demo with sample data: AI explains simulated requests and permission prompts." },
    ],
  }),
  ...dashboardPage(Threats, "Threat Intelligence", "Sample requests and permission prompts with simulated risk scores."),
});

type Verdict = { verdict: string; action: string; explanation: string; confidence: number };

function Threats() {
  const events = useThreatFeed();
  const [sel, setSel] = useState<ThreatEvent | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "network" | "permission">("all");
  const ask = useServerFn(askAegis);
  const ai = useAiAccess();

  const explain = async () => {
    if (!sel) return;
    setLoading(true);
    setAiError(null);
    setVerdict(null);
    try {
      const r = await ask({ data: { kind: "threat", context: sel } });
      if ("error" in r && r.error) { setAiError(r.error); toast.error(r.error); }
      else setVerdict(r.result as Verdict);
    } catch {
      setAiError("Couldn’t reach the AI. Check your connection and try again.");
      toast.error("Couldn't reach the AI.");
    } finally {
      setLoading(false);
    }
  };

  const list = events.filter((e) => filter === "all" || e.type === filter);
  return (
    <>
      <PageHeader title="Threat Intelligence" sub="Sample requests and permission prompts with simulated risk scores.">
        <div className="flex gap-1 rounded-md bg-secondary p-1">
          {(["all", "network", "permission"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("rounded px-3 py-1 text-sm capitalize", filter === f ? "bg-accent text-accent-foreground" : "text-muted-foreground")}>{f}</button>
          ))}
        </div>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="panel max-h-[640px] overflow-y-auto">
          {list.length === 0 && <DashboardState kind="empty" title={events.length === 0 ? "No sample events yet" : "No matching events"} message={events.length === 0 ? "No sample activity is available. This does not indicate that your device is safe or being monitored." : "No sample events match this filter."} onRetry={events.length > 0 ? () => setFilter("all") : undefined} retryLabel="Show all events" />}
          {list.map((e) => (
            <button
              key={e.id}
              disabled={loading}
              onClick={() => { setSel(e); setVerdict(null); setAiError(null); }}
              className={cn("flex min-h-11 w-full items-center gap-3 border-b sm:gap-4 px-4 py-3 text-left text-sm transition-colors hover:bg-secondary disabled:cursor-wait", sel?.id === e.id && "bg-accent")}
            >
              <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground sm:w-20">{e.time}</span>
              <span className="w-16 shrink-0 truncate">{e.app}</span>
              <span className="hidden w-24 text-xs uppercase tracking-wider text-muted-foreground sm:inline">{e.type}</span>
              <span className="flex-1 truncate font-mono">{e.target}</span>
              <RiskBadge risk={e.risk} />
            </button>
          ))}
        </div>
        <div className="panel h-fit p-5">
          {!sel ? (
            <DashboardState kind="empty" title="No event selected" message="Event details and AI analysis will appear here." />
          ) : (
            <>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{sel.type} · {sel.app}</div>
              <div className="mt-2 break-all font-mono text-lg">{sel.target}</div>
              <div className="mt-3 flex items-center gap-2 text-sm">Simulated risk score <RiskBadge risk={sel.risk} /></div>
              <Button className="mt-5 w-full" onClick={explain} disabled={loading || !ai.allowed}>
                {loading ? "Analysing…" : "Explain with AI"}
              </Button>
              <AiLockedNotice state={ai.state} />
              {loading && <DashboardState kind="loading" title="Analysing this sample event…" message="Waiting for the AI response. Nothing is being blocked or allowed." />}
              {aiError && <DashboardState kind="error" title="Analysis unavailable" message={aiError} onRetry={ai.allowed && !loading ? explain : undefined} />}
              {!loading && !aiError && !verdict && <DashboardState kind="empty" title="No AI analysis yet" message="This sample event has not been analysed." />}
              {verdict && !loading && !aiError && (
                <div className="mt-5 space-y-3 border-t pt-4">
                  <div className="flex gap-2">
                    <span className={cn("rounded px-2 py-0.5 text-xs font-semibold uppercase", verdict.verdict === "malicious" ? "bg-destructive/20 text-destructive" : verdict.verdict === "suspicious" ? "bg-warning/20 text-warning" : "bg-success/15 text-success")}>{verdict.verdict}</span>
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs font-semibold uppercase">Recommend: {verdict.action}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{verdict.explanation}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => toast.success(`Simulation only — ${sel.target} marked allowed; nothing changed`)}>Allow</Button>
                    <Button size="sm" variant="destructive" onClick={() => toast.success(`Simulation only — ${sel.target} marked blocked; nothing was actually blocked`)}>Block</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
