import { useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, ExternalLink, Gamepad2, Link2, LockKeyhole, Play, Search, Smartphone, X } from "lucide-react";
import { PageHeader } from "@/components/aegis";
import { DashboardState, dashboardPage } from "@/components/dashboard-state";
import { GameArt } from "@/components/game-art";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { approvedDestination, filterGames, GAMEHUB_NOTICE, GAMES, MOBILE_DESTINATIONS, parseCustomGameUrl } from "@/lib/gamehub";

const SUBTITLE = "Browser games and official mobile destinations.";
export const Route = createFileRoute("/_authenticated/gamehub")({
  head: () => ({ meta: [
    { title: "GameHub · AegisDesk" },
    { name: "description", content: "Browse curated browser games and official mobile game destinations in AegisDesk. Native isolation and resource controls remain planned." },
    { property: "og:title", content: "AegisDesk GameHub" },
    { property: "og:description", content: "A curated game library with transparent external launch notices and official mobile links." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  ...dashboardPage(GameHub, "GameHub", SUBTITLE, GAMEHUB_NOTICE),
});
type Destination = { name: string; url: string; note: string };
function GameHub() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [destination, setDestination] = useState<Destination | null>(null);
  const launchButton = useRef<HTMLButtonElement | null>(null);
  const filtered = filterGames(GAMES, query, category);
  const reset = () => { setQuery(""); setCategory("all"); };
  return <>
    <PageHeader title="GameHub" sub={SUBTITLE} simulationMessage={GAMEHUB_NOTICE}>
      <span className="inline-flex items-center gap-2 text-sm text-primary"><Gamepad2 aria-hidden="true" className="h-5 w-5" />Web library available</span>
    </PageHeader>
    <section aria-labelledby="browser-library">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 id="browser-library" className="text-lg font-semibold">Browser games</h2><span className="text-xs text-muted-foreground">External websites · no installation in AegisDesk</span></div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><label htmlFor="game-search" className="sr-only">Search games</label><Search aria-hidden="true" className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" /><Input id="game-search" type="search" placeholder="Search games or publishers" value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 pl-10" /></div>
        <Select value={category} onValueChange={setCategory}><SelectTrigger aria-label="Game category" className="h-11 sm:w-44"><SelectValue /></SelectTrigger><SelectContent>{["all", "Puzzle", "Strategy", "Arcade"].map((value) => <SelectItem key={value} value={value}>{value === "all" ? "All categories" : value}</SelectItem>)}</SelectContent></Select>
        {(query || category !== "all") && <Button variant="ghost" className="min-h-11" onClick={reset}><X aria-hidden="true" />Reset</Button>}
      </div>
      <p role="status" aria-live="polite" className="mb-3 text-xs text-muted-foreground">{filtered.length} of {GAMES.length} games</p>
      {filtered.length === 0 ? <DashboardState kind="empty" title="No matching games" message="No games match your search and category." onRetry={reset} retryLabel="Clear filters" /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.map((game) => <article key={game.id} className="panel flex min-w-0 flex-col overflow-hidden">
          <GameArt id={game.id} />
          <div className="flex flex-1 flex-col p-4"><div className="mb-2 flex items-start justify-between gap-2"><h3 className="text-lg font-semibold">{game.name}</h3><span className="rounded bg-accent px-2 py-1 text-xs text-accent-foreground">{game.category}</span></div><p className="mb-3 text-xs text-muted-foreground">{game.publisher}</p><p className="mb-5 flex-1 text-sm text-muted-foreground">{game.description}</p><Button variant="secondary" className="min-h-11 w-full" aria-label={`Open ${game.name}`} onClick={(event) => { launchButton.current = event.currentTarget; setDestination(game); }}>Open game<ArrowUpRight aria-hidden="true" /></Button></div>
        </article>)}
      </div>}
    </section>
    <CustomGame />
    <section aria-labelledby="mobile-destinations" className="mt-8 border-t pt-6">
      <div className="mb-4 flex items-center gap-2"><Smartphone aria-hidden="true" className="h-5 w-5 text-primary" /><h2 id="mobile-destinations" className="text-lg font-semibold">Official mobile destinations</h2></div>
      <div className="grid gap-4 sm:grid-cols-2">{MOBILE_DESTINATIONS.map((entry) => <article key={entry.id} className="panel flex min-w-0 flex-col gap-3 p-5"><h3 className="font-semibold">{entry.name}</h3><p className="flex-1 text-sm text-muted-foreground">{entry.description}</p><Button variant="outline" className="min-h-11 self-start" onClick={(event) => { launchButton.current = event.currentTarget; setDestination(entry); }}>Visit official site<ExternalLink aria-hidden="true" /></Button></article>)}</div>
      <p className="mt-3 text-xs text-muted-foreground">Links only. AegisDesk does not run Android or iOS apps, install games, or provide an emulator.</p>
    </section>
    <section aria-labelledby="native-roadmap" className="mt-8 border-t pt-6">
      <div className="mb-3 flex flex-wrap items-center gap-2"><LockKeyhole aria-hidden="true" className="h-5 w-5 text-muted-foreground" /><h2 id="native-roadmap" className="font-semibold">Native GameHub protections</h2><span className="rounded bg-accent px-2 py-1 text-xs text-accent-foreground">Planned</span></div>
      <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3"><li>Per-game isolated desktop windows</li><li>HTTPS-only request enforcement</li><li>Per-game CPU and RAM limits</li></ul>
      <p className="mt-3 text-xs text-muted-foreground">Unavailable in this web app. An HTTPS link is not a guarantee that a game is safe.</p>
    </section>
    <Dialog open={destination !== null} onOpenChange={(open) => { if (!open) setDestination(null); }}>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg" onCloseAutoFocus={(event) => { event.preventDefault(); launchButton.current?.focus(); }}>
        <DialogHeader><DialogTitle className="pr-8">Open {destination?.name}?</DialogTitle><DialogDescription>You are leaving AegisDesk for a third-party website in a new tab.</DialogDescription></DialogHeader>
        {destination && <><p className="break-all rounded-md border bg-secondary p-3 font-mono text-xs">{destination.url}</p><p className="text-sm text-muted-foreground">{destination.note}</p><p className="text-sm text-warning">No AegisDesk isolation or resource limits apply. The website’s privacy policy, permissions, and terms apply.</p><div className="flex flex-wrap justify-end gap-2"><DialogClose asChild><Button variant="outline" className="min-h-11">Cancel</Button></DialogClose>{approvedDestination(destination.url) && <Button asChild className="min-h-11"><a href={destination.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" onClick={() => setDestination(null)}>Continue to site<ExternalLink aria-hidden="true" /></a></Button>}</div></>}
      </DialogContent>
    </Dialog>
  </>;
}

function CustomGame() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<{ url: string; host: string } | null>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = parseCustomGameUrl(input, window.location.hostname);
    if (!result.ok) { setError(result.error); return; }
    setError(null); setGame({ url: result.url, host: result.host });
  };
  return <section aria-labelledby="custom-game" className="mt-8 border-t pt-6">
    <div className="mb-2 flex items-center gap-2"><Link2 aria-hidden="true" className="h-5 w-5 text-primary" /><h2 id="custom-game" className="text-lg font-semibold">Play your own game link</h2></div>
    <p className="mb-4 text-sm text-muted-foreground">Paste a secure (https://) link to a browser game to play it inside AegisDesk. Links are not saved.</p>
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 sm:flex-row">
      <div className="flex-1"><label htmlFor="custom-game-url" className="sr-only">Game link</label><Input id="custom-game-url" type="url" inputMode="url" autoComplete="off" spellCheck={false} placeholder="https://example.com/game" value={input} onChange={(e) => setInput(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? "custom-game-error" : undefined} className="h-11" /></div>
      <Button type="submit" className="min-h-11"><Play aria-hidden="true" />Play here</Button>
    </form>
    {error && <p id="custom-game-error" role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    {game && <div className="panel mt-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-3">
        <p className="min-w-0 truncate font-mono text-xs" title={game.url}>{game.host}</p>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="min-h-11"><a href={game.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">New tab<ExternalLink aria-hidden="true" /></a></Button>
          <Button variant="ghost" size="sm" className="min-h-11" onClick={() => setGame(null)}><X aria-hidden="true" />Close game</Button>
        </div>
      </div>
      <iframe key={game.url} title={`Game from ${game.host}`} src={game.url} className="block aspect-[4/3] max-h-[75dvh] w-full bg-background"
        sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms" allow="fullscreen; gamepad; autoplay" referrerPolicy="no-referrer" loading="lazy" />
      <p className="border-t p-3 text-xs text-warning">This game comes from {game.host}, not AegisDesk. It runs in a restricted frame without access to your AegisDesk account, camera, microphone or pop-ups, but no processor or memory limits apply. If it stays blank, the site does not allow being played inside other apps — use "New tab".</p>
    </div>}
  </section>;
}
