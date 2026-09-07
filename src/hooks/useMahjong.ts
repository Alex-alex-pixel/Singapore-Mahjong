import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_SETUP,
  type Claim,
  type GameSetup,
  type GameState,
  applyClaim,
  botClaim,
  botDiscard,
  claimsFor,
  declareWin,
  discard,
  drawTile,
  newGame,
  nextTurn,
} from "../game/engine";
import { canWin } from "../game/win";
import type { Tile } from "../game/tiles";

const SPEED = 650;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const RANK: Record<Claim["kind"], number> = { win: 3, kong: 2, pung: 2, chow: 1 };

export function useMahjong(setup: GameSetup = DEFAULT_SETUP) {
  const stateRef = useRef<GameState>(newGame([0, 0, 0, 0], setup));
  const [, setTick] = useState(0);
  const runningRef = useRef(false);
  /** Human seats still to be offered the current discard, best claim first. */
  const pendingRef = useRef<number[]>([]);
  const render = useCallback(() => setTick((t) => t + 1), []);

  /** Offer the discard to the next waiting human seat. Returns true if someone was asked. */
  const offerNextHuman = useCallback(() => {
    const s = stateRef.current;
    while (pendingRef.current.length) {
      const seat = pendingRef.current.shift()!;
      const claims = claimsFor(s, seat);
      if (!claims.length) continue;
      s.claimSeat = seat;
      s.humanClaims = claims;
      s.phase = "human-claim";
      render();
      return true;
    }
    s.claimSeat = null;
    s.humanClaims = [];
    return false;
  }, [render]);

  const queueHumanClaims = useCallback(() => {
    const s = stateRef.current;
    pendingRef.current = s.players
      .filter((p) => p.isHuman && claimsFor(s, p.index).length > 0)
      .map((p) => ({
        seat: p.index,
        rank: Math.max(...claimsFor(s, p.index).map((c) => RANK[c.kind])),
      }))
      .sort((a, b) => b.rank - a.rank)
      .map((x) => x.seat);
  }, []);

  /** Runs computer actions until a human must move (or the hand ends). */
  const run = useCallback(
    async (opts: { skipDrawFor?: number } = {}) => {
      if (runningRef.current) return;
      runningRef.current = true;
      const s = stateRef.current;
      let skipDraw = opts.skipDrawFor;

      try {
        for (let guard = 0; guard < 400; guard++) {
          if (s.phase === "over") return;
          const pi = s.turn;
          const p = s.players[pi]!;

          if (p.isHuman) {
            if (skipDraw !== pi) {
              await sleep(SPEED / 2);
              const t = drawTile(s, pi);
              if (t === null) return render();
            }
            skipDraw = undefined;
            s.humanCanWinOnDraw = canWin(p.hand, p.melds);
            s.phase = "human-turn";
            render();
            return;
          }

          if (skipDraw !== pi) {
            await sleep(SPEED);
            const t = drawTile(s, pi);
            if (t === null) return render();
            render();
            if (canWin(p.hand, p.melds)) {
              declareWin(s, pi, true);
              render();
              return;
            }
          }
          skipDraw = undefined;

          await sleep(SPEED);
          discard(s, pi, botDiscard(s, pi));
          render();
          await sleep(SPEED / 2);

          // humans get first refusal, in claim-priority order
          queueHumanClaims();
          if (offerNextHuman()) return;

          const bc = botClaim(s);
          if (bc) {
            applyClaim(s, bc);
            render();
            if ((s.phase as string) === "over") return;
            skipDraw = bc.player;
            continue;
          }

          s.lastDiscard = null;
          nextTurn(s);
        }
      } finally {
        runningRef.current = false;
      }
    },
    [render, offerNextHuman, queueHumanClaims],
  );

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Nobody (human or bot) took the discard — move play along. */
  const resolveAfterHumans = useCallback(() => {
    const s = stateRef.current;
    if (offerNextHuman()) return;
    const bc = botClaim(s);
    if (bc) {
      applyClaim(s, bc);
      render();
      if (s.phase === "over") return;
      if (s.players[bc.player]!.isHuman) {
        s.phase = "human-turn";
        s.humanCanWinOnDraw = canWin(s.players[bc.player]!.hand, s.players[bc.player]!.melds);
        render();
        return;
      }
      void run({ skipDrawFor: bc.player });
      return;
    }
    s.lastDiscard = null;
    nextTurn(s);
    s.phase = "ai";
    render();
    void run();
  }, [offerNextHuman, render, run]);

  const humanDiscard = useCallback(
    (tile: Tile) => {
      const s = stateRef.current;
      if (s.phase !== "human-turn" || runningRef.current) return;
      const seat = s.turn;
      discard(s, seat, tile);
      s.humanCanWinOnDraw = false;
      s.phase = "ai";
      queueHumanClaims();
      render();

      void (async () => {
        await sleep(SPEED / 2);
        resolveAfterHumans();
      })();
    },
    [queueHumanClaims, render, resolveAfterHumans],
  );

  const humanClaim = useCallback(
    (claim: Claim) => {
      const s = stateRef.current;
      if (s.phase !== "human-claim") return;
      pendingRef.current = [];
      applyClaim(s, claim);
      s.humanClaims = [];
      s.claimSeat = null;
      render();
      if ((s.phase as string) === "over") return;
      s.turn = claim.player;
      s.phase = "human-turn";
      s.humanCanWinOnDraw = canWin(s.players[claim.player]!.hand, s.players[claim.player]!.melds);
      render();
    },
    [render],
  );

  const humanPass = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== "human-claim") return;
    s.humanClaims = [];
    s.claimSeat = null;
    s.phase = "ai";
    render();
    resolveAfterHumans();
  }, [render, resolveAfterHumans]);

  const humanWin = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== "human-turn" || !s.humanCanWinOnDraw) return;
    declareWin(s, s.turn, true);
    render();
  }, [render]);

  const startGame = useCallback(
    (next: GameSetup, keepScores = false) => {
      const scores = keepScores
        ? stateRef.current.players.map((p) => p.score)
        : [0, 0, 0, 0];
      stateRef.current = newGame(scores, next);
      pendingRef.current = [];
      runningRef.current = false;
      render();
      void run();
    },
    [render, run],
  );

  const restart = useCallback(() => {
    startGame(stateRef.current.setup, true);
  }, [startGame]);

  return {
    state: stateRef.current,
    humanDiscard,
    humanClaim,
    humanPass,
    humanWin,
    restart,
    startGame,
  };
}
