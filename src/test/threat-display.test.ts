import { describe, expect, it } from "vitest";
import { recommendationDisplay, threatDisplay } from "@/lib/threat-display";
import type { ThreatEvent } from "@/lib/sim";

const event: ThreatEvent = { id: 1, app: "Notion", time: "12:00", type: "permission", target: "camera", risk: 40 };

describe("Simulated threat display", () => {
  it.each([[0, "low"], [34, "low"], [35, "medium"], [69, "medium"], [70, "high"], [100, "high"]] as const)("classifies score %i as %s", (risk, severity) => {
    expect(threatDisplay({ ...event, risk }).severity).toBe(severity);
  });
  it.each([[34, "allow"], [35, "ask"], [70, "block"]] as const)("maps sample score %i to informational %s guidance", (risk, action) => {
    expect(threatDisplay({ ...event, risk }).action).toBe(action);
  });
  it("distinguishes camera and clipboard exposure", () => {
    expect(threatDisplay(event).risk).not.toBe(threatDisplay({ ...event, target: "clipboard-read" }).risk);
    expect(threatDisplay({ ...event, target: "unknown-permission" }).risk).toBeTruthy();
  });
  it.each(["allow", "ask", "block"] as const)("never exposes %s as available enforcement", (action) => {
    expect(recommendationDisplay(action).available).toBe(false);
  });
});