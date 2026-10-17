import { Component, useEffect, useState, type ReactNode } from "react";
import { AlertCircle, Inbox, LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/aegis";

export function DashboardState({ kind, title, message, onRetry }: {
  kind: "loading" | "empty" | "error";
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  const Icon = kind === "loading" ? LoaderCircle : kind === "error" ? AlertCircle : Inbox;
  return (
    <div role={kind === "error" ? "alert" : "status"} aria-live="polite" aria-busy={kind === "loading"} className="flex min-h-32 flex-col items-center justify-center gap-2 px-4 py-6 text-center">
      <Icon aria-hidden="true" className={`h-5 w-5 ${kind === "error" ? "text-destructive" : "text-muted-foreground"} ${kind === "loading" ? "motion-safe:animate-spin" : ""}`} />
      <p className="font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && <Button variant="outline" className="mt-2" onClick={onRetry}><RefreshCw aria-hidden="true" />Try again</Button>}
    </div>
  );
}

function PageLoading({ title, sub }: { title: string; sub: string }) {
  return <><PageHeader title={title} sub={sub} /><DashboardState kind="loading" title={`Loading ${title.toLowerCase()}…`} message="Preparing this page. Sample figures are not live device data." /></>;
}

class DashboardBoundary extends Component<{ title: string; sub: string; children: ReactNode }, { failed: boolean; attempt: number }> {
  state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <><PageHeader title={this.props.title} sub={this.props.sub} /><DashboardState kind="error" title="This page couldn’t load" message="The page data is unavailable. Try again to reload this page." onRetry={() => this.setState(({ attempt }) => ({ failed: false, attempt: attempt + 1 }))} /></>;
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
    return <><PageHeader title={title} sub={sub} /><DashboardState kind="error" title="This page couldn’t load" message="The page is unavailable. Try again to reload it." onRetry={() => { void router.invalidate().then(reset); }} /></>;
  }
  return { component: DashboardPage, pendingComponent: PendingPage, errorComponent: ErrorPage };
}