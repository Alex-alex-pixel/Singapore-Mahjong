import { type Tile, isSuited, rankOf, suitOf, TILE_LABEL, SUIT_MARK } from "../../game/tiles";

const SUIT_COLOR: Record<string, string> = {
  c: "text-ink",
  b: "text-jade",
  d: "text-cobalt",
  w: "text-ink",
  g: "text-vermilion",
  f: "text-jade",
  a: "text-vermilion",
};

type Size = "sm" | "md" | "lg";

/** Compact glyphs so honour, flower and animal tiles fit the small size. */
const SHORT: Record<string, string> = {
  we: "E",
  ws: "S",
  ww: "W",
  wn: "N",
  gr: "R",
  gg: "G",
  gw: "\u25A1",
  f1: "F1",
  f2: "F2",
  f3: "F3",
  f4: "F4",
  f5: "S1",
  f6: "S2",
  f7: "S3",
  f8: "S4",
  a1: "\u732B",
  a2: "\u9F20",
  a3: "\u9E21",
  a4: "\u87F2",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 w-7 text-[0.68rem]",
  md: "h-12 w-9 text-[0.72rem]",
  lg: "h-16 w-12 text-[0.85rem]",
};

export function TileFace({
  tile,
  size = "md",
  onClick,
  disabled,
  highlighted,
  label,
}: {
  tile: Tile;
  size?: Size;
  onClick?: () => void;
  disabled?: boolean;
  highlighted?: boolean;
  label?: string;
}) {
  const suited = isSuited(tile);
  const color = SUIT_COLOR[suitOf(tile)] ?? "text-ink";
  const content = suited ? (
    <>
      <span className="font-serif text-[1.25em] leading-none font-semibold">{rankOf(tile)}</span>
      <span className="mt-0.5 leading-none opacity-70">{SUIT_MARK[suitOf(tile)]}</span>
    </>
  ) : (
    <span className="px-0.5 text-center leading-tight font-medium">
      {size === "sm" ? (SHORT[tile] ?? tile) : (TILE_LABEL[tile] ?? tile)}
    </span>
  );

  const base = `relative flex ${SIZES[size]} shrink-0 flex-col items-center justify-center rounded-[4px] border border-tile-edge bg-tile shadow-[0_2px_0_var(--tile-edge)] ${color} ${
    highlighted ? "ring-2 ring-brass" : ""
  }`;

  if (!onClick) {
    return (
      <div className={base} aria-label={label ?? tile}>
        {content}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label ?? `Discard ${tile}`}
      className={`${base} cursor-pointer transition-transform enabled:hover:-translate-y-1.5 disabled:cursor-default disabled:opacity-60`}
    >
      {content}
    </button>
  );
}

export function TileBack({ size = "sm" }: { size?: Size }) {
  return (
    <div
      aria-hidden
      className={`${SIZES[size]} shrink-0 rounded-[4px] border border-tile-back-edge bg-tile-back shadow-[0_2px_0_var(--tile-back-edge)]`}
    />
  );
}
