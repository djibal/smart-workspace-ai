import { DashboardState, dashboardPage } from "@/components/dashboard-state";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppWindow, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, AiLockedNotice } from "@/components/aegis";
import { APPS, USAGE, predictions, type AppName } from "@/lib/sim";
import { buildCards, filterCards, type StatusFilter, type WorkspaceStatus } from "@/lib/workspace-filter";
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
const STATUS_LABEL: Record<WorkspaceStatus, string> = { preload: "Would pre-load", queue: "Would queue", none: "Not predicted" };

function Workspace() {
  const preds = useMemo(() => predictions(), []);
  const [app, setApp] = useState<AppName>("Notion");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tips, setTips] = useState<{ summary: string; tips: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const ask = useServerFn(askAegis);
  const ai = useAiAccess();
  const cards = useMemo(() => buildCards(APPS, USAGE, preds), [preds]);
  const shown = filterCards(cards, query, status);
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

  const resetFilters = () => { setQuery(""); setStatus("all"); };

  return (
    <>
      <PageHeader title="Automated Workspace" sub="Sample usage patterns showing how AegisDesk would predict your next app." />
      <section aria-labelledby="ws-apps" className="panel mb-6 min-w-0 p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 id="ws-apps" className="font-semibold">Sample apps</h2>
            <p className="text-sm text-muted-foreground">Sample data — no apps on your device are tracked or pre-loaded.</p>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex sm:items-center">
            <div className="relative col-span-2 min-w-0 sm:w-56">
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor="ws-search" className="sr-only">Search sample apps</label>
              <input id="ws-search" type="search" value={query} maxLength={100} onChange={(e) => setQuery(e.target.value)} placeholder="Search apps" className="min-h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-base sm:text-sm" />
            </div>
            <label htmlFor="ws-status" className="sr-only">Filter by predicted status</label>
            <select id="ws-status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="min-h-11 min-w-0 rounded-md border border-input bg-background px-3 text-base sm:text-sm">
              <option value="all">All statuses</option>
              <option value="preload">Would pre-load</option>
              <option value="queue">Would queue</option>
              <option value="none">Not predicted</option>
            </select>
            <Button variant="outline" className="min-h-11" onClick={resetFilters} disabled={!query && status === "all"}><RotateCcw aria-hidden="true" />Reset</Button>
          </div>
        </div>
        <p role="status" aria-live="polite" className="sr-only">{shown.length} of {cards.length} sample apps shown</p>
        {cards.length === 0 && <DashboardState kind="empty" title="Workspace is empty" message="There are no sample apps in this workspace." />}
        {cards.length > 0 && shown.length === 0 && <DashboardState kind="empty" title="No matching apps" message="No sample apps match your search or filter." onRetry={resetFilters} retryLabel="Clear search and filter" />}
        {shown.length > 0 && <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((c) => {
            const selected = c.app === app;
            return (
              <li key={c.app} className="min-w-0">
                <button type="button" aria-pressed={selected} onClick={() => setApp(c.app as AppName)} className={`flex min-h-11 w-full min-w-0 items-center gap-3 rounded-md border p-3 text-left transition-colors ${selected ? "border-primary bg-accent" : "hover:bg-secondary"}`}>
                  <AppWindow aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{c.app}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{c.weeklyMinutes} min/week · {c.confidence}%</span>
                  </span>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs ${c.status === "preload" ? "bg-primary/15 text-primary" : c.status === "queue" ? "bg-warning/15 text-warning" : "bg-secondary text-muted-foreground"}`}>{STATUS_LABEL[c.status]}</span>
                </button>
              </li>
            );
          })}
        </ul>}
      </section>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="panel min-w-0 p-4 sm:p-5">
          <h2 className="mb-4 font-semibold">Weekly usage · {app} <span className="text-sm font-normal text-muted-foreground">(sample)</span></h2>
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
