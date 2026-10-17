import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { Shield, ShieldAlert, LayoutGrid, Sparkle, Cpu, LogOut, MonitorSmartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1a1d22" },
      { title: "AegisDesk Control Center" },
      { name: "description", content: "AegisDesk demo: AI threat intelligence, workspace prediction and resource allocation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV = [
  { to: "/", label: "Overview", short: "Overview", icon: LayoutGrid },
  { to: "/threats", label: "Threat Intelligence", short: "Threats", icon: ShieldAlert },
  { to: "/workspace", label: "Workspace", short: "Workspace", icon: Sparkle },
  { to: "/resources", label: "Resources", short: "Resources", icon: Cpu },
  { to: "/platforms", label: "Platforms & Roadmap", short: "Platforms", icon: MonitorSmartphone },
] as const;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event === "SIGNED_IN") {
        const next = sessionStorage.getItem("aegis-after-login");
        if (next) {
          sessionStorage.removeItem("aegis-after-login");
          if (next.startsWith("/") && !next.startsWith("//")) navigate({ to: next });
        }
        queryClient.invalidateQueries();
      }
      if (event === "SIGNED_OUT") {
        queryClient.clear();
        navigate({ to: "/auth" });
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router, navigate, queryClient]);
  const signOut = () => supabase.auth.signOut();

  if (path === "/auth") {
    return (
      <QueryClientProvider client={queryClient}>
        <main className="mx-auto max-w-6xl p-6"><Outlet /></main>
        <Toaster theme="dark" />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <div className="flex min-h-screen">
        {/* Tablet: icon rail. Desktop: full sidebar. */}
        <aside aria-label="Main navigation" className="sticky top-0 hidden h-screen w-16 shrink-0 flex-col border-r bg-card/50 p-2 md:flex lg:w-60 lg:p-4">
          <div className="mb-8 flex items-center justify-center gap-2 px-2 pt-2 lg:justify-start">
            <Shield className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
            <span className="hidden text-lg font-bold tracking-tight lg:inline">AegisDesk</span>
          </div>
          <nav className="space-y-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                title={n.label}
                activeOptions={{ exact: true }}
                className="flex min-h-11 items-center justify-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:justify-start"
                activeProps={{ className: "bg-accent text-accent-foreground", "aria-current": "page" }}
              >
                <n.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="sr-only lg:not-sr-only">{n.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto">
            <p className="hidden px-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground lg:block">
              Demo · simulated data
            </p>
            <button onClick={signOut} title="Sign out" className="mt-4 flex min-h-11 w-full items-center justify-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground lg:justify-start">
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="sr-only lg:not-sr-only">Sign out</span>
            </button>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          {/* Mobile top bar */}
          <header className="safe-top sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-2 backdrop-blur md:hidden">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="font-bold tracking-tight">AegisDesk</span>
            </div>
            <button onClick={signOut} className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground hover:bg-secondary">
              <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
            </button>
          </header>
          <main id="main" className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:p-10">
            <Outlet />
          </main>
        </div>
      </div>
      {/* Mobile bottom navigation */}
      <nav aria-label="Main navigation" className="safe-bottom fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card/95 backdrop-blur md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: true }}
            className="flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary", "aria-current": "page" }}
          >
            <n.icon className="h-5 w-5" aria-hidden="true" />
            <span className="truncate">{n.short}</span>
          </Link>
        ))}
      </nav>
      <Toaster theme="dark" />
    </QueryClientProvider>
  );
}
