import { createServerFn } from "@tanstack/react-start";

type Kind = "threat" | "workspace" | "resources";

const SCHEMAS: Record<Kind, { system: string; schema: Record<string, unknown> }> = {
  threat: {
    system:
      "You are AegisDesk Threat Shield, a local security analyst for desktop-wrapped web apps. Given one network or permission event, give a short plain-language verdict for a non-technical user.",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["verdict", "action", "explanation", "confidence"],
      properties: {
        verdict: { type: "string", enum: ["safe", "suspicious", "malicious"] },
        action: { type: "string", enum: ["allow", "ask", "block"] },
        explanation: { type: "string" },
        confidence: { type: "number" },
      },
    },
  },
  workspace: {
    system:
      "You are AegisDesk Workspace AI. Given app usage stats and predictions, give 3 concise, practical workspace tips (pre-loading, focus, grouping).",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "tips"],
      properties: {
        summary: { type: "string" },
        tips: { type: "array", items: { type: "string" } },
      },
    },
  },
  resources: {
    system:
      "You are AegisDesk Resource Governor AI. Given per-app CPU% and RAM MB usage and current limits, propose new limits per app (RAM 64-2048 MB, CPU 5-100%) with a one-line reason each. Be efficient but avoid starving active apps.",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "suggestions"],
      properties: {
        summary: { type: "string" },
        suggestions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["app", "ramLimit", "cpuLimit", "reason"],
            properties: {
              app: { type: "string" },
              ramLimit: { type: "number" },
              cpuLimit: { type: "number" },
              reason: { type: "string" },
            },
          },
        },
      },
    },
  },
};

export const askAegis = createServerFn({ method: "POST" })
  .inputValidator((d: { kind: Kind; context: unknown }) => {
    if (!d || !(d.kind in SCHEMAS)) throw new Error("Invalid request");
    return d;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { error: "AI is not configured." };
    const cfg = SCHEMAS[data.kind];
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions: cfg.system,
        input: JSON.stringify(data.context).slice(0, 8000),
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
        text: { format: { type: "json_schema", name: "result", strict: true, schema: cfg.schema } },
      }),
    });
    if (!res.ok || !res.body) {
      const msg =
        res.status === 429
          ? "Too many requests — try again in a moment."
          : res.status === 402
            ? "AI credits exhausted. Add credits in Settings → Plans & credits."
            : `AI request failed (${res.status}).`;
      return { error: msg };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    let failed: string | null = null;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") text += ev.delta;
          if (ev.type === "response.failed" || ev.type === "error")
            failed = ev.response?.error?.message ?? ev.message ?? "AI failed.";
        } catch {
          /* ignore */
        }
      }
    }
    if (failed) return { error: failed };
    try {
      return { result: JSON.parse(text) as Record<string, any> };
    } catch {
      return { error: "AI returned no answer." };
    }
  });
