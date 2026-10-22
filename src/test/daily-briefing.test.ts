import { describe, expect, it } from "vitest";
import { validateAiRequest, parseAiResult } from "@/lib/ai.schemas";

const context = { simulated: true, capturedAt: "2026-10-22T02:22:00.000Z", events: [], apps: [], weeklyMinutes: {}, predictions: [] };
describe("Daily briefing boundaries", () => {
  it("accepts only explicitly simulated snapshots", () => {
    expect(validateAiRequest({ kind: "briefing", context }).kind).toBe("briefing");
    expect(() => validateAiRequest({ kind: "briefing", context: { ...context, simulated: false } })).toThrow();
  });
  it("rejects a forged user ID", () => {
    expect(() => validateAiRequest({ kind: "briefing", context, userId: "someone-else" })).toThrow();
  });
  it("requires one to three structured priorities", () => {
    const priority = { category: "security", title: "Review", observation: "Sample risk", suggestion: "Review permissions" };
    expect(parseAiResult("briefing", JSON.stringify({ summary: "Sample data", priorities: [priority] }))?.["priorities"]).toHaveLength(1);
    expect(parseAiResult("briefing", JSON.stringify({ summary: "Sample data", priorities: [] }))).toBeNull();
    expect(parseAiResult("briefing", JSON.stringify({ summary: "Sample data", priorities: Array(4).fill(priority) }))).toBeNull();
  });
  it("rejects unsupported priority categories", () => {
    expect(parseAiResult("briefing", JSON.stringify({ summary: "Sample", priorities: [{ category: "enforcement", title: "x", observation: "x", suggestion: "x" }] }))).toBeNull();
  });
});