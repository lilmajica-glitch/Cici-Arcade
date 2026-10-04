# Delivery milestones

| Milestone | Status | Evidence |
| --- | --- | --- |
| M1 — run and de-theme | Complete | `npm install`, `npm run build`, and Chrome smoke pass; one canvas, zero console errors, zero failed requests. Screenshots and details are in `docs/verification/M1.md`. |
| M2 — independent actions | Complete | V/S/J action route, hitbox changes, and H-triggered stumble/recovery passed in Chrome. Details and screenshots are in `docs/verification/M2.md`. |
| M3 — vocabulary control | Complete | Ten-word randomized quiz, keyboard answers, correct/wrong/timeout handling, and action assignment passed in Chrome. Details and screenshot are in `docs/verification/M3.md`. |
| M4 — world answer gates | Complete | World-space prompt and three answer gates passed pointer checks during camera follow, at 1.2× zoom, and after resizing to 1920×1080. Details and screenshot are in `docs/verification/M4.md`. |
| M5 — feedback and remaining actions | Complete | All ten correct route actions cleared; x5/x10 rewards, FEVER entry, failure reset/recovery, score, generated audio, and motion feedback passed in Chrome. Details and screenshot are in `docs/verification/M5.md`. |
| M6 — complete slice | Complete | 12 unique questions, all 12 obstacles cleared in 85 seconds; FEVER, results, stumble recovery, hidden-tab timing, five restarts, ~59.96 FPS, Atlas replacement, and root/subpath static loads passed. Details and screenshots are in `docs/verification/M6.md`. |
