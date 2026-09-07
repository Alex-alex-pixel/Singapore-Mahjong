export type Suit = "c" | "b" | "d" | "w" | "g" | "f" | "a";

/**
 * Tile ids:
 *  c1..c9  characters (wan)
 *  b1..b9  bamboo
 *  d1..d9  dots
 *  we ws ww wn  winds (East South West North)
 *  gr gg gw     dragons (Red, Green, White)
 *  f1..f8       flowers / seasons
 *  a1..a4       animals (cat, mouse, rooster, centipede)
 */
export type Tile = string;

export const SUITS: Suit[] = ["c", "b", "d"];
export const WINDS: Tile[] = ["we", "ws", "ww", "wn"];
export const DRAGONS: Tile[] = ["gr", "gg", "gw"];

export const TILE_LABEL: Record<string, string> = {
  we: "East",
  ws: "South",
  ww: "West",
  wn: "North",
  gr: "Red",
  gg: "Green",
  gw: "White",
  f1: "Plum",
  f2: "Orchid",
  f3: "Chrys",
  f4: "Bamboo",
  f5: "Spring",
  f6: "Summer",
  f7: "Autumn",
  f8: "Winter",
  a1: "Cat",
  a2: "Mouse",
  a3: "Rooster",
  a4: "Worm",
};

export const SUIT_MARK: Record<string, string> = {
  c: "万",
  b: "条",
  d: "筒",
};

export function isSuited(t: Tile) {
  const s = t.charAt(0);
  return s === "c" || s === "b" || s === "d";
}
export function isHonor(t: Tile) {
  const s = t.charAt(0);
  return s === "w" || s === "g";
}
export function isBonus(t: Tile) {
  const s = t.charAt(0);
  return s === "f" || s === "a";
}
export function suitOf(t: Tile) {
  return t.charAt(0);
}
export function rankOf(t: Tile) {
  return Number(t.charAt(1));
}

export function tileText(t: Tile): string {
  if (isSuited(t)) return `${rankOf(t)}${SUIT_MARK[suitOf(t)] ?? ""}`;
  return TILE_LABEL[t] ?? t;
}

/** Sort key so hands display grouped by suit then rank. */
const ORDER: Record<string, number> = { c: 0, b: 1, d: 2, w: 3, g: 4, f: 5, a: 6 };
export function sortTiles(tiles: Tile[]): Tile[] {
  return [...tiles].sort((x, y) => {
    const o = (ORDER[x.charAt(0)] ?? 9) - (ORDER[y.charAt(0)] ?? 9);
    if (o !== 0) return o;
    return x.localeCompare(y);
  });
}

/** A full Singapore set: 136 suit/honour tiles + 8 flowers + 4 animals = 148. */
export function buildWall(): Tile[] {
  const wall: Tile[] = [];
  for (const s of SUITS) {
    for (let r = 1; r <= 9; r++) {
      for (let i = 0; i < 4; i++) wall.push(`${s}${r}`);
    }
  }
  for (const h of [...WINDS, ...DRAGONS]) {
    for (let i = 0; i < 4; i++) wall.push(h);
  }
  for (let i = 1; i <= 8; i++) wall.push(`f${i}`);
  for (let i = 1; i <= 4; i++) wall.push(`a${i}`);
  return shuffle(wall);
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

export function counts(tiles: Tile[]): Record<Tile, number> {
  const m: Record<Tile, number> = {};
  for (const t of tiles) m[t] = (m[t] ?? 0) + 1;
  return m;
}

export function removeOne(tiles: Tile[], tile: Tile): Tile[] {
  const i = tiles.indexOf(tile);
  if (i < 0) return [...tiles];
  const copy = [...tiles];
  copy.splice(i, 1);
  return copy;
}
