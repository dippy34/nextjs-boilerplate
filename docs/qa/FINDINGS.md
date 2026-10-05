# QA findings

## Regression gate (vs the live pre-sprint build a29cfba)

| candidate | verdict | report |
|---|---|---|
| 464ca6e5 | **HOLD**: emulated-VR frames 2.8–8.6× slower; that pass was run side by side under load and had harness false positives | `docs/qa/gate-464ca6e5/COMPARE.md` |
| aec525f7 | **GO** (not worse): 0 new anomalies; the chase-view freeze is fixed; inside Andromeda 593→17 ms, VR Andromeda 174→16, VR inside Orion 335→126; small slowdowns: VR travel 307→541 ms (1.76×), VR near Cygnus X-1 557→701 (1.26×), desktop Earth 347→449 (1.29×) | `docs/qa/gate-aec525f7/COMPARE.md` |

Gate method: `scripts/playtest.mjs` on each build, one after the other, then `scripts/qa-compare.mjs base cand out`.
Frame times are from SwiftShader on a still view: they compare builds, not Quest speed, and a build that skips
redrawing a still view reads as very fast.

## Present in both builds (not regressions; owners)

1. **Earth's night side close up renders pure black** (`d04-earth-low`): no city lights, no atmosphere rim,
   no stars at the limb. Steps: `?time=2026-10-01T20:00:00Z&paused=1&target=Earth&menu=0`, then
   `app.placeNear(Earth, 1.15*R, 200, 5)`. Owner: planets.
2. **Popping on still views near black holes** (desktop Cygnus X-1 at 2000/60/8 Rs and Sgr A*; VR Cygnus X-1):
   two frames apart with the clock paused, up to 470 of 576 blocks change. Probably the environment cube
   being recaptured one face per frame. Shots: `d15-bh-far(-b)`, `v05-blackhole(-b)`. Owner: blackholes.
   Also some popping in VR at Jupiter and inside Orion (owners: planets, starneb).
3. **Can't take off from the Moon after landing** with W+Shift held for 20 frames (altitude stays 0.5 m).
   This may be the harness using the wrong controls; to confirm. Owner: godux/game.
4. God panel: lower rows go off the bottom of a 720 px screen, and the God console covers the info panel (43%).
   Owner: godux.
5. The `god-badge` sits on top of the top HUD bar. Owner: godux.
6. The Moon walk scene times out (terrain streaming under SwiftShader). This is a harness limit, not an app bug.

## Early notes (first pass)


Run it with: `node scripts/playtest.mjs <baseUrl> screenshots/<name> [desktop|vr|all] [--only=scene,...]`
(for the live site behind the session proxy: `TRUSTED_SPKI=<sha256 of the proxy CA's public key>`).
It writes `report.md` and `report.json` next to the screenshots.

- NaN in the flight readout's `tImpact`/`tAp`/`tPe`/`ap`/`pe` means "none" (by design); the playtest ignores it.
- VR menu (both builds): 1.27 m away, 54° wide, 10° off the gaze, 29.5 px/°, 24 px text = 0.81°. Fine.

## VR comfort checklist (Quest 3)

- [ ] Judder: steady frame pacing at 72/90 Hz in heavy scenes (inside a nebula, inside Andromeda, near a black hole).
- [ ] Vignette: the tunnel vignette shows during travel, walking and stick flight; it can be switched off in Settings.
- [ ] Text legibility: menu text ≥ 0.35° (24 px canvas text) and the panel texture near ~25 px/°.
- [ ] Menu reach: the menu opens 0.6–2 m away, within 30° of the gaze, under 90° wide, and can be reached with the laser while seated.
- [ ] Scale cues: planets and black holes read as huge (stereo depth, size vs. the cockpit or hands).
