import { DashboardState, dashboardPage } from "@/components/dashboard-state";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, AiLockedNotice } from "@/components/aegis";
import { APPS, USAGE, predictions } from "@/lib/sim";
import { askAegis } from "@/lib/ai.functions";
import { useAiAccess } from "@/hooks/use-ai-access";

export const Route = createFileRoute("/_authenticated/workspace")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Workspace · AegisDesk" },
      { name: "description", content: "Simulated demo of AI app prediction and pre-loading." },
      { property: "og:title", content: "AegisDesk Automated Workspace" },
      { property: "og:description", content: "Sample usage patterns, predictions and AI workspace tips." },
    ],
  }),
  ...dashboardPage(Workspace, "Automated Workspace", "Sample usage patterns showing how AegisDesk would predict your next app."),
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BLOCKS = ["0–4", "4–8", "8–12", "12–16", "16–20", "20–24"];

function Workspace() {
  const preds = predictions();
  const [app, setApp] = useState<(typeof APPS)[number]>("Notion");
  const [tips, setTips] = useState<{ summary: string; tips: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const ask = useServerFn(askAegis);
  const ai = useAiAccess();
  const usage = USAGE[app] ?? [];
  const max = Math.max(1, ...usage.flat());

  const getTips = async () => {
    setLoading(true);
    setAiError(null);
    try {
      const totals = Object.fromEntries(APPS.map((a) => [a, USAGE[a].flat().reduce((s, x) => s + x, 0)]));
      const r = await ask({ data: { kind: "workspace", context: { weeklyMinutes: totals, predictions: preds, now: new Date().toString() } } });
      if ("error" in r && r.error) { setAiError(r.error); toast.error(r.error); }
      else setTips(r.result as typeof tips);
    } catch {
      setAiError("Couldn’t reach the AI. Check your connection and try again.");
      toast.error("Couldn't reach the AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Automated Workspace" sub="Sample usage patterns showing how AegisDesk would predict your next app." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="panel p-5">
          <div className="mb-4 flex flex-wrap gap-1">
            {APPS.map((a) => (
              <button key={a} onClick={() => setApp(a)} className={`min-h-10 rounded px-3 py-1 text-sm ${a === app ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}>{a}</button>
            ))}
          </div>
          {usage.length === 0 && <DashboardState kind="empty" title="No usage history" message="No sample usage is available for this app." />}
          {usage.length > 0 && <div className="grid grid-cols-[36px_repeat(6,minmax(0,1fr))] gap-1 text-[10px] sm:grid-cols-[48px_repeat(6,1fr)] sm:text-xs">
            <div />
            {BLOCKS.map((b) => <div key={b} className="text-center font-mono text-muted-foreground">{b}</div>)}
            {DAYS.map((d, di) => (
              <Fragment key={d}>
                <div className="self-center text-muted-foreground">{d}</div>
                {(usage[di] ?? []).map((v, hi) => (
                  <div key={`${d}${hi}`} title={`${v} min`} className="h-9 rounded bg-primary" style={{ opacity: 0.08 + (v / max) * 0.92 }} />
                ))}
              </Fragment>
            ))}
          </div>}
        </div>
        <div className="space-y-6">
          <div className="panel p-5">
            <h2 className="mb-3 font-semibold">Predicted next (simulated)</h2>
            {preds.length === 0 && <DashboardState kind="empty" title="No predictions available" message="There is not enough sample usage to predict the next app." />}
            <ul className="space-y-3">
              {preds.slice(0, 4).map((p, i) => (
                <li key={p.app}>
                  <div className="flex justify-between text-sm">
                    <span>{p.app}</span>
                    <span className="font-mono text-xs text-muted-foreground">{i < 2 ? "would pre-load" : "would queue"} · {p.confidence}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-secondary"><div className="h-full rounded bg-primary" style={{ width: `${p.confidence}%` }} /></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-5">
            <h2 className="mb-3 font-semibold">Workspace tips</h2>
            <Button className="w-full" onClick={getTips} disabled={loading || !ai.allowed}>{loading ? "Thinking…" : "Generate AI tips"}</Button>
            <AiLockedNotice state={ai.state} />
            {loading && <DashboardState kind="loading" title="Generating workspace tips…" message="Waiting for the AI response. No apps are being pre-loaded." />}
            {aiError && <DashboardState kind="error" title="Workspace tips unavailable" message={aiError} onRetry={ai.allowed && !loading ? getTips : undefined} />}
            {!loading && !aiError && !tips && <DashboardState kind="empty" title="No workspace tips yet" message="No AI tips have been requested for this sample workspace." />}
            {tips && !loading && !aiError && (
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-muted-foreground">{tips.summary}</p>
                {tips.tips.length === 0 && <DashboardState kind="empty" title="No tips returned" message="The AI returned no additional workspace tips." />}
                <ul className="list-disc space-y-1 pl-5">{tips.tips.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
