import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Stat, RiskBadge } from "@/components/aegis";
import { useThreatFeed, useResources, predictions } from "@/lib/sim";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · AegisDesk Control Center" },
      { name: "description", content: "Live overview of AegisDesk threats, predicted apps and resource savings." },
      { property: "og:title", content: "AegisDesk Control Center" },
      { property: "og:description", content: "AI-driven security and performance for your desktop web apps." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const events = useThreatFeed();
  const { apps } = useResources();
  const blocked = events.filter((e) => e.risk >= 70).length;
  const ram = apps.reduce((s, a) => s + a.ram, 0);
  const next = predictions()[0];
  return (
    <>
      <PageHeader title="Control Center" sub="Your wrapped apps, protected and tuned by local AI." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Apps running" value={apps.filter((a) => a.state !== "suspended").length} />
        <Stat label="Threats blocked" value={blocked} hint="this session" />
        <Stat label="Total RAM" value={`${ram} MB`} hint={`≈ ${Math.max(0, 2400 - ram)} MB less than a browser`} />
        <Stat label="Predicted next" value={next.app} hint={`${next.confidence}% confidence`} />
      </div>
      <div className="panel mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Live activity</h2>
          <Link to="/threats" className="text-sm text-primary">Open Threat Intelligence →</Link>
        </div>
        <ul className="divide-y">
          {events.slice(0, 8).map((e) => (
            <li key={e.id} className="flex items-center gap-4 py-2 text-sm">
              <span className="w-20 font-mono text-xs text-muted-foreground">{e.time}</span>
              <span className="w-20">{e.app}</span>
              <span className="flex-1 truncate font-mono text-muted-foreground">{e.type === "permission" ? `requests ${e.target}` : e.target}</span>
              <RiskBadge risk={e.risk} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
