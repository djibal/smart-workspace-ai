import { Component, useEffect, useState, type ReactNode } from "react";
import { AlertCircle, Inbox, LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/aegis";

export function DashboardState({ kind, title, message, onRetry, retryLabel = "Try again" }: {
  kind: "loading" | "empty" | "error";
  title: string;
  message: string;
  onRetry?: (() => void | Promise<void>) | undefined;
  retryLabel?: string;
}) {
  const [retrying, setRetrying] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);
  const [delayed, setDelayed] = useState(false);
  useEffect(() => {
    setDelayed(false);
    if (kind !== "loading") return;
    const timer = window.setTimeout(() => setDelayed(true), 10000);
    return () => window.clearTimeout(timer);
  }, [kind]);
  const retry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    setRetryFailed(false);
    try { await onRetry(); }
    catch { setRetryFailed(true); }
    finally { setRetrying(false); }
  };
  const Icon = kind === "loading" ? LoaderCircle : kind === "error" ? AlertCircle : Inbox;
  return (
    <div role={kind === "error" ? "alert" : "status"} aria-live={kind === "error" ? "assertive" : "polite"} aria-atomic="true" aria-busy={kind === "loading" || retrying} className="flex min-h-32 min-w-0 flex-col items-center justify-center gap-2 break-words px-4 py-6 text-center">
      <Icon aria-hidden="true" className={`h-5 w-5 ${kind === "error" ? "text-destructive" : "text-muted-foreground"} ${kind === "loading" ? "motion-safe:animate-spin" : ""}`} />
      <p className="font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {delayed && <p className="max-w-md text-sm text-muted-foreground">This is taking longer than usual. Still waiting; no result is available yet.</p>}
      {retryFailed && <p className="max-w-md text-sm text-muted-foreground">The page is still unavailable. Check your connection and try again.</p>}
      {onRetry && <Button variant="outline" className="mt-2 min-h-11 max-w-full whitespace-normal" disabled={retrying} onClick={() => { void retry(); }}><RefreshCw aria-hidden="true" className={retrying ? "motion-safe:animate-spin" : undefined} />{retrying ? "Retrying…" : retryLabel}</Button>}
    </div>
  );
}

function PageLoading({ title, sub }: { title: string; sub: string }) {
  return <><PageHeader title={title} sub={sub} /><DashboardState kind="loading" title={`Loading ${title.toLowerCase()}…`} message="Preparing this page. Sample figures are not live device data." /></>;
}

class DashboardBoundary extends Component<{ title: string; sub: string; children: ReactNode }, { failed: boolean; attempt: number }> {
  override state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() {
    if (this.state.failed) return <><PageHeader title={this.props.title} sub={this.props.sub} /><DashboardState kind="error" title={`${this.props.title} couldn’t load`} message="This page couldn’t be displayed. Try again; the other pages are still available." onRetry={() => this.setState(({ attempt }) => ({ failed: false, attempt: attempt + 1 }))} /></>;
    return <div key={this.state.attempt}>{this.props.children}</div>;
  }
}

// A real hydration/loading state; no artificial delays or network calls for static sample data.
export function dashboardPage(Page: () => ReactNode, title: string, sub: string) {
  function ReadyPage() {
    const [ready, setReady] = useState(false);
    useEffect(() => { setReady(true); }, []);
    return ready ? <Page /> : <PageLoading title={title} sub={sub} />;
  }
  function DashboardPage() {
    return <DashboardBoundary title={title} sub={sub}><ReadyPage /></DashboardBoundary>;
  }
  function PendingPage() { return <PageLoading title={title} sub={sub} />; }
  function ErrorPage({ reset }: ErrorComponentProps) {
    const router = useRouter();
    return <><PageHeader title={title} sub={sub} /><DashboardState kind="error" title={`${title} couldn’t load`} message="This page is unavailable. Try again; the other pages are still available." onRetry={async () => { await router.invalidate({ sync: true }); reset(); }} /></>;
  }
  return { component: DashboardPage, pendingComponent: PendingPage, errorComponent: ErrorPage };
}