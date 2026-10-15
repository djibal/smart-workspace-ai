import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, RiskBadge } from "@/components/aegis";
import { useThreatFeed, type ThreatEvent } from "@/lib/sim";
import { askAegis } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/threats")({
  head: () => ({
    meta: [
      { title: "Threat Intelligence · AegisDesk" },
      { name: "description", content: "Real-time AI analysis of network traffic and permission requests." },
      { property: "og:title", content: "AegisDesk Threat Intelligence" },
      { property: "og:description", content: "AI scores every request and permission prompt in real time." },
    ],
  }),
  component: Threats,
});

type Verdict = { verdict: string; action: string; explanation: string; confidence: number };

function Threats() {
  const events = useThreatFeed();
  const [sel, setSel] = useState<ThreatEvent | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "network" | "permission">("all");
  const ask = useServerFn(askAegis);

  const explain = async () => {
    if (!sel) return;
    setLoading(true);
    setVerdict(null);
    try {
      const r = await ask({ data: { kind: "threat", context: sel } });
      if ("error" in r && r.error) toast.error(r.error);
      else setVerdict(r.result as Verdict);
    } catch {
      toast.error("Couldn't reach the AI.");
    } finally {
      setLoading(false);
    }
  };

  const list = events.filter((e) => filter === "all" || e.type === filter);
  return (
    <>
      <PageHeader title="Threat Intelligence" sub="Every request and permission prompt, scored live.">
        <div className="flex gap-1 rounded-md bg-secondary p-1">
          {(["all", "network", "permission"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("rounded px-3 py-1 text-sm capitalize", filter === f ? "bg-accent text-accent-foreground" : "text-muted-foreground")}>{f}</button>
          ))}
        </div>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="panel max-h-[640px] overflow-y-auto">
          {list.map((e) => (
            <button
              key={e.id}
              onClick={() => { setSel(e); setVerdict(null); }}
              className={cn("flex w-full items-center gap-4 border-b px-4 py-3 text-left text-sm transition-colors hover:bg-secondary", sel?.id === e.id && "bg-accent")}
            >
              <span className="w-20 font-mono text-xs text-muted-foreground">{e.time}</span>
              <span className="w-16">{e.app}</span>
              <span className="w-24 text-xs uppercase tracking-wider text-muted-foreground">{e.type}</span>
              <span className="flex-1 truncate font-mono">{e.target}</span>
              <RiskBadge risk={e.risk} />
            </button>
          ))}
        </div>
        <div className="panel h-fit p-5">
          {!sel ? (
            <p className="text-sm text-muted-foreground">Select an event to inspect it.</p>
          ) : (
            <>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{sel.type} · {sel.app}</div>
              <div className="mt-2 break-all font-mono text-lg">{sel.target}</div>
              <div className="mt-3 flex items-center gap-2 text-sm">Risk score <RiskBadge risk={sel.risk} /></div>
              <Button className="mt-5 w-full" onClick={explain} disabled={loading}>
                {loading ? "Analysing…" : "Explain with AI"}
              </Button>
              {verdict && (
                <div className="mt-5 space-y-3 border-t pt-4">
                  <div className="flex gap-2">
                    <span className={cn("rounded px-2 py-0.5 text-xs font-semibold uppercase", verdict.verdict === "malicious" ? "bg-destructive/20 text-destructive" : verdict.verdict === "suspicious" ? "bg-warning/20 text-warning" : "bg-success/15 text-success")}>{verdict.verdict}</span>
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs font-semibold uppercase">Recommend: {verdict.action}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{verdict.explanation}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => toast.success(`Allowed ${sel.target}`)}>Allow</Button>
                    <Button size="sm" variant="destructive" onClick={() => toast.success(`Blocked ${sel.target}`)}>Block</Button>
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
