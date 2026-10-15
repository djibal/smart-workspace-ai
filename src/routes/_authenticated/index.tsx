import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Stat, RiskBadge } from "@/components/aegis";
import { useThreatFeed, useResources, predictions } from "@/lib/sim";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Overview · AegisDesk Control Center" },
      { name: "description", content: "Simulated overview of AegisDesk threats, predicted apps and resource use." },
      { property: "og:title", content: "AegisDesk Control Center" },
      { property: "og:description", content: "Demo with sample data of AegisDesk security and performance features." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const events = useThreatFeed();
  const { apps } = useResources();
  const blocked = events.filter((e) => e.risk >= 70).length;
  const ram = apps.reduce((s, a) => s + a.ram, 0);
  const next = predictions()[0]!;
  return (
    <>
      <PageHeader title="Control Center" sub="A preview of how AegisDesk would protect and tune your apps." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Apps running" value={apps.filter((a) => a.state !== "suspended").length} />
        <Stat label="High-risk events" value={blocked} hint="simulated · none actually blocked" />
        <Stat label="Total RAM" value={`${ram} MB`} hint="simulated figures" />
        <Stat label="Predicted next" value={next.app} hint={`${next.confidence}% confidence · simulated`} />
      </div>
      <div className="panel mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Sample activity</h2>
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
