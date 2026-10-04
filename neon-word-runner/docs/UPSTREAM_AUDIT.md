# Upstream source and M1 audit

## Provenance

- Project: [misterpaul4/Demon-Runner](https://github.com/misterpaul4/Demon-Runner)
- Imported snapshot: [`8656527a4562f6848884804ed379e45b93aeb366`](https://github.com/misterpaul4/Demon-Runner/tree/8656527a4562f6848884804ed379e45b93aeb366)
- Snapshot branch: v3
- License: upstream MIT license retained as `LICENSE`
- Starting tree: this repository's Git parent is the upstream snapshot; removed upstream source remains available in Git history.

## M1 source mapping

| Upstream area | M1 treatment |
| --- | --- |
| React `App` and `PhaserGame` | Replaced with a React shell for home, settings, restart, and results; Phaser is created and destroyed with the component lifecycle. |
| Phaser `main.ts`, `Boot`, `Preloader`, and `Game` | Reduced to asset boot and a 1280×720 automatic runner scene using Phaser's scene update loop. |
| Player's physics sprite and separate visual rig | Kept the separate Arcade body and visible runner sprite; M2 will replace jump input with a full player state machine. |
| `Background` and `Ground` | Rebuilt as four neon parallax layers and a recycled, safe rooftop floor. |
| `EventBus` | Replaced with typed `game:ready`, `game:start`, `game:end`, and `settings:change` events. |
| Firebase initialization, leaderboard API, Rank scene, install prompt, PWA plugins, and build log hook | Removed from the application and build configuration. |
| Procedural demon, birds, souls, gothic skyline, and gothic menu | Removed from the active source and shipped assets. Environment textures remain code generated. |

## Existing source risks carried into the audit

The upstream Player writes horizontal velocity during every update, which suppresses DASH. The upstream Game also ends the run on bird contact, falling, or a short stall. M2 addresses both before action input is introduced. The M1 runner does not import those upstream movement and collision paths.
