import {
  type Tile,
  buildWall,
  isBonus,
  isHonor,
  isSuited,
  rankOf,
  removeOne,
  sortTiles,
  suitOf,
} from "./tiles";
import { type Meld, canWin, scoreHand, taiValue, type ScoreResult } from "./win";
import { WINDS } from "./tiles";

export type Player = {
  index: number;
  name: string;
  isHuman: boolean;
  hand: Tile[];
  melds: Meld[];
  bonus: Tile[];
  discards: Tile[];
  score: number;
};

export type ClaimKind = "win" | "kong" | "pung" | "chow";
export type Claim = { player: number; kind: ClaimKind; tiles?: Tile[] };

export type Phase =
  | "human-turn" // human has drawn, must discard (may declare win)
  | "human-claim" // a discard is on the table, human may claim
  | "ai" // bots are acting
  | "over";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type GameSetup = { humanCount: number; difficulty: Difficulty };

export const DEFAULT_SETUP: GameSetup = { humanCount: 1, difficulty: "intermediate" };

export type GameState = {
  wall: Tile[];
  drawIdx: number;
  backIdx: number;
  setup: GameSetup;
  players: Player[];
  turn: number;
  phase: Phase;
  roundWind: Tile;
  lastDiscard: { tile: Tile; from: number } | null;
  /** Seat currently being offered the discard (only when phase is "human-claim"). */
  claimSeat: number | null;
  humanClaims: Claim[];
  humanCanWinOnDraw: boolean;
  log: string[];
  result: {
    kind: "win" | "draw";
    winner?: number | undefined;
    from?: number | undefined;
    score?: ScoreResult | undefined;
    points?: number | undefined;
  } | null;
};

export const BOT_NAMES = ["Bao", "Mei", "Wei", "Lin"];
export const SEAT_LABELS = ["East", "South", "West", "North"];


export function seatWind(index: number): Tile {
  return WINDS[index]!;
}

function pushLog(s: GameState, msg: string) {
  s.log = [msg, ...s.log].slice(0, 40);
}

export function wallRemaining(s: GameState) {
  return s.backIdx - s.drawIdx + 1;
}

export function newGame(
  scores: number[] = [0, 0, 0, 0],
  setup: GameSetup = DEFAULT_SETUP,
): GameState {
  const humanCount = Math.min(4, Math.max(1, Math.round(setup.humanCount)));
  const wall = buildWall();
  let botN = 0;
  const s: GameState = {
    wall,
    drawIdx: 0,
    backIdx: wall.length - 1,
    setup: { humanCount, difficulty: setup.difficulty },
    players: [0, 1, 2, 3].map((i) => {
      const isHuman = i < humanCount;
      return {
        index: i,
        name: isHuman
          ? humanCount === 1
            ? "You"
            : `Player ${i + 1}`
          : BOT_NAMES[botN++]!,
        isHuman,
        hand: [],
        melds: [],
        bonus: [],
        discards: [],
        score: scores[i] ?? 0,
      };
    }),
    turn: 0,
    phase: "ai",
    roundWind: "we",
    lastDiscard: null,
    claimSeat: null,
    humanClaims: [],
    humanCanWinOnDraw: false,
    log: [],
    result: null,
  };

  for (let round = 0; round < 13; round++) {
    for (const p of s.players) p.hand.push(s.wall[s.drawIdx++]!);
  }
  for (const p of s.players) replaceBonus(s, p);
  for (const p of s.players) p.hand = sortTiles(p.hand);

  pushLog(
    s,
    `New game — ${humanCount} human ${humanCount === 1 ? "player" : "players"}, ${4 - humanCount} computer ${4 - humanCount === 1 ? "player" : "players"} (${setup.difficulty}). Round wind: East.`,
  );
  return s;
}

function drawFromBack(s: GameState): Tile | null {
  if (wallRemaining(s) <= 0) return null;
  return s.wall[s.backIdx--]!;
}

function replaceBonus(s: GameState, p: Player) {
  let guard = 0;
  while (guard++ < 20) {
    const bonusIdx = p.hand.findIndex(isBonus);
    if (bonusIdx < 0) break;
    const t = p.hand[bonusIdx]!;
    p.hand.splice(bonusIdx, 1);
    p.bonus.push(t);
    const rep = drawFromBack(s);
    if (rep === null) break;
    p.hand.push(rep);
  }
}

/** Draw a tile for the player whose turn it is. Returns the tile, or null if wall is out. */
export function drawTile(s: GameState, pi: number): Tile | null {
  if (wallRemaining(s) <= 0) {
    endDraw(s);
    return null;
  }
  const p = s.players[pi]!;
  let tile: Tile = s.wall[s.drawIdx++]!;
  let guard = 0;
  while (isBonus(tile) && guard++ < 20) {
    p.bonus.push(tile);
    const rep = drawFromBack(s);
    if (rep === null) {
      endDraw(s);
      return null;
    }
    tile = rep;
  }
  p.hand.push(tile);
  p.hand = sortTiles(p.hand);
  return tile;
}

function endDraw(s: GameState) {
  s.phase = "over";
  s.result = { kind: "draw" };
  pushLog(s, "Wall exhausted — washout. No one wins.");
}

export function declareWin(s: GameState, pi: number, selfDraw: boolean, from?: number) {
  const p = s.players[pi]!;
  const score = scoreHand(p.hand, p.melds, {
    seatWind: seatWind(pi),
    roundWind: s.roundWind,
    selfDraw,
    bonus: p.bonus,
    seatIndex: pi,
  });
  if (!score) return false;
  const points = taiValue(score.tai);
  if (selfDraw) {
    for (const o of s.players) {
      if (o.index === pi) continue;
      o.score -= points;
      p.score += points;
    }
  } else if (from !== undefined) {
    s.players[from]!.score -= points * 3;
    p.score += points * 3;
  }
  s.phase = "over";
  s.result = { kind: "win", winner: pi, from: selfDraw ? undefined : from, score, points };
  pushLog(
    s,
    `${p.name} ${selfDraw ? "self-drew" : `won off ${s.players[from!]!.name}`} — ${score.tai} tai.`,
  );
  return true;
}

export function discard(s: GameState, pi: number, tile: Tile) {
  const p = s.players[pi]!;
  p.hand = removeOne(p.hand, tile);
  p.discards.push(tile);
  s.lastDiscard = { tile, from: pi };
  pushLog(s, `${p.name === "You" ? "You discard" : `${p.name} discards`} ${tile}.`);
}

/** All claims available to a player for the tile currently on the table. */
export function claimsFor(s: GameState, pi: number): Claim[] {
  const d = s.lastDiscard;
  if (!d || d.from === pi) return [];
  const p = s.players[pi]!;
  const out: Claim[] = [];
  const n = p.hand.filter((t) => t === d.tile).length;

  if (canWin([...p.hand, d.tile], p.melds)) out.push({ player: pi, kind: "win" });
  if (n >= 3) out.push({ player: pi, kind: "kong", tiles: [d.tile, d.tile, d.tile] });
  if (n >= 2) out.push({ player: pi, kind: "pung", tiles: [d.tile, d.tile] });

  const isNext = (d.from + 1) % 4 === pi;
  if (isNext && isSuited(d.tile)) {
    const s0 = suitOf(d.tile);
    const r = rankOf(d.tile);
    const combos: [number, number][] = [
      [r - 2, r - 1],
      [r - 1, r + 1],
      [r + 1, r + 2],
    ];
    for (const [a, b] of combos) {
      if (a < 1 || b > 9) continue;
      const ta = `${s0}${a}`;
      const tb = `${s0}${b}`;
      if (p.hand.includes(ta) && p.hand.includes(tb)) {
        out.push({ player: pi, kind: "chow", tiles: [ta, tb] });
      }
    }
  }
  return out;
}

const PRIORITY: Record<ClaimKind, number> = { win: 3, kong: 2, pung: 2, chow: 1 };

export function applyClaim(s: GameState, claim: Claim): void {
  const d = s.lastDiscard!;
  const p = s.players[claim.player]!;
  if (claim.kind === "win") {
    p.hand = sortTiles([...p.hand, d.tile]);
    s.players[d.from]!.discards.pop();
    declareWin(s, claim.player, false, d.from);
    return;
  }
  s.players[d.from]!.discards.pop();
  const used = claim.tiles ?? [];
  for (const t of used) p.hand = removeOne(p.hand, t);
  const kind = claim.kind === "kong" ? "kong" : claim.kind === "pung" ? "pung" : "chow";
  p.melds.push({ kind, tiles: sortTiles([...used, d.tile]), concealed: false });
  p.hand = sortTiles(p.hand);
  pushLog(s, `${p.name === "You" ? "You call" : `${p.name} calls`} ${kind} on ${d.tile}.`);
  s.lastDiscard = null;
  s.turn = claim.player;
  if (kind === "kong") {
    // kong draws a replacement tile
    const t = drawTile(s, claim.player);
    if (t !== null && canWin(p.hand, p.melds) && !p.isHuman) {
      declareWin(s, claim.player, true);
    }
  }
}

/** Best claim among the computer players (humans handled separately). */
export function botClaim(s: GameState): Claim | null {
  let best: Claim | null = null;
  for (const p of s.players) {
    if (p.isHuman) continue;
    for (const c of claimsFor(s, p.index)) {
      if (!botWantsClaim(s, c)) continue;
      if (!best || PRIORITY[c.kind] > PRIORITY[best.kind]) best = c;
    }
  }
  return best;
}

function botWantsClaim(s: GameState, c: Claim): boolean {
  if (c.kind === "win") return true;
  const tile = s.lastDiscard!.tile;
  const level = s.setup.difficulty;

  if (c.kind === "kong") return level === "beginner" ? Math.random() < 0.8 : true;

  if (c.kind === "pung") {
    if (level === "beginner") return Math.random() < 0.5;
    if (level === "intermediate") return isHonor(tile) ? Math.random() < 0.85 : Math.random() < 0.55;
    // advanced: pung honours and terminals eagerly, middle tiles only when it keeps shape
    if (isHonor(tile)) return true;
    return rankOf(tile) <= 2 || rankOf(tile) >= 8 ? Math.random() < 0.8 : Math.random() < 0.45;
  }

  // chow
  if (level === "beginner") return Math.random() < 0.5;
  if (level === "intermediate") return Math.random() < 0.3;
  const p = s.players[c.player]!;
  return p.melds.length > 0 ? Math.random() < 0.35 : Math.random() < 0.15;
}

export function comparePriority(a: Claim, b: Claim) {
  return PRIORITY[a.kind] - PRIORITY[b.kind];
}

/** Heuristic tile value — bots discard the lowest-scoring tile. */
export function tileValue(hand: Tile[], t: Tile): number {
  const copies = hand.filter((x) => x === t).length;
  let v = copies * 4;
  if (isSuited(t)) {
    const s0 = suitOf(t);
    const r = rankOf(t);
    for (const d of [-2, -1, 1, 2]) {
      const n = r + d;
      if (n < 1 || n > 9) continue;
      if (hand.includes(`${s0}${n}`)) v += Math.abs(d) === 1 ? 3 : 1;
    }
    v += 4 - Math.abs(5 - r) * 0.4;
  } else {
    v += copies >= 2 ? 3 : 0;
  }
  return v;
}

export function botDiscard(s: GameState, pi: number): Tile {
  const p = s.players[pi]!;
  const level = s.setup.difficulty;

  const ranked = p.hand
    .map((t) => {
      let v = tileValue(p.hand, t);
      if (level === "advanced") {
        // safer to throw a tile the table has already seen; keep honours we hold in pairs
        const seen = s.players.reduce(
          (n, o) => n + o.discards.filter((d) => d === t).length,
          0,
        );
        v -= seen * 1.5;
        if (isHonor(t) && p.hand.filter((x) => x === t).length === 1) v -= 1;
      }
      return { t, v };
    })
    .sort((a, b) => a.v - b.v);

  if (level === "beginner") {
    // sometimes throws away a perfectly good tile
    const pool = ranked.slice(0, Math.min(4, ranked.length));
    if (Math.random() < 0.25) return p.hand[Math.floor(Math.random() * p.hand.length)]!;
    return pool[Math.floor(Math.random() * pool.length)]!.t;
  }
  if (level === "intermediate" && Math.random() < 0.15) {
    return ranked[Math.min(1, ranked.length - 1)]!.t;
  }
  return ranked[0]!.t;
}

export function nextTurn(s: GameState) {
  s.turn = (s.turn + 1) % 4;
}
