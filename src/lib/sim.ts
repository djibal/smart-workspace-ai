import { useEffect, useState } from "react";

export const APPS = ["Notion", "Figma", "Gmail", "Slack", "Linear", "Spotify"] as const;
export type AppName = (typeof APPS)[number];

export type ThreatEvent = {
  id: number;
  time: string;
  app: AppName;
  type: "network" | "permission";
  target: string;
  risk: number;
};

const TARGETS = {
  network: [
    ["api.notion.com", 4], ["figma-cdn.net", 8], ["mail.google.com", 3], ["slack-edge.com", 6],
    ["trk.adnexus-pixel.io", 62], ["cdn.jsdelivr.net", 12], ["xn--gmal-5qa.com", 91],
    ["telemetry.unknown-host.ru", 84], ["api.linear.app", 3], ["fingerprintjs.pro", 55],
  ],
  permission: [
    ["camera", 40], ["microphone", 38], ["clipboard-read", 66], ["geolocation", 48],
    ["notifications", 10], ["screen-capture", 72], ["usb-device", 80],
  ],
} as const;

let seq = 0;
function makeEvent(): ThreatEvent {
  const type = Math.random() < 0.7 ? "network" : "permission";
  const list = TARGETS[type];
  const [target, base] = list[Math.floor(Math.random() * list.length)]! as readonly [string, number];
  return {
    id: ++seq,
    time: new Date().toLocaleTimeString(),
    app: APPS[Math.floor(Math.random() * APPS.length)]!,
    type,
    target,
    risk: Math.max(0, Math.min(100, Math.round(base + (Math.random() - 0.5) * 14))),
  };
}

export function riskLevel(r: number) {
  return r >= 70 ? "high" : r >= 35 ? "medium" : "low";
}

export function useThreatFeed() {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  useEffect(() => {
    setEvents(Array.from({ length: 8 }, makeEvent));
    const t = setInterval(() => setEvents((e) => [makeEvent(), ...e].slice(0, 40)), 2200);
    return () => clearInterval(t);
  }, []);
  return events;
}

export type AppRes = {
  app: AppName;
  cpu: number;
  ram: number;
  cpuLimit: number;
  ramLimit: number;
  state: "active" | "idle" | "suspended";
  history: { t: number; cpu: number; ram: number }[];
};

const BASE: Record<AppName, [number, number]> = {
  Notion: [12, 320], Figma: [34, 780], Gmail: [6, 210], Slack: [9, 290], Linear: [5, 160], Spotify: [3, 140],
};

export function useResources() {
  const [apps, setApps] = useState<AppRes[]>(() =>
    APPS.map((app) => ({
      app, cpu: BASE[app][0], ram: BASE[app][1], cpuLimit: 50, ramLimit: 1024,
      state: "active", history: [],
    })),
  );
  const [eco, setEco] = useState(false);
  useEffect(() => {
    let t = 0;
    const id = setInterval(() => {
      t++;
      setApps((list) =>
        list.map((a) => {
          if (a.state === "suspended") return { ...a, cpu: 0, ram: Math.round(BASE[a.app][1] * 0.15), history: [...a.history, { t, cpu: 0, ram: Math.round(BASE[a.app][1] * 0.15) }].slice(-30) };
          const factor = eco ? 0.7 : 1;
          const cpu = Math.min(a.cpuLimit, Math.max(0, Math.round((BASE[a.app][0] + (Math.random() - 0.4) * BASE[a.app][0]) * factor)));
          const ram = Math.min(a.ramLimit, Math.round(BASE[a.app][1] * factor + (Math.random() - 0.5) * 60));
          const state: AppRes["state"] = cpu < 3 ? "idle" : "active";
          return { ...a, cpu, ram, state, history: [...a.history, { t, cpu, ram }].slice(-30) };
        }),
      );
    }, 1500);
    return () => clearInterval(id);
  }, [eco]);
  const update = (app: AppName, patch: Partial<AppRes>) =>
    setApps((l) => l.map((a) => (a.app === app ? { ...a, ...patch } : a)));
  return { apps, eco, setEco, update };
}

// Weekly usage minutes [day][hourBlock(0..5 = 4h blocks)]
export const USAGE: Record<AppName, number[][]> = Object.fromEntries(
  APPS.map((app, i) => [
    app,
    Array.from({ length: 7 }, (_, d) =>
      Array.from({ length: 6 }, (_, h) => {
        const work = d < 5 && h >= 2 && h <= 4;
        const seed = Math.sin((i + 1) * (d + 3) * (h + 7)) * 10000;
        const r = seed - Math.floor(seed);
        return Math.round((work ? 40 : 6) * (0.4 + r) * (app === "Spotify" ? (work ? 0.6 : 2) : 1));
      }),
    ),
  ]),
) as Record<AppName, number[][]>;

export function predictions() {
  const hour = new Date().getHours();
  const block = Math.floor(hour / 4);
  const day = (new Date().getDay() + 6) % 7;
  const scores = APPS.map((app) => ({ app, score: USAGE[app][day]![Math.min(5, block + 1)] ?? 0 }));
  const total = scores.reduce((s, x) => s + x.score, 0) || 1;
  return scores
    .map((s) => ({ app: s.app, confidence: Math.round((s.score / total) * 100 * 2.2) }))
    .map((s) => ({ ...s, confidence: Math.min(97, s.confidence) }))
    .sort((a, b) => b.confidence - a.confidence);
}
