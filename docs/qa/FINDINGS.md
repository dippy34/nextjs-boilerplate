# QA findings (work in progress)

Status: WIP, paused by the coordinator. `scripts/playtest.mjs` is written. The first full runs against the
live site and a fresh build of `claude/upbeat-allen-8ok26x` were still going when the pause came.

Run it with: `node scripts/playtest.mjs <baseUrl> screenshots/<name> [desktop|vr|all] [--only=scene,...]`
(for the live site behind the session proxy: `TRUSTED_SPKI=<sha256 of the proxy CA's public key>`).
It writes `report.md` and `report.json` next to the screenshots.

## Early observations (still to confirm)

1. **Earth's night side close up is pure black** (live and main). At 1.15 R, az 200°, el 5°
   (`d04-earth-low`) the canvas is all zeros: no city lights, no atmosphere rim, and no stars around
   the limb. Steps: `?time=2026-10-01T20:00:00Z&paused=1&target=Earth&menu=0`, then
   `app.placeNear(Earth, 1.15*R, 200, 5)`. Owner: planets.
2. Flight readouts (`ap`, `pe`, `tAp`, `tPe`, `tImpact`) are NaN while flight is off. That's harmless
   unless something displays them; the playtest ignores them for now.

## VR comfort checklist (Quest 3)

- [ ] Judder: steady frame pacing at 72/90 Hz in heavy scenes (inside a nebula, inside Andromeda, near a black hole).
- [ ] Vignette: the tunnel vignette shows during travel, walking and stick flight; it can be switched off in Settings.
- [ ] Text legibility: menu text ≥ 0.35° (24 px canvas text) and the panel texture near ~25 px/°.
- [ ] Menu reach: the menu opens 0.6–2 m away, within 30° of the gaze, under 90° wide, and can be reached with the laser while seated.
- [ ] Scale cues: planets and black holes read as huge (stereo depth, size vs. the cockpit or hands).
