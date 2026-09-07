import { type Player, seatWind } from "../../game/engine";
import { TILE_LABEL } from "../../game/tiles";
import { TileBack, TileFace } from "./TileFace";

export function BotSeat({ player, active }: { player: Player; active: boolean }) {
  return (
    <section
      className={`rounded-md border bg-card/70 p-3 transition-colors ${
        active ? "border-brass" : "border-border"
      }`}
      aria-label={`${player.name}'s seat`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-serif text-base font-semibold">
          {player.name}
          <span className="ml-2 text-[0.7rem] font-normal tracking-wide text-muted-foreground uppercase">
            {TILE_LABEL[seatWind(player.index)]}
          </span>
        </h2>
        <span className="text-[0.75rem] text-muted-foreground">{player.score} pts</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-0.5">
        {player.hand.map((_, i) => (
          <TileBack key={i} size="sm" />
        ))}
      </div>

      {(player.melds.length > 0 || player.bonus.length > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {player.melds.map((m, i) => (
            <div key={i} className="flex gap-0.5">
              {m.tiles.map((t, j) => (
                <TileFace key={j} tile={t} size="sm" />
              ))}
            </div>
          ))}
          {player.bonus.length > 0 && (
            <div className="flex gap-0.5 opacity-90">
              {player.bonus.map((t, i) => (
                <TileFace key={i} tile={t} size="sm" />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
