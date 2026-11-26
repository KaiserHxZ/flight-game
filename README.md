[![Make.fun](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/c/best-flight-game-20261126-0057)
[![Rank](https://make.fun/badge/best-flight-game-20261126-0057/KaiserHxZ/flight-game/rank.svg)](https://make.fun/c/best-flight-game-20261126-0057)
[![Reward](https://make.fun/badge/best-flight-game-20261126-0057/KaiserHxZ/flight-game/reward.svg)](https://make.fun/c/best-flight-game-20261126-0057)

# Sriti Air Mail

A complete, original flight game for [make.fun's "Make the best flight game" bounty](https://make.fun/c/best-flight-game-20261126-0057) ($500 USDC, 50 places paid). You are the mail pilot of **Sriti**, a red-and-cream seaplane, flying the dawn post across **Kepulauan Layar**, an invented archipelago of six islands, a lagoon runway, a lighthouse and three fishing villages. A brass compass in the cockpit points north; a red mail satchel is strapped behind the seat. Nothing here copies an existing game: the plane, places, people and mission names are invented.

## Play it

Serve `game/` with any static server (`node serve.ts`, then open http://localhost:8080) and play in a desktop browser. No network requests, no build step, no storage: every file the page loads lives under `game/`.

**Controls:** W/S throttle · A/D or arrow keys turn · Arrow up/down nose up/down · Space drops the parcel · Mouse steers gently · Enter starts/restarts · Click a sortie on the title screen · Keys 1–6 pick a sortie.

## 6 missions, 7 named systems

**Missions** (each with its own goal, weather and corner of the map):

1. **Fajar di Laguna Biru** (dawn) — fly 5 dawn rings, land at the lagoon.
2. **Gerbang Ngarai Batu** (day, crosswind) — 6 gates through a carved canyon.
3. **Lompat Pulau Sriti** (day) — touch down on the Bakau strip, then the Senja strip.
4. **Depan Badai Kelabu** (storm) — gusts push the plane; 4 storm markers.
5. **Pendaratan Malam Lentera** (night) — follow lantern rings to a dark landing.
6. **Kiriman Terakhir** (dusk) — drop the parcel at the lighthouse, fly home on tight fuel.

**Named systems (7):** ThrottleDiscipline, FuelManagement, DamageModel, WindGusts, RingGateScoring, LandingJudge, ScoreCombo. Throttle discipline is scored: flying in the green 55–75% band earns score every second and burns less fuel. Fuel and damage turn every sortie into decisions — full throttle empties the tank in about 3 minutes, hard landings and storm gusts damage the plane, and a landing is judged on softness, centreline alignment and speed. Rings chained within 9 seconds build a combo up to ×3.0.

## What the screenshots show

1. **1-cover.jpg** — chase view mid-flight: Sriti large in frame, the dawn ring ahead, island coast and lagoon below, full HUD (ALTITUDE 96 m, SPEED 116 kt, HEADING 357° N, FUEL 99%, TIME 01:39, throttle gauge in the green band).
2. **2-canyon.jpg** — the canyon gate run: gate "GERBANG 2" ahead between rock walls, peaks and sea beyond, HUD lit.
3. **3-night.jpg** — the night landing sortie: the golden lantern ring "LENTERA 2", moon, village lights, heading 180° S.
4. **4-landing.jpg** — the end screen: "PENDARATAN BERHASIL", final score 1840, rings/parcels/landings/time/fuel/damage totals, restart prompt.

## Structure

Source is split into files with one clear job each, named for what they do:

- `game/src/config.js` — tuning constants (speeds, fuel, scoring, world size)
- `game/src/terrain.js` — heightfield, islands, runway, airstrips, projection
- `game/src/flight.js` — throttle, lift, banking, stall, landing quality
- `game/src/missions.js` — the 6 sorties, their targets and weather
- `game/src/sortie.js` — fuel, damage, score and combo ledger
- `game/src/input.js` — keyboard and mouse state
- `game/src/render.js` — sky, voxel terrain, runway, rings, lighthouse
- `game/src/aircraft.js` — drawing Sriti, the seaplane
- `game/src/hud.js` — lit instruments: altitude, speed, heading, fuel, time
- `game/src/staging.js` — `?shot=` staging states for the maker's screenshots (real game code, real renders)
- `game/src/main.js` — game loop and state machine (title / flying / ended)

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-game.ts` (the kit's copy, unchanged). Two runs with `MAKEFUN_OUTPUT_DIR` write byte-identical output.

## License

MIT — see [LICENSE](LICENSE).
