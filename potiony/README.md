# Potiony 🧪

A whimsical, touch-first iPad web game for young children. Tidy up litter to harvest magic
ingredients, brew them into potions, and cheer up friends with silly ailments.

Built as an installable PWA that works offline and saves progress automatically.

> **Tone rule:** the word "medicine" never appears anywhere in the UI, story, or audio.
> Remedies are always **Potions** or **Magic Brews**.

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

| Script             | What it does                                              |
| ------------------ | --------------------------------------------------------- |
| `npm run dev`      | Dev server on localhost                                    |
| `npm run dev:ipad` | Dev server on your local network, for testing on a real iPad |
| `npm test`         | Headless game-logic tests (Vitest)                         |
| `npm run build`    | Typecheck and build to `dist/`                             |
| `npm run serve`    | Serve the production build, exposed to your network        |
| `npm run lint`     | oxlint                                                     |

### Playing on an actual iPad

1. Run `npm run dev:ipad` and note the Network URL it prints.
2. Open that URL in Safari on an iPad on the same Wi-Fi.
3. Share → **Add to Home Screen**. Launching from the home screen gives full screen with no
   Safari chrome, which is the intended experience.

The service worker is only active in production builds, so use `npm run build && npm run serve`
to test offline behaviour.

## How the game works

```
Clean & Collect  ──▶  ingredients  ──▶  Potion Lab  ──▶  potions  ──▶  Town & Friends
   sort litter                            mix + stir                     heal a friend
```

- **Sunflower Park** yields 🌸 Sunlight Blossom, **Sparkle Beach** yields 💧 Dewdrop Crystal,
  and the **Enchanted Forest** yields 🍃 Whispering Leaf.
- Cleaning a zone to 100% awards ✨ Star Dust. Repeat clears keep awarding it, so no recipe is
  ever permanently out of reach.
- Recipes: Giggle Fizz (🌸+💧), Cozy Warmth (🍃+🌸), Super Bouncy (💧+✨).
- Friends: Freddy Fox needs Giggle Fizz, Barnaby Bear needs Cozy Warmth, Pippa Bunny needs
  Super Bouncy.

There is no fail state, no timer, and no score. A wrong bin or a silly potion mix always gives
friendly feedback and returns the items.

## Architecture

```
src/
├── content/    All game design data: zones, litter, ingredients, recipes, friends.
│               Adding a zone or potion is a data edit, not a code change.
├── store/      One Zustand store, auto-persisted to localStorage with a versioned
│               save and a forgiving migration for older saves.
├── systems/    Cross-cutting: pointer drag-and-drop, synthesised audio, canvas particles.
├── scenes/     The four tabs: CleanCollect, PotionLab, Town, RecipeBook.
└── ui/         Shell: title screen, top bar, tab bar, inventory drawer, toasts.
```

A few decisions worth knowing before you change things:

- **Drag uses raw pointer events**, not HTML5 drag-and-drop, which does not work on iOS touch.
  `systems/drag/DragProvider.tsx` is the single implementation shared by all three scenes; tap
  and drag both work everywhere, since young children do both.
- **Sound is synthesised with the Web Audio API**, so there are no audio files to ship or fail
  to load. iOS keeps audio suspended until a real touch, so it unlocks on first interaction.
- **Planet cleanliness is a high-water mark.** It never decreases, even when fresh litter blows
  in, because progress going backwards is dispiriting for a child.
- **Base CSS uses `:where()`** for element selectors. Plain element rules end up unlayered and
  outrank Tailwind utilities, which silently breaks text colours on buttons.
- **Save data never crashes the app.** Unknown or missing fields are backfilled by
  `store/save.ts`, and storage falls back to memory if Safari blocks `localStorage`.

## Tests

`npm test` covers the parts worth protecting: recipe matching, litter rewards, Star Dust
gating, brewing, healing, and the save/reload round trip. It runs headless in about a second.

## Tech

React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, Framer Motion, Vitest.
