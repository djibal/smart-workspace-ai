import { describe, expect, it } from "vitest";
import { buildCards, filterCards } from "@/lib/workspace-filter";

const apps = ["Notion", "Figma", "Gmail", "Slack", "Linear"];
const usage = { Notion: [[10, 20]], Figma: [[5]], Gmail: [], Slack: [[1]], Linear: [[2]] };
const preds = [
  { app: "Figma", confidence: 60 }, { app: "Notion", confidence: 40 },
  { app: "Slack", confidence: 20 }, { app: "Gmail", confidence: 10 }, { app: "Linear", confidence: 5 },
];
const cards = buildCards(apps, usage, preds);

describe("workspace filter", () => {
  it("top two predictions would pre-load, next two would queue, rest none", () => {
    const s = Object.fromEntries(cards.map((c) => [c.app, c.status]));
    expect(s).toEqual({ Figma: "preload", Notion: "preload", Slack: "queue", Gmail: "queue", Linear: "none" });
  });
  it("sums weekly minutes", () => {
    expect(cards.find((c) => c.app === "Notion")!.weeklyMinutes).toBe(30);
  });
  it("search is case-insensitive and trimmed", () => {
    expect(filterCards(cards, "  NOT ", "all").map((c) => c.app)).toEqual(["Notion"]);
  });
  it("status filter combines with search", () => {
    expect(filterCards(cards, "i", "preload").map((c) => c.app)).toEqual(["Notion", "Figma"]);
    expect(filterCards(cards, "gmail", "preload")).toEqual([]);
  });
  it("reset (empty query, all) returns every card", () => {
    expect(filterCards(cards, "", "all")).toHaveLength(5);
  });
});
