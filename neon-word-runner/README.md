# Neon Word Runner

An original vocabulary parkour runner for Chinese speaking English learners. The source starts from the MIT licensed Demon-Runner v3 snapshot and replaces its gothic survival loop with a neon city route.

## Run locally

Use Node.js 22.12 or newer.

```bash
npm install
npm run dev
npm run build
npm run preview
```

Vite serves the game at `http://localhost:5173`. The production build uses relative asset paths so it can be hosted at a domain root or a project subpath.

## Current milestone

Milestones 1–6 provide the React shell, fixed 1280×720 Phaser world, generated neon city layers, a 40-frame action Atlas, automatic forward motion, persistent settings, all seven parkour actions, and a 30-word bank with 12 questions per 85-second run. Prompts and choices appear on world-space street signs and neon gates with keyboard and pointer input. Successful clears increase score and combo; x10 activates FEVER, and mistakes recover through STUMBLE. Each vocabulary entry has a bundled en-US WAV pronunciation with browser speech as a fallback.

The shell owns menus, settings, and results. Phaser owns the world, player, camera, physics, and run clock. Cross layer events are typed in `src/game/EventBus.ts`; gameplay logic does not read React state each frame.

## Project structure

```text
src/
  App.tsx                   React home, settings, and results
  game/
    EventBus.ts             typed React ↔ Phaser event boundary
    entities/Player.ts      runner sprite, physics body, and trail
    scenes/                 asset boot and gameplay scene
    systems/                parkour, score, combo, audio, speed, and vocabulary
    ui/                     world answer gates and score/combo HUD
    world/                  parallax layers and recyclable ground
  data/vocabulary.ts        starter vocabulary entries
  types/game.ts             RunOptions and RunResult contracts
public/assets/characters/   replaceable runner Atlas pair
public/assets/speech/       one WAV pronunciation for each vocabulary word
docs/                       upstream audit and milestone notes
```

## Replace the runner Atlas

Replace `public/assets/characters/runner-atlas.png` and `runner-atlas.json` together. The sheet has 40 equal 256×384 frames: four frames for each row prefix `run`, `jump`, `long-jump`, `vault`, `slide`, `wall-run`, `roll`, `dash`, `stumble`, and `land`. Keep the character facing right, preserve the shared foot baseline, and retain those frame names. The game reads animation frames by prefix; movement timing and collision geometry stay in TypeScript.

## Add vocabulary and actions

Add a `VocabularyEntry` in `src/data/vocabulary.ts`, then add a matching `public/assets/speech/<english-word>.wav` file. The browser speech engine is used if local audio cannot play. Route actions are listed in `src/game/systems/runSchedule.ts`; add the corresponding player state, animation prefix, movement timing, route geometry, and clearance distance before assigning a new action to questions.

## Static deployment

`npm run build` creates the complete static site in `dist/`. Upload that directory to Vercel, Cloudflare Pages, or GitHub Pages; no server runtime or rewrite rule is required. Vite uses `base: './'`, so the same relative-asset build works at a domain root and a repository subpath. For a fixed subpath build, use `npm run build -- --base=/neon-word-runner/` and replace `neon-word-runner` with the repository name.

The production root and `/neon-word-runner/` subpath were both loaded in Chrome with one Canvas and no errors. Static checks resolved all 30 speech clips at both paths, and answering correctly requested a bundled WAV.

## Source and license

This repository keeps Demon-Runner's MIT `LICENSE` and records the exact upstream source revision in [`docs/UPSTREAM_AUDIT.md`](docs/UPSTREAM_AUDIT.md). Neon Word Runner code and art created for this project are original additions.
