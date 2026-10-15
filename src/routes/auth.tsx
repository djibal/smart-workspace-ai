import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") && p !== "/auth" ? p : "/");

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Sign in · AegisDesk Control Center" },
      { name: "description", content: "Sign in to the private AegisDesk Control Center." },
      { property: "og:title", content: "Sign in · AegisDesk" },
      { property: "og:description", content: "Private access to the AegisDesk Control Center." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const target = safePath(redirect);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: target });
    });
  }, [navigate, target]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError("Wrong email or password, or this account isn't approved yet.");
    else navigate({ to: target });
  };

  const google = async () => {
    setError(null);
    sessionStorage.setItem("aegis-after-login", target);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r && "error" in r && r.error) setError("Google sign-in failed. Only approved accounts can sign in.");
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="panel w-full max-w-sm p-6">
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
          <h1 className="text-xl font-bold tracking-tight">Sign in to AegisDesk</h1>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">Private access. Accounts are created by the administrator.</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            Email
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2" />
          </label>
          <label className="block text-sm">
            Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2" />
          </label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
        <div className="my-4 text-center text-xs uppercase tracking-widest text-muted-foreground">or</div>
        <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
      </div>
    </div>
  );
}
