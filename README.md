# Singapore Mahjong

A browser-based Singapore-style mahjong game built as a learning project. Play solo against computer players or pass the device around for a local hot-seat game with up to four people.

**Live demo:** https://resume-story-creator.lovable.app

![Screenshot of the Singapore Mahjong game table](public/screenshot.png)

## Why I built this

I wanted a portfolio piece that shows I can model a real game domain in code, build a responsive UI around it, and ship a complete frontend project. Singapore mahjong has enough rules to be interesting — tiles, melds, scoring, bots — while still fitting in a single-page learning app.

## What it demonstrates

- **React 19 + TanStack Start** — full-stack React with file-based routing, SSR/SSG-ready.
- **TypeScript** — strongly typed game engine, state machine, and UI components.
- **Tailwind CSS v4** — custom design tokens, dark-aware semantic colors.
- **Game logic** — dealing, drawing, discards, pung/kong/chow/win claims, bot AI, and tai scoring.
- **Accessibility** — semantic HTML, ARIA labels, keyboard-friendly controls.
- **SEO** — unique meta titles/descriptions, Open Graph tags, canonical links.

## Features

- 1–4 human players on the same device (remaining seats are computer players)
- Three computer difficulty levels: beginner, intermediate, advanced
- 148-tile Singapore set: characters, bamboo, dots, winds, dragons, flowers, and animals
- Core Singapore scoring: winds, dragons, flushes, ping hu, self-draw, concealed hand, flowers, animals
- Tai cap at 5, payouts as `2^tai`
- Hot-seat privacy: each player taps to reveal their own hand on their turn
- Rules page explaining the Singapore tai table and how to play

## Rules summary

Singapore mahjong uses 148 tiles:
- Three numbered suits: **Characters** (万), **Bamboo** (条), **Dots** (筒), each 1–9, four of each
- Four winds: East, South, West, North
- Three dragons: Red, Green, White
- Eight flowers/seasons
- Four animals: Cat, Mouse, Rooster, Centipede

A winning hand is **four sets plus one pair**. A set is:
- **Pung** — three identical tiles
- **Kong** — four identical tiles
- **Chow** — three consecutive tiles in the same suit

Flowers and animals are set aside when drawn; you draw a replacement tile from the back of the wall.

### Scoring (tai)

| Hand element | Tai |
| --- | --- |
| Red / Green / White dragon pung | 1 each |
| Seat wind pung | 1 |
| Round wind pung | 1 |
| All triplets (dui dui hu) | 2 |
| Half flush — one suit plus honours | 2 |
| Full flush — one suit only | 4 |
| Ping hu — all runs, no honours | 1 |
| Fully concealed hand | 1 |
| Self-drawn winning tile | 1 |
| Each animal | 1 |
| Your own seat flower or season | 1 |
| No flowers and no animals at all | 1 |

Total tai is capped at 5. A hand worth `t` tai pays `2^t` points.

- **Self-drawn win:** all three opponents pay you that amount.
- **Win off a discard:** the player who discarded the tile pays you triple that amount.

This is a simplified core Singapore ruleset. It does not include limit hands, kong robbing, bao liability, flower/animal marriages, hidden treasures, or the full competition scoring table.

## Tech stack

- **Framework:** TanStack Start (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Build:** Vite 7

## Running locally

```bash
# Clone the repo
git clone <repo-url>
cd singapore-mahjong

# Install dependencies
bun install
# or: npm install

# Start the dev server
bun run dev
# or: npm run dev
```

The app will be available at `http://localhost:8080`.

## Project structure

```
src/
  components/mahjong/  # Tile, seat, setup panel components
  game/                # Engine, tile definitions, win/scoring logic
  hooks/               # useMahjong state machine hook
  routes/              # TanStack Start file-based routes
  styles.css           # Global tokens, theme, Tailwind imports
public/                # Static assets
```

## License

MIT — feel free to use this as a reference or starting point.

## Contact

Spotted an issue or want to suggest an improvement? Open an issue on the repository.
