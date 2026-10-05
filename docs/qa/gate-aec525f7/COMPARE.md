# Regression gate: aec525f7 vs a29cfba

Baseline: http://127.0.0.1:4175/ (2026-10-05T21:58:50.039Z)
Candidate: http://127.0.0.1:4177/ (2026-10-05T22:58:51.677Z)

SwiftShader frame times only compare scenes within this machine, not Quest speed.
## Verdict

**WORSE: 3 regression(s)**

- earth.frameMs slower: 347 -> 449 ms (x1.29)
- vr-travel.frameMs slower: 307 -> 541 ms (x1.76)
- vr-blackhole.frameMs slower: 557 -> 701 ms (x1.26)


## Scenes

| scene | a29cfba | aec525f7 |
|---|---|---|
| title | ok (66 s) | ok (60 s) |
| earth | ok (138 s) | ok (123 s) |
| moonwalk | **FAILED** scene timed out after 540 s | **FAILED** scene timed out after 540 s |
| saturn | ok (106 s) | ok (119 s) |
| jupiter | ok (58 s) | ok (53 s) |
| nebula | ok (352 s) | ok (366 s) |
| andromeda | ok (325 s) | ok (338 s) |
| blackhole | ok (353 s) | ok (342 s) |
| ship | ok (533 s) | ok (535 s) |
| god | ok (115 s) | ok (112 s) |
| vr-menu | ok (48 s) | ok (49 s) |
| vr-travel | ok (70 s) | ok (87 s) |
| vr-earth | ok (108 s) | ok (88 s) |
| vr-jupiter | ok (47 s) | ok (57 s) |
| vr-blackhole | ok (49 s) | ok (61 s) |
| vr-nebula | ok (53 s) | ok (49 s) |
| vr-andromeda | ok (98 s) | ok (107 s) |
| vr-god | ok (18 s) | ok (19 s) |

## Frame time (ms, lower is better)

| metric | a29cfba | aec525f7 | ratio |
|---|---|---|---|
| earth.frameMs | 347 | 449 | **x1.29** |
| saturn.frameMs | 21 | 26 | x1.24 |
| nebula.frameMs@3R | 26 | 30 | x1.15 |
| nebula.frameMs@0.6R | 23 | 22 | x0.96 |
| nebula.frameMs@0.1R | 29 | 21 | x0.72 |
| andromeda.frameMs | 593 | 17 | x0.03 |
| blackhole.frameMs | 418 | 411 | x0.98 |
| vr-travel.frameMs | 307 | 541 | **x1.76** |
| vr-earth.frameMs | 1244 | 1213 | x0.98 |
| vr-jupiter.frameMs | 367 | 361 | x0.98 |
| vr-blackhole.frameMs | 557 | 701 | **x1.26** |
| vr-nebula.frameMs | 335 | 126 | x0.38 |
| vr-andromeda.frameMs | 174 | 16 | x0.09 |

## New in aec525f7 (0)


## Fixed in aec525f7 (1)

- [1] **ship** switching to the chase view freezes the ship (physics off): flight.on=false, moved 0.0 m in 8 frames

## Still present in both (14)

- [1] **earth** black frame: mean 0, std 0
- [1] **moonwalk** scene failed: scene timed out after 540 s
- [3] **nebula** overlapping UI: hud-top × god-badge real (100%)
- [2] **blackhole** popping between frames (still view): 428 blocks changed >25, worst 140 (compare screenshots/cand-aec525f7/d15-bh-far-b.png)
- [2] **blackhole** popping between frames (still view): 127 blocks changed >25, worst 62 (compare screenshots/cand-aec525f7/d16-bh-mid-b.png)
- [2] **blackhole** popping between frames (still view): 13 blocks changed >25, worst 35 (compare screenshots/cand-aec525f7/d17-bh-close-b.png)
- [2] **blackhole** popping between frames (still view): 161 blocks changed >25, worst 124 (compare screenshots/cand-aec525f7/d18-sgra-b.png)
- [1] **ship** cannot launch from the Moon (W/Shift held 20 frames): alt 0.5 -> 0.5 m
- [3] **god** UI off screen: lab: "Ω (asc. node)" @875,709 92x14 | unit: "°" @1053,709 30x13 | n: "−1" @1086,708 26x15 | n: "−0.1" @1115,708 32x15 | n: "+0.1" @1150,708 32x15 | n: "+1" @118
- [3] **god** UI off screen: SPAN: "⚡ God mode" @875,-429 94x16 | x: "✕" @1239,-429 19x16 | H4: "Earth" @875,-405 384x18 | SUMMARY: "Physical" @875,-376 384x14 | lab: "Mass" @875,-356 92x14
- [3] **god** overlapping UI: hud-info × god-console (43%)
- [2] **vr-jupiter** popping between frames (still view): 82 blocks changed >25, worst 71 (compare screenshots/cand-aec525f7/v04-jupiter-b.png)
- [2] **vr-blackhole** popping between frames (still view): 470 blocks changed >25, worst 94 (compare screenshots/cand-aec525f7/v05-blackhole-b.png)
- [2] **vr-nebula** popping between frames (still view): 76 blocks changed >25, worst 50 (compare screenshots/cand-aec525f7/v06-orion-inside-b.png)

## Other metrics

```
title.simulatorStartS
  a29cfba: 1.194
  aec525f7: 1.336
earth.angDeg
  a29cfba: 36.87
  aec525f7: 36.87
moonwalk.landmark
  a29cfba: "Apollo 11 landing site"
  aec525f7: "Apollo 11 landing site"
moonwalk.walkedM
  a29cfba: 1.62
  aec525f7: 1.47
moonwalk.eyeHeightM
  a29cfba: 1.67
  aec525f7: 1.68
saturn.angDeg
  a29cfba: 36.87
  aec525f7: 36.87
andromeda.nearStars30pc
  a29cfba: 40
  aec525f7: 40
blackhole.angDeg@2000Rs
  a29cfba: 0.06
  aec525f7: 0.06
blackhole.angDeg@60Rs
  a29cfba: 1.91
  aec525f7: 1.91
blackhole.angDeg@8Rs
  a29cfba: 14.25
  aec525f7: 14.25
ship.orbit
  a29cfba: {"alt":393,"v":7673}
  aec525f7: {"alt":393,"v":7673}
ship.chase
  a29cfba: {"mode":"chase","on":false,"movedM":0,"hudChanged":false}
  aec525f7: {"mode":"chase","on":true,"movedM":200902,"hudChanged":true}
ship.warpReadout
  a29cfba: {"speed":"2.28 km/s","throttle":0,"boost":false,"altitude":"70,081 km","reference":"orbiting Earth","target":"Moon","targetKind":"Moon","distance":"2.712×10^5 km","eta":"warp: arriving in 3 s","warp":"warping","time":"2026-10-01 20:00 · real time","missions":"0 / 25 complete","hint":"W/S throttle · Y SAS · I boost · J warp · V view","flight":{"lines":["Ap 70,081 km  8 h 50 min","Pe 70,081 km  1 d 14 h","surface 3.29 km/s  vert 0.0 m/s"],"g":"0.0 g","sas":"hold attitude","fuel":1,"clocks":"ship 8.0 s · univ 8.0 s","warning":"","lock":""}}
  aec525f7: {"speed":"2.28 km/s","throttle":0,"boost":false,"altitude":"70,081 km","reference":"orbiting Earth","target":"Moon","targetKind":"Moon","distance":"2.578×10^5 km","eta":"warp: arriving in 3 s","warp":"warping","time":"2026-10-01 20:00 · real time","missions":"0 / 25 complete","hint":"W/S throttle · Y SAS · I boost · J warp · V view","flight":{"lines":["Ap 70,081 km  8 h 50 min","Pe 70,081 km  1 d 14 h","surface 3.29 km/s  vert 0.0 m/s"],"g":"0.0 g","sas":"hold attitude","fuel":1,"clocks":"ship 8.0 s · univ 8.0 s","warning":"","lock":""}}
ship.stationDuringDocking
  a29cfba: {"frames":35,"gone":0,"medianM":14593}
  aec525f7: {"frames":35,"gone":0,"medianM":14864}
ship.launch
  a29cfba: {"alt0":1,"alt1":1,"v":5}
  aec525f7: {"alt0":1,"alt1":1,"v":5}
god.consoleTail
  a29cfba: "th)✗ \"earth\" is not a number, unit or property (did you mean earth.mass?)\n  print(earth)\n        ^› create planet Nova mass=2 earth a=1.6 au✗ expected \"=\" after \"Nova\"\n  create planet Nova mass=2 earth a=1.6 au\n                     ^\n      \n      ›\n        helpscriptexamples…Circular orbitsHeavy JupiterSecond sunHot EarthBlack holeRetrograde Moon\n        ✕\n      ▶ Run scriptSave .txtLoad .txtClear"
  aec525f7: "th)✗ \"earth\" is not a number, unit or property (did you mean earth.mass?)\n  print(earth)\n        ^› create planet Nova mass=2 earth a=1.6 au✗ expected \"=\" after \"Nova\"\n  create planet Nova mass=2 earth a=1.6 au\n                     ^\n      \n      ›\n        helpscriptexamples…Circular orbitsHeavy JupiterSecond sunHot EarthBlack holeRetrograde Moon\n        ✕\n      ▶ Run scriptSave .txtLoad .txtClear"
vr-menu.menu
  a29cfba: {"distM":1.27,"widthM":1.3,"angW":54.2,"offAxisDeg":10,"canvasPx":1600,"pxPerDeg":29.5,"text24Deg":0.81,"headY":-0.03,"panelY":0.88}
  aec525f7: {"distM":1.27,"widthM":1.3,"angW":54.2,"offAxisDeg":10,"canvasPx":1600,"pxPerDeg":29.5,"text24Deg":0.81,"headY":-0.03,"panelY":0.88}
vr-menu.head
  a29cfba: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":28.07,"distR":4}
  aec525f7: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":28.07,"distR":4}
vr-travel.vignetteDuringTravel
  a29cfba: [{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0}]
  aec525f7: [{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0}]
vr-travel.saturn
  a29cfba: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":31.89,"distR":3.5}
  aec525f7: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":31.89,"distR":3.5}
vr-earth.head
  a29cfba: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":67.38,"distR":1.5}
  aec525f7: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":67.38,"distR":1.5}
vr-jupiter.head
  a29cfba: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":53.13,"distR":2}
  aec525f7: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":53.13,"distR":2}
vr-blackhole.head
  a29cfba: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":11.42,"distR":10}
  aec525f7: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":11.42,"distR":10}
vr-god.godTab
  a29cfba: {"tab":true}
  aec525f7: {"tab":true}
```

## Side by side

- d01-title: `d01-title.jpg`
- d02-simulator: `d02-simulator.jpg`
- d03-earth: `d03-earth.jpg`
- d04-earth-low: `d04-earth-low.jpg`
- d05-moon-walk: `d05-moon-walk.jpg`
- d07-saturn: `d07-saturn.jpg`
- d08-in-rings: `d08-in-rings.jpg`
- d09-jupiter: `d09-jupiter.jpg`
- d10-orion-approach: `d10-orion-approach.jpg`
- d11-orion-inside: `d11-orion-inside.jpg`
- d12-orion-core: `d12-orion-core.jpg`
- d13-andromeda-far: `d13-andromeda-far.jpg`
- d14-in-andromeda: `d14-in-andromeda.jpg`
- d15-bh-far: `d15-bh-far.jpg`
- d16-bh-mid: `d16-bh-mid.jpg`
- d17-bh-close: `d17-bh-close.jpg`
- d18-sgra: `d18-sgra.jpg`
- d19-ship-orbit: `d19-ship-orbit.jpg`
- d19b-ship-chase: `d19b-ship-chase.jpg`
- d20-ship-warp: `d20-ship-warp.jpg`
- d21-ship-arrived: `d21-ship-arrived.jpg`
- d22-ship-docked: `d22-ship-docked.jpg`
- d23-ship-landed: `d23-ship-landed.jpg`
- d24-ship-launch: `d24-ship-launch.jpg`
- d25-god-panel: `d25-god-panel.jpg`
- d26-god-reversed: `d26-god-reversed.jpg`
- d27-god-deleted: `d27-god-deleted.jpg`
- d28-god-blackhole: `d28-god-blackhole.jpg`
- d29-god-console: `d29-god-console.jpg`
- v01-menu: `v01-menu.jpg`
- v02-saturn: `v02-saturn.jpg`
- v03-earth-close: `v03-earth-close.jpg`
- v04-jupiter: `v04-jupiter.jpg`
- v05-blackhole: `v05-blackhole.jpg`
- v06-orion-inside: `v06-orion-inside.jpg`
- v07-in-andromeda: `v07-in-andromeda.jpg`
- v08-god-tab: `v08-god-tab.jpg`