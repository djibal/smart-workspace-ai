import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitLead } from "@/lib/leads.functions";
import { leadSchema, type LeadInput } from "@/lib/leads.schemas";

export const Route = createFileRoute("/leads")({
  head: () => ({ meta: [
    { title: "Contact AegisDesk" },
    { name: "description", content: "Get in touch with AegisDesk. Send your enquiry without creating an account." },
    { property: "og:title", content: "Contact AegisDesk" },
    { property: "og:description", content: "Send an enquiry to AegisDesk." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: LeadPage,
});

const empty: LeadInput = { name: "", email: "", company: "", phone: "", message: "", website: "" };

function LeadPage() {
  const send = useServerFn(submitLead);
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadInput, string>>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    const parsed = leadSchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<keyof LeadInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof LeadInput;
        next[key] = issue.message;
      }
      setErrors(next);
      document.getElementById(String(parsed.error.issues[0]?.path[0]))?.focus();
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const result = await send({ data: parsed.data });
      if (result.success) { setSaved(true); setValues(empty); }
      else setError(result.error ?? "Your message couldn't be saved. Please try again.");
    } catch {
      setError("Your message couldn't be saved. Please check your connection and try again.");
    } finally { setBusy(false); }
  };

  const field = (key: "name" | "email" | "company" | "phone", label: string, required: boolean, maxLength: number, autoComplete: string, type = "text") => (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={key}>{label}{!required && <span className="font-normal text-muted-foreground"> · optional</span>}</Label>
      <Input id={key} name={key} type={type} required={required} maxLength={maxLength} autoComplete={autoComplete}
        value={values[key]} disabled={busy} className="min-h-11 bg-background"
        aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${key}-error` : undefined}
        onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))} />
      {errors[key] && <p id={`${key}-error`} className="text-sm text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <header className="flex items-center justify-between gap-4 border-b py-5">
        <div className="flex items-center gap-2 font-bold"><Shield className="size-6 text-primary" aria-hidden="true" /> AegisDesk</div>
        <Button variant="ghost" asChild><Link to="/auth">Dashboard sign in <ArrowRight aria-hidden="true" /></Link></Button>
      </header>
      <section className="py-10 sm:py-14" aria-labelledby="lead-title">
        <p className="mb-3 font-mono text-xs uppercase text-primary">Get in touch</p>
        <h1 id="lead-title" className="text-3xl font-semibold sm:text-4xl">Contact AegisDesk</h1>
        <p className="mt-4 text-muted-foreground">Tell us about your interest in AegisDesk.</p>
        {saved ? (
          <div role="status" className="mt-10 border-t pt-8">
            <CheckCircle2 className="mb-4 size-8 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Message received</h2>
            <p className="mt-2 text-muted-foreground">Your enquiry has been saved for the AegisDesk team.</p>
            <Button variant="outline" className="mt-6 min-h-11" onClick={() => setSaved(false)}>Send another message</Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-10 space-y-6" aria-busy={busy}>
            <div className="grid gap-6 sm:grid-cols-2">
              {field("name", "Name", true, 100, "name")}
              {field("email", "Email", true, 254, "email", "email")}
              {field("company", "Company", false, 120, "organization")}
              {field("phone", "Phone", false, 40, "tel", "tel")}
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" required maxLength={2000} rows={5} disabled={busy}
                className="resize-y bg-background" value={values.message}
                aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error" : undefined}
                onChange={(event) => setValues((previous) => ({ ...previous, message: event.target.value }))} />
              {errors.message && <p id="message-error" className="text-sm text-destructive">{errors.message}</p>}
            </div>
            <div hidden aria-hidden="true"><label htmlFor="website">Website</label><input id="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(event) => setValues((previous) => ({ ...previous, website: event.target.value }))} /></div>
            <p className="text-xs leading-relaxed text-muted-foreground">Your details will be stored to respond to your enquiry. Please don’t include passwords or sensitive security information.</p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy} className="min-h-11 w-full sm:w-auto">
              {busy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
              {busy ? "Sending…" : "Send enquiry"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}