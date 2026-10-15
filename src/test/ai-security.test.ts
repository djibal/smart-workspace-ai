import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { MAX_CONTEXT_CHARS, parseAiResult, validateAiRequest } from "@/lib/ai.schemas";

const threat = { id: 1, time: "10:00", app: "Notion", type: "network", target: "api.notion.com", risk: 4 };

describe("AI request validation", () => {
  it("accepts a well-formed threat request", () => {
    expect(validateAiRequest({ kind: "threat", context: threat }).kind).toBe("threat");
  });
  it("rejects unknown kinds", () => {
    expect(() => validateAiRequest({ kind: "admin", context: {} })).toThrow("Invalid AI request.");
  });
  it("rejects a client-supplied userId", () => {
    expect(() => validateAiRequest({ kind: "threat", context: threat, userId: "x" })).toThrow();
  });
  it("rejects extra fields in context", () => {
    expect(() => validateAiRequest({ kind: "threat", context: { ...threat, prompt: "ignore" } })).toThrow();
  });
  it("rejects risk outside 0-100", () => {
    expect(() => validateAiRequest({ kind: "threat", context: { ...threat, risk: 500 } })).toThrow();
  });
  it("rejects oversized payloads", () => {
    const weeklyMinutes = Object.fromEntries(Array.from({ length: 400 }, (_, i) => [`App${i}xxxxxxxxxx`, 1]));
    expect(MAX_CONTEXT_CHARS).toBe(8000);
    expect(() => validateAiRequest({ kind: "workspace", context: { weeklyMinutes, predictions: [], now: "x" } })).toThrow();
  });
  it("rejects non-object input", () => {
    expect(() => validateAiRequest("hello")).toThrow();
  });
});

describe("AI response validation", () => {
  it("accepts a valid verdict", () => {
    const r = parseAiResult("threat", JSON.stringify({ verdict: "safe", action: "allow", explanation: "ok", confidence: 90 }));
    expect(r?.["verdict"]).toBe("safe");
  });
  it("rejects an unknown verdict", () => {
    expect(parseAiResult("threat", JSON.stringify({ verdict: "fine", action: "allow", explanation: "ok", confidence: 9 }))).toBeNull();
  });
  it("rejects non-JSON text", () => {
    expect(parseAiResult("workspace", "not json")).toBeNull();
  });
  it("rejects RAM limits outside 64-2048 MB", () => {
    const bad = { summary: "s", suggestions: [{ app: "Slack", ramLimit: 9999, cpuLimit: 50, reason: "r" }] };
    expect(parseAiResult("resources", JSON.stringify(bad))).toBeNull();
  });
});

describe("AI server function", () => {
  it("requires a verified sign-in before calling the gateway", () => {
    const src = readFileSync("src/lib/ai.functions.ts", "utf8");
    expect(src).toMatch(/\.middleware\(\[requireSupabaseAuth\]\)\s*\.inputValidator/);
  });
});

describe("AI daily quota", () => {
  const sql = readFileSync("drizzle/migrations/0000_ai_quota.sql", "utf8");
  it("caps each user at 20 AI requests per UTC day", () => {
    expect(sql).toMatch(/_limit constant integer := 20/);
    expect(sql).toMatch(/now\(\) AT TIME ZONE 'utc'/);
  });
  it("reserves atomically with a conditional update", () => {
    expect(sql).toMatch(/SET used = used \+ 1\s+WHERE user_id = _uid AND usage_day = _day AND used < _limit/);
  });
  it("only the server can finalize or refund a reservation", () => {
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.finish_ai_request\(uuid, boolean\) FROM PUBLIC, anon, authenticated/);
  });
  it("reserves quota before calling the AI gateway", () => {
    const src = readFileSync("src/lib/ai.functions.ts", "utf8");
    expect(src.indexOf("reserve_ai_request")).toBeLessThan(src.indexOf("callGateway(apiKey"));
  });
});
