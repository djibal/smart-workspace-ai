import { z } from "zod";

// Client-safe validation for the AI function. Shared by server and tests.

export const MAX_CONTEXT_CHARS = 8000;

const appName = z.string().min(1).max(40);

const threatContext = z
  .object({
    id: z.number().int(),
    time: z.string().max(40),
    app: appName,
    type: z.enum(["network", "permission"]),
    target: z.string().min(1).max(253),
    risk: z.number().min(0).max(100),
  })
  .strict();

const workspaceContext = z
  .object({
    weeklyMinutes: z.record(appName, z.number().min(0).max(100000)),
    predictions: z
      .array(z.object({ app: appName, confidence: z.number().min(0).max(100) }).passthrough())
      .max(20),
    now: z.string().max(100),
  })
  .strict();

const resourcesContext = z
  .object({
    batterySaver: z.boolean(),
    apps: z
      .array(
        z
          .object({
            app: appName,
            state: z.enum(["active", "idle", "suspended"]),
            cpuLimit: z.number().min(0).max(100),
            ramLimit: z.number().min(0).max(8192),
            avgCpu: z.number().min(0).max(100),
            avgRam: z.number().min(0).max(8192),
          })
          .strict(),
      )
      .max(20),
  })
  .strict();

export const aiRequestSchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("briefing"), context: z.object({
      simulated: z.literal(true),
      capturedAt: z.string().datetime(),
      events: z.array(threatContext).max(40),
      apps: z.array(z.object({ app: appName, cpu: z.number().min(0).max(100), ram: z.number().min(0).max(8192), state: z.enum(["active", "idle", "suspended"]) }).strict()).max(20),
      weeklyMinutes: z.record(appName, z.number().min(0).max(100000)),
      predictions: z.array(z.object({ app: appName, confidence: z.number().min(0).max(100) }).strict()).max(20),
    }).strict() }).strict(),
    z.object({ kind: z.literal("threat"), context: threatContext }).strict(),
    z.object({ kind: z.literal("workspace"), context: workspaceContext }).strict(),
    z.object({ kind: z.literal("resources"), context: resourcesContext }).strict(),
  ])
  .refine((d) => JSON.stringify(d.context).length <= MAX_CONTEXT_CHARS, {
    message: "Request too large",
  });

export type AiRequest = z.infer<typeof aiRequestSchema>;
export type AiKind = AiRequest["kind"];

export const aiResultSchemas = {
  briefing: z.object({
    summary: z.string().min(1).max(2000),
    priorities: z.array(z.object({
      category: z.enum(["security", "workspace", "resources"]),
      title: z.string().min(1).max(120),
      observation: z.string().min(1).max(600),
      suggestion: z.string().min(1).max(600),
    }).strict()).min(1).max(3),
  }).strict(),
  threat: z.object({
    verdict: z.enum(["safe", "suspicious", "malicious"]),
    action: z.enum(["allow", "ask", "block"]),
    explanation: z.string().min(1).max(2000),
    confidence: z.number().min(0).max(100),
  }),
  workspace: z.object({
    summary: z.string().min(1).max(2000),
    tips: z.array(z.string().min(1).max(500)).min(1).max(10),
  }),
  resources: z.object({
    summary: z.string().min(1).max(2000),
    suggestions: z
      .array(
        z.object({
          app: appName,
          ramLimit: z.number().min(64).max(2048),
          cpuLimit: z.number().min(5).max(100),
          reason: z.string().min(1).max(500),
        }),
      )
      .max(20),
  }),
} as const;

export function validateAiRequest(input: unknown): AiRequest {
  const r = aiRequestSchema.safeParse(input);
  if (!r.success) throw new Error("Invalid AI request.");
  return r.data;
}

/** Parse raw model text and validate it; returns null when invalid. */
export function parseAiResult(kind: AiKind, text: string): Record<string, any> | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  const r = aiResultSchemas[kind].safeParse(raw);
  return r.success ? (r.data as Record<string, any>) : null;
}
