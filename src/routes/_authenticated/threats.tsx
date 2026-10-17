import { DashboardState, dashboardPage } from "@/components/dashboard-state";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, AiLockedNotice } from "@/components/aegis";
import { ThreatSeverity } from "@/components/threat-severity";
import { useThreatFeed, type ThreatEvent } from "@/lib/sim";
import { recommendationDisplay, threatDisplay, type ThreatAction } from "@/lib/threat-display";
import { aiResultSchemas } from "@/lib/ai.schemas";
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

type Verdict = { verdict: "safe" | "suspicious" | "malicious"; action: ThreatAction; explanation: string; confidence: number };

function Threats() {
  const events = useThreatFeed();
  const [sel, setSel] = useState<ThreatEvent | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "network" | "permission">("all");
  const [pausedEvents, setPausedEvents] = useState<ThreatEvent[] | null>(null);
  const ask = useServerFn(askAegis);
  const ai = useAiAccess();

  const explain = async () => {
    if (!sel || loading || !ai.allowed) return;
    setLoading(true);
    setAiError(null);
    setVerdict(null);
    try {
      const r = await ask({ data: { kind: "threat", context: sel } });
      if ("error" in r && r.error) setAiError(r.error);
      else {
        const parsed = aiResultSchemas.threat.safeParse(r.result);
        if (parsed.success) setVerdict(parsed.data);
        else setAiError("The AI response could not be displayed. Try again; no action was applied.");
      }
    } catch {
      setAiError("Couldn’t reach the AI. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const list = (pausedEvents ?? events).filter((e) => filter === "all" || e.type === filter);
  const selectedDisplay = sel ? threatDisplay(sel) : null;
  const recommendation = selectedDisplay ? recommendationDisplay(verdict?.action ?? selectedDisplay.action) : null;
  return (
    <>
      <PageHeader title="Threat Intelligence" sub="Sample requests and permission prompts with simulated risk scores.">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div role="group" aria-label="Filter sample events" className="flex gap-1 rounded-md bg-secondary p-1">
            {(["all", "network", "permission"] as const).map((f) => (
              <Button variant="ghost" key={f} aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn("min-h-11 px-3 capitalize", filter === f ? "bg-accent text-accent-foreground" : "text-muted-foreground")}>{f}</Button>
            ))}
          </div>
          <Button variant="outline" className="min-h-11" aria-pressed={pausedEvents !== null} onClick={() => setPausedEvents(pausedEvents ? null : [...events])}>
            {pausedEvents ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}{pausedEvents ? "Resume feed" : "Pause feed"}
          </Button>
        </div>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section aria-label="Sample threat events" className="panel min-w-0 max-h-[640px] overflow-y-auto">
          <div className="border-b px-4 py-3 text-xs text-muted-foreground">
            <p>Generated scores · not a device security assessment</p>
            <p role="status" className="mt-1">{pausedEvents ? "Sample feed paused" : "Sample feed updating"}</p>
          </div>
          {list.length === 0 && <DashboardState kind="empty" title={events.length === 0 ? "No sample events yet" : "No matching events"} message={events.length === 0 ? "No sample activity is available. This does not indicate that your device is safe or being monitored." : "No sample events match this filter."} onRetry={events.length > 0 ? () => setFilter("all") : undefined} retryLabel="Show all events" />}
          <ul>
          {list.map((e) => (
            <li key={e.id}>
            <Button
              variant="ghost"
              key={e.id}
              aria-pressed={sel?.id === e.id}
              aria-label={`${e.app}, ${e.type} request to ${e.target}; ${threatDisplay(e).scoreLabel}`}
              disabled={loading}
              onClick={() => { setSel(e); setVerdict(null); setAiError(null); }}
              className={cn("grid h-auto min-h-11 w-full min-w-0 justify-items-start gap-2 whitespace-normal rounded-none border-b px-4 py-3 text-left font-normal hover:bg-secondary disabled:cursor-wait", sel?.id === e.id && "bg-accent ring-1 ring-inset ring-ring")}
            >
              <span className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <span className="min-w-0"><span className="font-semibold">{e.app}</span><span className="ml-2 text-xs capitalize text-muted-foreground">{e.type}</span></span>
                <ThreatSeverity event={e} />
              </span>
              <span className="w-full min-w-0 break-all font-mono text-sm">{e.target}</span>
              <span className="flex w-full justify-between gap-2 text-xs text-muted-foreground"><span>Sample request</span><span className="font-mono">{e.time}</span></span>
            </Button>
            </li>
          ))}
          </ul>
        </section>
        <section aria-label="Selected sample event" className={cn("panel min-w-0 h-fit p-4 sm:p-5 lg:order-last", sel && "order-first")}>
          {!sel ? (
            <DashboardState kind="empty" title="No event selected" message="Event details and AI analysis will appear here." />
          ) : (
            <>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{sel.type} · {sel.app}</div>
               <h2 className="mt-2 break-all font-mono text-lg">{sel.target}</h2>
               <div className="mt-3 flex flex-wrap items-center gap-2 text-sm"><span>Simulated risk score</span><ThreatSeverity event={sel} /></div>
               <div className="mt-4 space-y-2 text-sm">
                 <h3 className="font-semibold">Potential risk in this example</h3>
                 <p className="leading-relaxed text-muted-foreground">{selectedDisplay?.risk}</p>
               </div>
               {recommendation && <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                 <h3 className="font-semibold">{verdict ? "AI recommendation" : "Sample-score guidance"}</h3>
                 <p className="font-medium">{recommendation.label}</p>
                 <p className="leading-relaxed text-muted-foreground">{recommendation.explanation}</p>
                 <p className="leading-relaxed text-muted-foreground">{recommendation.availability}</p>
               </div>}
               <Button className="mt-5 min-h-11 w-full" onClick={explain} disabled={loading || !ai.allowed}>
                {loading ? "Analysing…" : "Explain with AI"}
              </Button>
              <AiLockedNotice state={ai.state} />
              {loading && <DashboardState kind="loading" title="Analysing this sample event…" message="Waiting for the AI response. Nothing is being blocked or allowed." />}
              {aiError && <DashboardState kind="error" title="Analysis unavailable" message={aiError} onRetry={ai.allowed && !loading ? explain : undefined} />}
              {!loading && !aiError && !verdict && <DashboardState kind="empty" title="No AI analysis yet" message="This sample event has not been analysed." />}
              {verdict && !loading && !aiError && (
                 <div role="status" aria-live="polite" className="mt-5 space-y-3 border-t pt-4">
                   <h3 className="text-sm font-semibold">AI analysis of sample data</h3>
                   <p className="text-sm">Sample verdict: <strong>{verdict.verdict === "safe" ? "Low concern" : verdict.verdict}</strong></p>
                   <p className="break-words text-sm leading-relaxed">{verdict.explanation}</p>
                   <p className="text-xs text-muted-foreground">AI guidance may be incorrect. This is not a scan or confirmation of device safety.</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
