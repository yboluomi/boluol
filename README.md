# 荒岛生存

A mobile-first idle survival game built with Vite, React 18, strict TypeScript, Zustand, and `break_infinity.js`.

## Run locally

```bash
npm install
npm run dev
```

Production build and preview:

```bash
npm run build
npm run preview
```

## Numeric formulas

| System | Formula |
| --- | --- |
| Experience per manual click | 1 |
| Experience to next level | `100 × 1.35^(level - 1)` |
| Click yield per resource | `1 × 1.15^(level - 1) × click multiplier` |
| Building upgrade cost | `base cost × 1.6^building level` |
| Auto-click yield | `rate × click yield × elapsed seconds` |
| Offline limit | 8 hours, increased by survival buildings |
| Market exchange | `amount × source price ÷ target price × (1 - fee)` |

Resources, levels, building levels, prices, rates, and yields are represented as `Decimal`. The market refreshes every 60 seconds and events are scheduled at random intervals from 45 to 90 seconds. Persisted state is versioned and Decimal values are string-encoded in local storage.

## Extending / WeChat Mini Game port

Gameplay rules live in `src/engine/`; the UI calls game actions in `src/store/game.ts`. For a mini-game adapter, replace the React view with Canvas/native UI, replace browser `localStorage` with the platform storage API, and adapt `requestAnimationFrame` and page lifecycle hooks to the mini-game frame and foreground/background APIs. The pure engine formulas can remain platform independent.
