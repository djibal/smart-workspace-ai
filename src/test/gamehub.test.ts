import { describe, expect, it } from "vitest";
import { approvedDestination, filterGames, GAMES } from "@/lib/gamehub";

describe("GameHub catalog", () => {
  it("searches names and publishers ignoring case and outer spaces", () => {
    expect(filterGames(GAMES, "  LICHESS  ", "all").map((g) => g.id)).toEqual(["lichess"]);
    expect(filterGames(GAMES, "cirulli", "all").map((g) => g.id)).toEqual(["2048"]);
  });
  it("combines category and search", () => {
    expect(filterGames(GAMES, "", "Puzzle").map((g) => g.id)).toEqual(["2048", "hextris"]);
    expect(filterGames(GAMES, "lichess", "Puzzle")).toEqual([]);
  });
  it("returns all games after filters are reset", () => {
    expect(filterGames(GAMES, "", "all")).toEqual(GAMES);
  });
  it("allows only exact curated HTTPS destinations", () => {
    expect(approvedDestination("https://lichess.org/")).toBe(true);
    expect(approvedDestination("https://www.apple.com/apple-arcade/")).toBe(true);
    expect(approvedDestination("http://lichess.org/")).toBe(false);
    expect(approvedDestination("https://lichess.org.evil.example/")).toBe(false);
    expect(approvedDestination("javascript:alert(1)")).toBe(false);
    expect(approvedDestination("https://lichess.org/?redirect=evil")).toBe(false);
  });
});
