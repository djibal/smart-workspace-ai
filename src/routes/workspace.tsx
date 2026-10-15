import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/aegis";
import { APPS, USAGE, predictions } from "@/lib/sim";
import { askAegis } from "@/lib/ai.functions";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace · AegisDesk" },
      { name: "description", content: "AI predicts and pre-loads the apps you use most." },
      { property: "og:title", content: "AegisDesk Automated Workspace" },
      { property: "og:description", content: "Usage patterns, predictions and AI workspace tips." },
    ],
  }),
  component: Workspace,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BLOCKS = ["0–4", "4–8", "8–12", "12–16", "16–20", "20–24"];

function Workspace() {
  const preds = predictions();
  const [app, setApp] = useState<(typeof APPS)[number]>("Notion");
  const [tips, setTips] = useState<{ summary: string; tips: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const ask = useServerFn(askAegis);
  const max = Math.max(...USAGE[app].flat());

  const getTips = async () => {
    setLoading(true);
    try {
      const totals = Object.fromEntries(APPS.map((a) => [a, USAGE[a].flat().reduce((s, x) => s + x, 0)]));
      const r = await ask({ data: { kind: "workspace", context: { weeklyMinutes: totals, predictions: preds, now: new Date().toString() } } });
      if ("error" in r && r.error) toast.error(r.error);
      else setTips(r.result as typeof tips);
    } catch {
      toast.error("Couldn't reach the AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Automated Workspace" sub="AegisDesk learns your rhythm and pre-loads what's next." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="panel p-5">
          <div className="mb-4 flex flex-wrap gap-1">
            {APPS.map((a) => (
              <button key={a} onClick={() => setApp(a)} className={`rounded px-3 py-1 text-sm ${a === app ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}>{a}</button>
            ))}
          </div>
          <div className="grid grid-cols-[48px_repeat(6,1fr)] gap-1 text-xs">
            <div />
            {BLOCKS.map((b) => <div key={b} className="text-center font-mono text-muted-foreground">{b}</div>)}
            {DAYS.map((d, di) => (
              <Fragment key={d}>
                <div className="self-center text-muted-foreground">{d}</div>
                {USAGE[app][di].map((v, hi) => (
                  <div key={`${d}${hi}`} title={`${v} min`} className="h-9 rounded bg-primary" style={{ opacity: 0.08 + (v / max) * 0.92 }} />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="panel p-5">
            <h2 className="mb-3 font-semibold">Predicted next</h2>
            <ul className="space-y-3">
              {preds.slice(0, 4).map((p, i) => (
                <li key={p.app}>
                  <div className="flex justify-between text-sm">
                    <span>{p.app}</span>
                    <span className="font-mono text-xs text-muted-foreground">{i < 2 ? "pre-loaded" : "queued"} · {p.confidence}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded bg-secondary"><div className="h-full rounded bg-primary" style={{ width: `${p.confidence}%` }} /></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-5">
            <h2 className="mb-3 font-semibold">Workspace tips</h2>
            <Button className="w-full" onClick={getTips} disabled={loading}>{loading ? "Thinking…" : "Generate AI tips"}</Button>
            {tips && (
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-muted-foreground">{tips.summary}</p>
                <ul className="list-disc space-y-1 pl-5">{tips.tips.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
