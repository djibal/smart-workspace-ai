import { useMemo } from "react";
import { DailyBriefing } from "@/components/daily-briefing";
import { DashboardState, dashboardPage } from "@/components/dashboard-state";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Stat, RiskBadge } from "@/components/aegis";
import { useThreatFeed, useResources, predictions } from "@/lib/sim";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Overview · AegisDesk Control Center" },
      { name: "description", content: "Simulated overview of AegisDesk threats, predicted apps and resource use." },
      { property: "og:title", content: "AegisDesk Control Center" },
      { property: "og:description", content: "Demo with sample data of AegisDesk security and performance features." },
    ],
  }),
  ...dashboardPage(Overview, "Control Center", "A preview of how AegisDesk would protect and tune your apps."),
});

function Overview() {
  const events = useThreatFeed();
  const { apps } = useResources();
  const blocked = events.filter((e) => e.risk >= 70).length;
  const ram = apps.reduce((s, a) => s + a.ram, 0);
  const next = useMemo(() => predictions()[0], []);
  return (
    <>
      <PageHeader title="Control Center" sub="A preview of how AegisDesk would protect and tune your apps." />
      {apps.length === 0 && <DashboardState kind="empty" title="No resource data available" message="Sample app figures haven’t been provided." />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Apps running" value={apps.length ? apps.filter((a) => a.state !== "suspended").length : "Unavailable"} />
        <Stat label="High-risk events" value={events.length ? blocked : "Unavailable"} hint="simulated · none actually blocked" />
        <Stat label="Total RAM" value={apps.length ? `${ram} MB` : "Unavailable"} hint="simulated figures" />
        <Stat label="Predicted next" value={next?.app ?? "Unavailable"} hint={next ? `${next.confidence}% confidence · simulated` : "No predictions available"} />
      </div>
      <DailyBriefing events={events} apps={apps} />
      <div className="panel mt-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Sample activity</h2>
          <Link to="/threats" className="text-sm text-primary">Open Threat Intelligence →</Link>
        </div>
        {events.length === 0 && <DashboardState kind="empty" title="No sample activity yet" message="No sample events are available. This does not indicate that your device is safe or being monitored." />}
        <ul className="divide-y">
          {events.slice(0, 8).map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2 text-sm sm:gap-4">
              <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground sm:w-20">{e.time}</span>
              <span className="w-16 shrink-0 truncate sm:w-20">{e.app}</span>
              <span className="min-w-0 flex-1 truncate font-mono text-muted-foreground">{e.type === "permission" ? `requests ${e.target}` : e.target}</span>
              <RiskBadge risk={e.risk} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
