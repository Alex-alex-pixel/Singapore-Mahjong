import { useState } from "react";
import type { Difficulty, GameSetup } from "../../game/engine";

const DIFFICULTIES: { value: Difficulty; label: string; blurb: string }[] = [
  { value: "beginner", label: "Beginner", blurb: "Loose calls, throws away useful tiles" },
  { value: "intermediate", label: "Intermediate", blurb: "Solid basics, occasional slip" },
  { value: "advanced", label: "Advanced", blurb: "Reads discards, plays safe, calls sharply" },
];

export function GameSetupPanel({
  setup,
  onStart,
}: {
  setup: GameSetup;
  onStart: (s: GameSetup) => void;
}) {
  const [humans, setHumans] = useState(setup.humanCount);
  const [difficulty, setDifficulty] = useState<Difficulty>(setup.difficulty);
  const bots = 4 - humans;

  return (
    <section className="rounded-lg border border-border bg-card/60 p-4" aria-label="Table setup">
      <h2 className="text-[0.75rem] tracking-widest text-muted-foreground uppercase">
        Table setup
      </h2>

      <div className="mt-3">
        <span className="text-[0.85rem]">People at this device</span>
        <div className="mt-2 flex gap-1.5">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setHumans(n)}
              aria-pressed={humans === n}
              className={`h-9 flex-1 cursor-pointer rounded-sm border text-[0.9rem] transition-colors ${
                humans === n
                  ? "border-brass bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-brass"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[0.78rem] text-muted-foreground">
          {bots === 0
            ? "Four people passing one screen — no computer players."
            : `${humans} taking turns on this screen, ${bots} computer ${bots === 1 ? "player" : "players"}.`}
        </p>
      </div>

      <div className="mt-4">
        <span className="text-[0.85rem]">Computer skill</span>
        <div className="mt-2 space-y-1.5">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDifficulty(d.value)}
              aria-pressed={difficulty === d.value}
              disabled={bots === 0}
              className={`w-full cursor-pointer rounded-sm border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                difficulty === d.value ? "border-brass bg-card" : "border-border bg-card/40 hover:border-brass"
              }`}
            >
              <span className="block text-[0.88rem]">{d.label}</span>
              <span className="block text-[0.75rem] text-muted-foreground">{d.blurb}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onStart({ humanCount: humans, difficulty })}
        className="mt-4 w-full cursor-pointer rounded-sm bg-primary px-4 py-2 text-[0.88rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Start new game
      </button>
    </section>
  );
}
