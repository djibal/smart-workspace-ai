import { createFileRoute } from "@tanstack/react-router";
import { Apple, Gamepad2, Monitor, Smartphone, TabletSmartphone } from "lucide-react";
import { PageHeader } from "@/components/aegis";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/platforms")({
  head: () => ({
    meta: [
      { title: "Platforms & Roadmap · AegisDesk" },
      { name: "description", content: "AegisDesk development targets and feature status for macOS, Windows, Android and iOS." },
      { property: "og:title", content: "AegisDesk Platforms & Roadmap" },
      { property: "og:description", content: "Which AegisDesk features are implemented, experimental, planned or unavailable on each platform." },
    ],
  }),
  component: Platforms,
});

type Status = "implemented" | "experimental" | "planned" | "unavailable";

const STATUS_LABEL: Record<Status, string> = {
  implemented: "Implemented",
  experimental: "Experimental",
  planned: "Planned",
  unavailable: "Unavailable",
};

const STATUS_STYLE: Record<Status, string> = {
  implemented: "bg-success/15 text-success",
  experimental: "bg-warning/20 text-warning",
  planned: "bg-accent text-accent-foreground",
  unavailable: "bg-secondary text-muted-foreground",
};

const PLATFORMS: { name: string; icon: typeof Monitor; status: Status; note: string }[] = [
  { name: "macOS (Apple Silicon)", icon: Apple, status: "experimental", note: "Native source compiles; packaged app not yet verified on real hardware." },
  { name: "Windows", icon: Monitor, status: "experimental", note: "Native source written; full build and run not yet verified." },
  { name: "Android", icon: Smartphone, status: "planned", note: "Development target only. No Android build exists." },
  { name: "iPhone / iPad", icon: TabletSmartphone, status: "planned", note: "Development target only. No iOS build exists." },
];

const FEATURES: { name: string; web: Status; desktop: Status; mobile: Status }[] = [
  { name: "Web dashboard (this app)", web: "implemented", desktop: "planned", mobile: "implemented" },
  { name: "AI explanations (signed-in, daily quota)", web: "implemented", desktop: "planned", mobile: "implemented" },
  { name: "Threat scoring & permission advisor", web: "experimental", desktop: "experimental", mobile: "planned" },
  { name: "Per-app isolated sessions", web: "unavailable", desktop: "experimental", mobile: "planned" },
  { name: "HTTPS-only app addresses", web: "unavailable", desktop: "experimental", mobile: "planned" },
  { name: "Workspace prediction & pre-loading", web: "experimental", desktop: "experimental", mobile: "planned" },
  { name: "RAM / CPU limits per app", web: "unavailable", desktop: "experimental", mobile: "unavailable" },
  { name: "Camera & microphone advisor", web: "unavailable", desktop: "experimental", mobile: "planned" },
];

function Pill({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold", STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function Platforms() {
  return (
    <>
      <PageHeader title="Platforms & Roadmap" sub="Where AegisDesk is heading, and what actually exists today." />

      <section aria-labelledby="targets" className="mb-8">
        <h2 id="targets" className="mb-3 font-semibold">Development targets</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORMS.map((p) => (
            <div key={p.name} className="panel flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <p.icon className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
                <Pill status={p.status} />
              </div>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm text-muted-foreground">{p.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="features" className="mb-8">
        <h2 id="features" className="mb-3 font-semibold">Feature status</h2>
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <caption className="sr-only">Feature status by platform</caption>
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-widest text-muted-foreground">
                <th scope="col" className="p-4 font-medium">Feature</th>
                <th scope="col" className="p-4 font-medium">Web</th>
                <th scope="col" className="p-4 font-medium">Desktop</th>
                <th scope="col" className="p-4 font-medium">Mobile</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {FEATURES.map((f) => (
                <tr key={f.name}>
                  <th scope="row" className="p-4 text-left font-normal">{f.name}</th>
                  <td className="p-4"><Pill status={f.web} /></td>
                  <td className="p-4"><Pill status={f.desktop} /></td>
                  <td className="p-4"><Pill status={f.mobile} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          "Mobile" for the web dashboard means this site in a phone browser — not a native app.
        </p>
      </section>

      <section aria-labelledby="gamehub" className="panel p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Gamepad2 className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          <h2 id="gamehub" className="font-semibold">GameHub</h2>
          <Pill status="planned" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          A future space for games, with the same protection as your other apps. Nothing here works yet.
        </p>
        <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <li className="rounded-md border p-4">
            <div className="font-medium">Browser games</div>
            <p className="mt-1 text-muted-foreground">Run web games in their own isolated, HTTPS-only window with resource limits.</p>
          </li>
          <li className="rounded-md border p-4">
            <div className="font-medium">Mobile gaming integration</div>
            <p className="mt-1 text-muted-foreground">Explore links with official mobile apps. Running Android apps or emulators is not planned.</p>
          </li>
        </ul>
      </section>
    </>
  );
}
