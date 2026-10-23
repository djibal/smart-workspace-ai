export type GameCategory = "Puzzle" | "Strategy" | "Arcade";
export type Game = { id: string; name: string; publisher: string; category: GameCategory; description: string; url: string; note: string };

// Curated destinations only: no user-entered URLs, embeds, or native commands.
export const GAMES: readonly Game[] = [
  { id: "2048", name: "2048", publisher: "Gabriele Cirulli", category: "Puzzle", description: "Slide, combine, and work your way to the 2048 tile.", url: "https://play2048.co/", note: "A single-player puzzle. The publisher’s site may show advertising." },
  { id: "lichess", name: "Lichess", publisher: "Lichess", category: "Strategy", description: "Play chess, solve puzzles, or challenge a friend.", url: "https://lichess.org/", note: "Online play connects to other players. Some features need an account." },
  { id: "tetrio", name: "TETR.IO", publisher: "osk", category: "Arcade", description: "A fast-paced falling-block game with solo and online modes.", url: "https://tetr.io/", note: "Online modes and account features are managed by the publisher." },
  { id: "hextris", name: "Hextris", publisher: "Hextris contributors", category: "Puzzle", description: "Rotate the hexagon and match falling colours.", url: "https://hextris.io/", note: "A single-player arcade puzzle on the project’s official website." },
];
export const MOBILE_DESTINATIONS = [
  { id: "android", name: "Google Play Games", description: "Browse official Android game listings.", url: "https://play.google.com/store/apps/category/GAME", note: "Installation happens through Google Play on a compatible device. Availability and prices vary." },
  { id: "ios", name: "Apple Arcade", description: "Explore Apple’s game catalogue for iPhone and iPad.", url: "https://www.apple.com/apple-arcade/", note: "Apple Arcade is a subscription service. Games require a compatible Apple device." },
] as const;
export function filterGames(games: readonly Game[], query: string, category: string) {
  const normalized = query.trim().toLowerCase();
  return games.filter((game) => (category === "all" || game.category === category) && `${game.name} ${game.publisher} ${game.description}`.toLowerCase().includes(normalized));
}
export function approvedDestination(url: string): boolean {
  return [...GAMES, ...MOBILE_DESTINATIONS].some((entry) => entry.url === url && new URL(url).protocol === "https:");
}
export const GAMEHUB_NOTICE = "Security demonstrations elsewhere use sample data. GameHub links open real third-party websites; AegisDesk does not isolate, scan, block or limit games on your device.";
export type CustomGameUrlResult = { ok: true; url: string; host: string } | { ok: false; error: string };
const PRIVATE_HOST = /^(localhost|.*\.localhost|.*\.local|.*\.internal|.*\.home\.arpa)$/i;
const IP_HOST = /^(\d{1,3}(\.\d{1,3}){3}|\[.*\])$/;

// Validates a visitor-entered game link before it is shown in the sandboxed player.
export function parseCustomGameUrl(input: string, appHost?: string): CustomGameUrlResult {
  const raw = input.trim();
  if (!raw) return { ok: false, error: "Enter a game link." };
  if (raw.length > 2048) return { ok: false, error: "That link is too long." };
  let url: URL;
  try { url = new URL(raw); } catch { return { ok: false, error: "Enter a full link starting with https://" }; }
  if (url.protocol !== "https:") return { ok: false, error: "Only secure links starting with https:// can be played." };
  if (url.username || url.password) return { ok: false, error: "Links containing sign-in details are not allowed." };
  const host = url.hostname.toLowerCase();
  if (!host.includes(".") || PRIVATE_HOST.test(host) || IP_HOST.test(host)) return { ok: false, error: "Use a public website address, not a local or numeric address." };
  if (appHost && host === appHost.toLowerCase()) return { ok: false, error: "AegisDesk pages cannot be opened as games." };
  return { ok: true, url: url.href, host };
}
