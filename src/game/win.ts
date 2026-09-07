import {
  type Tile,
  counts,
  isHonor,
  isSuited,
  rankOf,
  removeOne,
  sortTiles,
  suitOf,
  tileText,
} from "./tiles";

export type MeldKind = "chow" | "pung" | "kong";
export type Meld = { kind: MeldKind; tiles: Tile[]; concealed: boolean };

export type Decomposition = { sets: Meld[]; pair: Tile };

/** Standard hand only: 4 sets + 1 pair (Singapore core rules, no seven pairs). */
export function decompose(concealed: Tile[], meldCount: number): Decomposition | null {
  const need = 4 - meldCount;
  const sorted = sortTiles(concealed);
  const c = counts(sorted);
  for (const pair of Object.keys(c)) {
    if ((c[pair] ?? 0) < 2) continue;
    const rest = removeOne(removeOne(sorted, pair), pair);
    const sets = takeSets(rest, need);
    if (sets) return { sets, pair };
  }
  return null;
}

function takeSets(tiles: Tile[], need: number): Meld[] | null {
  if (need === 0) return tiles.length === 0 ? [] : null;
  if (tiles.length < 3) return null;
  const sorted = sortTiles(tiles);
  const t = sorted[0]!;

  // try triplet
  if (sorted.filter((x) => x === t).length >= 3) {
    let rest = sorted;
    for (let i = 0; i < 3; i++) rest = removeOne(rest, t);
    const sub = takeSets(rest, need - 1);
    if (sub) return [{ kind: "pung", tiles: [t, t, t], concealed: true }, ...sub];
  }

  // try run
  if (isSuited(t) && rankOf(t) <= 7) {
    const s = suitOf(t);
    const b = `${s}${rankOf(t) + 1}`;
    const cc = `${s}${rankOf(t) + 2}`;
    if (sorted.includes(b) && sorted.includes(cc)) {
      const rest = removeOne(removeOne(removeOne(sorted, t), b), cc);
      const sub = takeSets(rest, need - 1);
      if (sub) return [{ kind: "chow", tiles: [t, b, cc], concealed: true }, ...sub];
    }
  }
  return null;
}

export function canWin(concealed: Tile[], melds: Meld[]): boolean {
  return decompose(concealed, melds.length) !== null;
}

/** All tiles that would complete the hand if drawn/claimed. */
export function waitingTiles(concealed: Tile[], melds: Meld[]): Tile[] {
  const candidates = new Set<Tile>();
  for (const t of concealed) {
    if (isSuited(t)) {
      const r = rankOf(t);
      const s = suitOf(t);
      for (let d = -2; d <= 2; d++) {
        const n = r + d;
        if (n >= 1 && n <= 9) candidates.add(`${s}${n}`);
      }
    } else candidates.add(t);
  }
  const out: Tile[] = [];
  for (const t of candidates) {
    if (canWin([...concealed, t], melds)) out.push(t);
  }
  return out;
}

export type ScoreContext = {
  seatWind: Tile; // "we" | "ws" | "ww" | "wn"
  roundWind: Tile;
  selfDraw: boolean;
  bonus: Tile[]; // flowers + animals collected
  seatIndex: number; // 0..3, East = 0
};

export type ScoreLine = { name: string; tai: number };
export type ScoreResult = { tai: number; lines: ScoreLine[]; capped: boolean };

export const TAI_CAP = 5;

export function scoreHand(
  concealed: Tile[],
  melds: Meld[],
  ctx: ScoreContext,
): ScoreResult | null {
  const dec = decompose(concealed, melds.length);
  if (!dec) return null;

  const allSets: Meld[] = [...melds, ...dec.sets];
  const allTiles = [...concealed, ...melds.flatMap((m) => m.tiles)];
  const lines: ScoreLine[] = [];

  // Dragon pungs
  for (const m of allSets) {
    if (m.kind !== "chow" && m.tiles[0]!.charAt(0) === "g") {
      lines.push({ name: `${tileText(m.tiles[0]!)} dragon`, tai: 1 });
    }
  }
  // Wind pungs
  for (const m of allSets) {
    if (m.kind !== "chow" && m.tiles[0]!.charAt(0) === "w") {
      if (m.tiles[0]! === ctx.seatWind) lines.push({ name: "Seat wind", tai: 1 });
      if (m.tiles[0]! === ctx.roundWind) lines.push({ name: "Round wind", tai: 1 });
    }
  }

  // All pungs
  if (allSets.every((m) => m.kind !== "chow")) lines.push({ name: "All triplets", tai: 2 });

  // Flush
  const suited = allTiles.filter(isSuited);
  const suits = new Set(suited.map(suitOf));
  const hasHonor = allTiles.some(isHonor);
  if (suits.size === 1 && !hasHonor) lines.push({ name: "Full flush", tai: 4 });
  else if (suits.size === 1 && hasHonor) lines.push({ name: "Half flush", tai: 2 });

  // Ping hu: all runs, no honours at all
  if (allSets.every((m) => m.kind === "chow") && !hasHonor && isSuited(dec.pair)) {
    lines.push({ name: "Ping hu", tai: 1 });
  }

  // Concealed hand
  if (melds.every((m) => m.concealed)) lines.push({ name: "Fully concealed", tai: 1 });

  // Self draw
  if (ctx.selfDraw) lines.push({ name: "Self-drawn", tai: 1 });

  // Bonus tiles
  const animals = ctx.bonus.filter((t) => t.charAt(0) === "a");
  for (const a of animals) lines.push({ name: `Animal (${tileText(a)})`, tai: 1 });
  const flowers = ctx.bonus.filter((t) => t.charAt(0) === "f");
  const ownFlowers = flowers.filter(
    (f) => Number(f.charAt(1)) === ctx.seatIndex + 1 || Number(f.charAt(1)) === ctx.seatIndex + 5,
  );
  for (const f of ownFlowers) lines.push({ name: `Own flower (${tileText(f)})`, tai: 1 });
  if (flowers.length === 0 && animals.length === 0) {
    lines.push({ name: "No flowers", tai: 1 });
  }

  let tai = lines.reduce((s, l) => s + l.tai, 0);
  const capped = tai > TAI_CAP;
  if (capped) tai = TAI_CAP;
  return { tai, lines, capped };
}

/** Singapore-style payout: base 1 point, doubling per tai. */
export function taiValue(tai: number): number {
  return Math.pow(2, tai);
}
