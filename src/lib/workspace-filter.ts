export type WorkspaceStatus = "preload" | "queue" | "none";
export type WorkspaceCard = { app: string; weeklyMinutes: number; confidence: number; status: WorkspaceStatus };
export type StatusFilter = "all" | WorkspaceStatus;

/** Builds cards from sample usage + predictions. Top 2 predictions "would pre-load", next 2 "would queue". */
export function buildCards(
  apps: readonly string[],
  usage: Record<string, number[][]>,
  preds: { app: string; confidence: number }[],
): WorkspaceCard[] {
  return apps.map((app) => {
    const rank = preds.findIndex((p) => p.app === app);
    const status: WorkspaceStatus = rank >= 0 && rank < 2 ? "preload" : rank >= 2 && rank < 4 ? "queue" : "none";
    return {
      app,
      weeklyMinutes: (usage[app] ?? []).flat().reduce((s, x) => s + x, 0),
      confidence: rank >= 0 ? preds[rank]!.confidence : 0,
      status,
    };
  });
}

export function filterCards(cards: WorkspaceCard[], query: string, status: StatusFilter): WorkspaceCard[] {
  const q = query.trim().toLowerCase().slice(0, 100);
  return cards.filter((c) => (status === "all" || c.status === status) && (!q || c.app.toLowerCase().includes(q)));
}
