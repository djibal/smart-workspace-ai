import { DashboardState, dashboardPage } from "@/components/dashboard-state";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader, AiLockedNotice } from "@/components/aegis";
import { useResources, type AppName } from "@/lib/sim";
import { askAegis } from "@/lib/ai.functions";
import { useAiAccess } from "@/hooks/use-ai-access";

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Resources · AegisDesk" },
      { name: "description", content: "Simulated demo of per-app CPU and RAM limits suggested by AI." },
      { property: "og:title", content: "AegisDesk Intelligent Resource Allocation" },
      { property: "og:description", content: "Sample CPU/RAM per app with AI-suggested limits." },
    ],
  }),
  ...dashboardPage(Resources, "Resource Allocation", "Sample CPU and RAM figures showing how per-app limits would adjust."),
});

type Sugg = { app: string; ramLimit: number; cpuLimit: number; reason: string };

function Resources() {
  const { apps, eco, setEco, update } = useResources();
  const [sugg, setSugg] = useState<{ summary: string; suggestions: Sugg[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const ask = useServerFn(askAegis);
  const ai = useAiAccess();

  const optimise = async () => {
    setLoading(true);
    setAiError(null);
    try {
      const ctx = apps.map((a) => ({
        app: a.app, state: a.state, cpuLimit: a.cpuLimit, ramLimit: a.ramLimit,
        avgCpu: Math.round(a.history.reduce((s, h) => s + h.cpu, 0) / (a.history.length || 1)),
        avgRam: Math.round(a.history.reduce((s, h) => s + h.ram, 0) / (a.history.length || 1)),
      }));
      const r = await ask({ data: { kind: "resources", context: { batterySaver: eco, apps: ctx } } });
      if ("error" in r && r.error) { setAiError(r.error); toast.error(r.error); }
      else setSugg(r.result as typeof sugg);
    } catch {
      setAiError("Couldn’t reach the AI. Check your connection and try again.");
      toast.error("Couldn't reach the AI.");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    sugg?.suggestions.forEach((s) => {
      if (apps.some((a) => a.app === s.app))
        update(s.app as AppName, { ramLimit: Math.round(s.ramLimit), cpuLimit: Math.round(s.cpuLimit) });
    });
    toast.success("Simulation only — sample limits updated; no real app was changed");
    setSugg(null);
  };

  return (
    <>
      <PageHeader title="Resource Allocation" sub="Sample CPU and RAM figures showing how per-app limits would adjust.">
        <label className="flex items-center gap-3 text-sm">
          <Switch checked={eco} onCheckedChange={setEco} /> Battery / thermal saver
        </label>
      </PageHeader>
      {apps.length === 0 && <DashboardState kind="empty" title="No apps available" message="There are no sample resource figures to display." />}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {apps.map((a) => (
          <div key={a.app} className="panel p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{a.app}</span>
              <span className={`rounded px-2 py-0.5 text-xs uppercase ${a.state === "active" ? "bg-success/15 text-success" : a.state === "idle" ? "bg-warning/20 text-warning" : "bg-secondary text-muted-foreground"}`}>{a.state}</span>
            </div>
            <div className="mt-2 h-16">
              {a.history.length === 0 ? <p role="status" className="flex h-full items-center justify-center text-xs text-muted-foreground">No sample chart readings available.</p> : <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={a.history}>
                  <YAxis hide domain={[0, 100]} />
                  <Area type="monotone" dataKey="cpu" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs">
              <div>CPU <span className="text-primary">{a.cpu}%</span> / {a.cpuLimit}%</div>
              <div>RAM <span className="text-primary">{a.ram}</span> / {a.ramLimit} MB</div>
            </div>
            <div className="mt-1 h-1.5 rounded bg-secondary"><div className="h-full rounded bg-warning" style={{ width: `${Math.min(100, (a.ram / a.ramLimit) * 100)}%` }} /></div>
            <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => update(a.app, { state: a.state === "suspended" ? "active" : "suspended" })}>
              {a.state === "suspended" ? "Resume" : "Suspend"}
            </Button>
          </div>
        ))}
      </div>
      <div className="panel mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">AI Optimiser</h2>
            <p className="text-sm text-muted-foreground">Suggests new limits from recent usage.</p>
          </div>
          <div className="flex flex-col items-end">
            <Button onClick={optimise} disabled={loading || !ai.allowed || apps.length === 0}>{loading ? "Analysing…" : "Optimise with AI"}</Button>
            <AiLockedNotice state={ai.state} />
          </div>
        </div>
        {loading && <DashboardState kind="loading" title="Analysing sample resource use…" message="Waiting for the AI response. App limits have not changed." />}
        {aiError && <DashboardState kind="error" title="Optimisation unavailable" message={aiError} onRetry={ai.allowed && !loading ? optimise : undefined} />}
        {!loading && !aiError && !sugg && <DashboardState kind="empty" title="No suggestions yet" message="No AI optimisation has been requested for these sample figures." />}
        {sugg && !loading && !aiError && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">{sugg.summary}</p>
            {sugg.suggestions.length === 0 && <DashboardState kind="empty" title="No changes suggested" message="The AI returned no new app limits." />}
            <ul className="divide-y text-sm">
              {sugg.suggestions.map((s) => (
                <li key={s.app} className="flex flex-wrap gap-4 py-2">
                  <span className="w-20 font-semibold">{s.app}</span>
                  <span className="w-44 font-mono text-xs text-primary">CPU {Math.round(s.cpuLimit)}% · RAM {Math.round(s.ramLimit)} MB</span>
                  <span className="flex-1 text-muted-foreground">{s.reason}</span>
                </li>
              ))}
            </ul>
            <Button onClick={apply} disabled={sugg.suggestions.length === 0}>Apply suggestions</Button>
          </div>
        )}
      </div>
    </>
  );
}
