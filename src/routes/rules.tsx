import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/rules")({
  component: RulesPage,
  head: () => ({
    meta: [
      { title: "Singapore Mahjong Rules — Tai Table & Basics | Kaki Mahjong" },
      {
        name: "description",
        content:
          "A short guide to Singapore mahjong as played in this game: 148 tiles with flowers and animals, melds, winning hands, and the tai scoring table capped at 5 tai.",
      },
      { property: "og:title", content: "Singapore Mahjong Rules — Tai Table & Basics" },
      {
        property: "og:description",
        content:
          "148 tiles, flowers and animals, melds, winning hands and the tai scoring table used in Kaki Mahjong.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const TAI = [
  ["Red / Green / White dragon triplet", "1 tai each"],
  ["Seat wind triplet", "1 tai"],
  ["Round wind triplet", "1 tai"],
  ["All triplets (dui dui hu)", "2 tai"],
  ["Half flush — one suit plus honours", "2 tai"],
  ["Full flush — one suit only", "4 tai"],
  ["Ping hu — all runs, no honours", "1 tai"],
  ["Fully concealed hand", "1 tai"],
  ["Self-drawn winning tile", "1 tai"],
  ["Each animal", "1 tai"],
  ["Your own seat flower or season", "1 tai"],
  ["No flowers and no animals at all", "1 tai"],
];

function RulesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <Link to="/" className="text-[0.85rem] text-brass hover:underline">
          ← Back to the table
        </Link>
        <h1 className="mt-6 font-serif text-4xl font-semibold tracking-tight">
          Singapore mahjong, in short
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          These are the rules this game follows — the Singapore version, not the Chinese
          official one. It is a core rule set: enough to play a proper hand, without the
          rarer local table rules.
        </p>

        <h2 className="mt-10 font-serif text-2xl font-semibold">The tiles</h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          148 tiles: characters, bamboo and dots numbered 1 to 9 (four of each), four winds,
          three dragons, eight flowers and — the Singapore touch — four animals: cat, mouse,
          rooster and centipede. Flowers and animals never stay in your hand; whenever you
          pick one up it is set aside and you draw a replacement from the back of the wall.
        </p>

        <h2 className="mt-10 font-serif text-2xl font-semibold">Winning</h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          A winning hand is four sets plus one pair. A set is either three identical tiles
          (pung), four identical tiles (kong) or three consecutive tiles in the same suit
          (chow). You may claim a discard to complete a pung or kong from anyone, a chow only
          from the player on your left, and a win from anyone. Claiming a win beats a pung or
          kong, which beats a chow.
        </p>

        <h2 className="mt-10 font-serif text-2xl font-semibold">Scoring in tai</h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Add up the tai your hand earns. The table here caps the total at 5 tai, and a hand
          is worth 2<sup>tai</sup> points. Self-draw: all three opponents pay you. Winning off
          a discard: the player who threw the tile pays for everybody.
        </p>

        <dl className="mt-5 divide-y divide-border border-y border-border">
          {TAI.map(([name, value]) => (
            <div key={name} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-[0.95rem]">{name}</dt>
              <dd className="shrink-0 text-[0.85rem] text-brass">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 text-[0.85rem] leading-relaxed text-muted-foreground">
          Not included, to keep things learnable: kong robbing, hidden treasure bonuses,
          three/four animal bonuses, thirteen wonders, and dealer continuation streaks.
        </p>
      </div>
    </div>
  );
}
