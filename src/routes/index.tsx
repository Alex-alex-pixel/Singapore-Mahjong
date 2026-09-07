import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMahjong } from "../hooks/useMahjong";
import { TileFace } from "../components/mahjong/TileFace";
import { BotSeat } from "../components/mahjong/BotSeat";
import { GameSetupPanel } from "../components/mahjong/GameSetupPanel";
import { seatWind, wallRemaining, type Claim } from "../game/engine";
import { TILE_LABEL, tileText } from "../game/tiles";

export const Route = createFileRoute("/")({
  component: TablePage,
  head: () => ({
    meta: [
      { title: "Kaki Mahjong — Play Singapore Mahjong Against Three Bots" },
      {
        name: "description",
        content:
          "A browser mahjong table using Singapore rules: 148 tiles with flowers and animals, pung, kong and chow claims, and tai scoring capped at 5 tai. Play solo against three computer players.",
      },
      { property: "og:title", content: "Kaki Mahjong — Singapore rules, played solo" },
      {
        property: "og:description",
        content:
          "Play a full hand of Singapore mahjong in the browser against three computer players, with tai scoring and animals.",
      },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

const CLAIM_LABEL: Record<Claim["kind"], string> = {
  win: "Win!",
  kong: "Kong",
  pung: "Pung",
  chow: "Chow",
};

function TablePage() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="font-serif text-2xl">Shuffling the tiles…</p>
      </div>
    );
  }
  return <Table />;
}

function Table() {
  const { state, humanDiscard, humanClaim, humanPass, humanWin, restart, startGame } =
    useMahjong();
  const over = state.phase === "over";
  const humanCount = state.setup.humanCount;

  const activeSeat =
    state.phase === "human-claim"
      ? state.claimSeat
      : state.players[state.turn]?.isHuman
        ? state.turn
        : null;
  const [viewSeat, setViewSeat] = useState(0);
  useEffect(() => {
    if (activeSeat !== null && activeSeat !== viewSeat) setViewSeat(activeSeat);
  }, [activeSeat, viewSeat]);

  const me = state.players[viewSeat]!;
  const hotSeat = humanCount > 1;
  const [revealed, setRevealed] = useState(!hotSeat);
  useEffect(() => {
    setRevealed(state.setup.humanCount === 1);
  }, [viewSeat, state.setup.humanCount]);
  const yourMove = activeSeat === viewSeat;
  const showTiles = !hotSeat || over || (revealed && yourMove);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid max-w-6xl gap-5 px-5 py-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight">
                Kaki Mahjong
              </h1>
              <p className="mt-1 text-[0.9rem] text-muted-foreground">
                Singapore rules · {humanCount} human{humanCount === 1 ? "" : "s"} ·{" "}
                {4 - humanCount} computer{" "}
                {4 - humanCount === 1 ? "player" : "players"}
                {4 - humanCount > 0 ? ` (${state.setup.difficulty})` : ""} ·{" "}
                <Link to="/rules" className="text-brass hover:underline">
                  read the rules
                </Link>
              </p>
            </div>
            <div className="text-right text-[0.8rem] text-muted-foreground">
              <div>Round wind: {TILE_LABEL[state.roundWind]}</div>
              <div>{wallRemaining(state)} tiles left in the wall</div>
            </div>
          </header>

          <div className="grid gap-3 sm:grid-cols-3">
            {state.players
              .filter((p) => p.index !== viewSeat)
              .map((p) => (
                <BotSeat key={p.index} player={p} active={state.turn === p.index && !over} />
              ))}
          </div>

          {/* Table centre */}
          <section
            className="mt-4 rounded-lg border border-border bg-felt-deep p-4"
            aria-label="Discard pile"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[0.75rem] tracking-widest text-muted-foreground uppercase">
                Table
              </h2>
              {state.lastDiscard && (
                <span className="text-[0.8rem] text-muted-foreground">
                  {state.players[state.lastDiscard.from]!.name} threw{" "}
                  <span className="text-brass">{tileText(state.lastDiscard.tile)}</span>
                </span>
              )}
            </div>
            <div className="mt-3 flex min-h-16 flex-wrap gap-1">
              {state.players.flatMap((p) =>
                p.discards.map((t, i) => (
                  <TileFace
                    key={`${p.index}-${i}-${t}`}
                    tile={t}
                    size="sm"
                    highlighted={
                      state.lastDiscard?.from === p.index && i === p.discards.length - 1
                    }
                  />
                )),
              )}
              {state.players.every((p) => p.discards.length === 0) && (
                <p className="text-[0.85rem] text-muted-foreground">No discards yet.</p>
              )}
            </div>
          </section>

          {/* Human seat */}
          <section
            className="mt-4 rounded-lg border border-brass/40 bg-card/70 p-4"
            aria-label="Your hand"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-lg font-semibold">
                {hotSeat ? `${me.name}'s hand` : "Your hand"}
                <span className="ml-2 text-[0.7rem] font-normal tracking-wide text-muted-foreground uppercase">
                  {TILE_LABEL[seatWind(me.index)]} · {me.score} pts
                </span>
              </h2>
              <p className="text-[0.85rem] text-muted-foreground" aria-live="polite">
                {over
                  ? "Hand over."
                  : yourMove && state.phase === "human-turn"
                    ? `${hotSeat ? `${me.name}: your` : "Your"} turn — pick a tile to discard.`
                    : yourMove && state.phase === "human-claim"
                      ? "You can claim that discard."
                      : "Waiting for the other players…"}
              </p>
            </div>

            {hotSeat && !showTiles ? (
              <div className="mt-3 flex flex-col items-start gap-2 rounded-md border border-dashed border-border p-4">
                <p className="text-[0.9rem] text-muted-foreground">
                  Pass the screen to {me.name}. Tiles stay hidden until they are ready.
                </p>
                <ActionButton onClick={() => setRevealed(true)} primary>
                  I am {me.name} — show my tiles
                </ActionButton>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {me.hand.map((t, i) => (
                  <TileFace
                    key={`${t}-${i}`}
                    tile={t}
                    size="lg"
                    onClick={() => humanDiscard(t)}
                    disabled={!yourMove || state.phase !== "human-turn"}
                    label={`Discard ${tileText(t)}`}
                  />
                ))}
              </div>
            )}

            {(me.melds.length > 0 || me.bonus.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
                {me.melds.map((m, i) => (
                  <div key={i} className="flex gap-0.5">
                    {m.tiles.map((t, j) => (
                      <TileFace key={j} tile={t} size="md" />
                    ))}
                  </div>
                ))}
                {me.bonus.length > 0 && (
                  <div className="flex items-center gap-0.5" aria-label="Your flowers and animals">
                    {me.bonus.map((t, i) => (
                      <TileFace key={i} tile={t} size="md" />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {yourMove && showTiles && state.phase === "human-turn" && state.humanCanWinOnDraw && (
                <ActionButton onClick={humanWin} primary>
                  Declare win (self-draw)
                </ActionButton>
              )}
              {yourMove &&
                showTiles &&
                state.phase === "human-claim" &&
                state.humanClaims.map((c, i) => (
                  <ActionButton key={i} onClick={() => humanClaim(c)} primary={c.kind === "win"}>
                    {CLAIM_LABEL[c.kind]}
                    {c.tiles && c.kind === "chow"
                      ? ` (${c.tiles.map(tileText).join(" ")})`
                      : ""}
                  </ActionButton>
                ))}
              {yourMove && showTiles && state.phase === "human-claim" && (
                <ActionButton onClick={humanPass}>Pass</ActionButton>
              )}
              {over && <ActionButton onClick={restart} primary>Deal a new hand</ActionButton>}
            </div>
          </section>

          {over && state.result && (
            <section className="mt-4 rounded-lg border border-brass bg-card p-4">
              {state.result.kind === "draw" ? (
                <p className="font-serif text-lg">Washout — the wall ran out.</p>
              ) : (
                <>
                  <h2 className="font-serif text-xl font-semibold">
                    {state.players[state.result.winner!]!.name} wins ·{" "}
                    {state.result.score!.tai} tai
                    {state.result.score!.capped ? " (capped)" : ""}
                  </h2>
                  <ul className="mt-2 space-y-1 text-[0.9rem] text-muted-foreground">
                    {state.result.score!.lines.map((l, i) => (
                      <li key={i} className="flex justify-between gap-4">
                        <span>{l.name}</span>
                        <span className="text-brass">{l.tai} tai</span>
                      </li>
                    ))}
                    {state.result.score!.lines.length === 0 && <li>Chicken hand — 0 tai.</li>}
                  </ul>
                  <p className="mt-3 text-[0.9rem]">
                    {state.result.from === undefined
                      ? `Self-drawn — each opponent pays ${state.result.points} points.`
                      : `${state.players[state.result.from]!.name} threw the winning tile and pays ${state.result.points! * 3} points.`}
                  </p>
                </>
              )}
            </section>
          )}
        </div>

        <div className="space-y-4">
          <GameSetupPanel setup={state.setup} onStart={(next) => startGame(next)} />

          {/* Log */}
          <aside className="rounded-lg border border-border bg-card/60 p-4">
            <h2 className="text-[0.75rem] tracking-widest text-muted-foreground uppercase">
              Table talk
            </h2>
            <ol className="mt-3 space-y-1.5 text-[0.82rem] leading-relaxed text-muted-foreground">
              {state.log.map((l, i) => (
                <li key={i} className={i === 0 ? "text-foreground" : undefined}>
                  {humanise(l)}
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </div>
  );
}

function humanise(line: string) {
  return line.replace(/\b([cbd][1-9]|w[eswn]|g[rgw]|f[1-8]|a[1-4])\b/g, (m) => tileText(m));
}

function ActionButton({
  children,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-sm px-4 py-2 text-[0.88rem] font-medium transition-colors ${
        primary
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-border bg-card text-foreground hover:border-brass"
      }`}
    >
      {children}
    </button>
  );
}
