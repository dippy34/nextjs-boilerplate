# Regression gate: 464ca6e5 vs a29cfba

Baseline: http://127.0.0.1:4175/ (2026-10-05T20:49:39.727Z)
Candidate: http://127.0.0.1:4176/ (2026-10-05T20:49:39.727Z)

SwiftShader frame times only compare scenes within this machine, not Quest speed.
## Verdict

**WORSE: 25 regression(s)**

- scene god fails: page.waitForFunction: Timeout 300000ms exceeded.
- earth.frameMs slower: 335 -> 1848 ms (x5.52)
- vr-travel.frameMs slower: 1379 -> 3945 ms (x2.86)
- vr-earth.frameMs slower: 1772 -> 5415 ms (x3.06)
- vr-jupiter.frameMs slower: 643 -> 4280 ms (x6.66)
- vr-blackhole.frameMs slower: 1422 -> 4038 ms (x2.84)
- vr-nebula.frameMs slower: 561 -> 3483 ms (x6.21)
- vr-andromeda.frameMs slower: 382 -> 3298 ms (x8.63)
- new: [1] ship · NaN in state: flight.readout.tImpact
- new: [1] ship · switching to the chase view freezes the ship (physics off): flight.on=false, moved 0.0 m in 8 frames
- new: [1] ship · NaN in state: flight.readout.tImpact
- new: [1] ship · NaN in state: flight.readout.tImpact
- new: [1] god · NaN in state: flight.readout.tImpact
- new: [1] god · landing on the Moon failed: {"landed":"","ending":"CRASHED","alt":-0.04154793615452945}
- new: [1] god · NaN in state: flight.readout.tImpact
- new: [1] god · scene failed: page.waitForFunction: Timeout 300000ms exceeded.
- new: [1] vr-menu · black frame: mean 0, std 0
- new: [1] vr-travel · black frame: mean 0, std 0
- new: [1] vr-earth · black frame: mean 0, std 0
- new: [1] vr-jupiter · black frame: mean 0, std 0
- new: [1] vr-blackhole · black frame: mean 0, std 0
- new: [1] vr-nebula · black frame: mean 0, std 0
- new: [2] vr-andromeda · VR: Andromeda stars still streaming after 300 s: 
- new: [1] vr-andromeda · black frame: mean 0, std 0
- new: [1] vr-god · black frame: mean 0, std 0


## Scenes

| scene | a29cfba | 464ca6e5 |
|---|---|---|
| title | ok (122 s) | ok (123 s) |
| earth | ok (256 s) | ok (251 s) |
| moonwalk | **FAILED** page.waitForFunction: Timeout 300000ms exceeded. | **FAILED** scene timed out after 540 s |
| saturn | **FAILED** page.evaluate: Target crashed  | **FAILED** scene timed out after 540 s |
| jupiter | **FAILED** page.evaluate: Target crashed  | **FAILED** page.evaluate: Target crashed  |
| nebula | **FAILED** page.evaluate: Target crashed  | **FAILED** page.evaluate: Target crashed  |
| andromeda | **FAILED** page.evaluate: Target crashed  | **FAILED** page.evaluate: Target crashed  |
| blackhole | **FAILED** page.evaluate: Target crashed  | **FAILED** page.evaluate: Target crashed  |
| ship | **FAILED** scene timed out after 540 s | **FAILED** scene timed out after 540 s |
| god | ok (104 s) | **FAILED** page.waitForFunction: Timeout 300000ms exceeded. |
| vr-menu | ok (65 s) | ok (252 s) |
| vr-travel | ok (117 s) | ok (362 s) |
| vr-earth | ok (139 s) | ok (153 s) |
| vr-jupiter | ok (79 s) | ok (139 s) |
| vr-blackhole | ok (82 s) | ok (157 s) |
| vr-nebula | ok (76 s) | ok (135 s) |
| vr-andromeda | ok (208 s) | ok (410 s) |
| vr-god | ok (30 s) | ok (43 s) |

## Frame time (ms, lower is better)

| metric | a29cfba | 464ca6e5 | ratio |
|---|---|---|---|
| earth.frameMs | 335 | 1848 | **x5.52** |
| vr-travel.frameMs | 1379 | 3945 | **x2.86** |
| vr-earth.frameMs | 1772 | 5415 | **x3.06** |
| vr-jupiter.frameMs | 643 | 4280 | **x6.66** |
| vr-blackhole.frameMs | 1422 | 4038 | **x2.84** |
| vr-nebula.frameMs | 561 | 3483 | **x6.21** |
| vr-andromeda.frameMs | 382 | 3298 | **x8.63** |

## New in 464ca6e5 (17)

- [1] **ship** NaN in state: flight.readout.tImpact — `screenshots/cand-464ca6e5/d19-ship-orbit.png`
- [1] **ship** switching to the chase view freezes the ship (physics off): flight.on=false, moved 0.0 m in 8 frames
- [1] **ship** NaN in state: flight.readout.tImpact — `screenshots/cand-464ca6e5/d20-ship-warp.png`
- [1] **ship** NaN in state: flight.readout.tImpact — `screenshots/cand-464ca6e5/d21-ship-arrived.png`
- [1] **god** NaN in state: flight.readout.tImpact — `screenshots/cand-464ca6e5/d22-ship-docked.png`
- [1] **god** landing on the Moon failed: {"landed":"","ending":"CRASHED","alt":-0.04154793615452945}
- [1] **god** NaN in state: flight.readout.tImpact — `screenshots/cand-464ca6e5/d24-ship-launch.png`
- [1] **god** scene failed: page.waitForFunction: Timeout 300000ms exceeded.
- [1] **vr-menu** black frame: mean 0, std 0 — `screenshots/cand-464ca6e5/v01-menu.png`
- [1] **vr-travel** black frame: mean 0, std 0 — `screenshots/cand-464ca6e5/v02-saturn.png`
- [1] **vr-earth** black frame: mean 0, std 0 — `screenshots/cand-464ca6e5/v03-earth-close.png`
- [1] **vr-jupiter** black frame: mean 0, std 0 — `screenshots/cand-464ca6e5/v04-jupiter.png`
- [1] **vr-blackhole** black frame: mean 0, std 0 — `screenshots/cand-464ca6e5/v05-blackhole.png`
- [1] **vr-nebula** black frame: mean 0, std 0 — `screenshots/cand-464ca6e5/v06-orion-inside.png`
- [2] **vr-andromeda** VR: Andromeda stars still streaming after 300 s: 
- [1] **vr-andromeda** black frame: mean 0, std 0 — `screenshots/cand-464ca6e5/v07-in-andromeda.png`
- [1] **vr-god** black frame: mean 0, std 0 — `screenshots/cand-464ca6e5/v08-god-tab.png`

## Fixed in 464ca6e5 (4)

- [3] **god** UI off screen: lab: "Ω (asc. node)" @875,709 92x14 | unit: "°" @1053,709 30x13 | n: "−1" @1086,708 26x15 | n: "−0.1" @1115,708 32x15 | n: "+0.1" @1150,708 32x15 | n: "+1" @118
- [3] **god** UI off screen: SPAN: "⚡ God mode" @875,-429 94x16 | x: "✕" @1239,-429 19x16 | H4: "Earth" @875,-405 384x18 | SUMMARY: "Physical" @875,-376 384x14 | lab: "Mass" @875,-356 92x14
- [3] **god** overlapping UI: hud-info × god-console (42%)
- [2] **vr-blackhole** popping between frames (still view): 172 blocks changed >25, worst 78 (compare screenshots/base-a29cfba/v05-blackhole-b.png)

## Still present in both (8)

- [1] **earth** black frame: mean 0, std 0
- [1] **moonwalk** scene failed: scene timed out after 540 s
- [1] **saturn** scene failed: scene timed out after 540 s
- [1] **jupiter** scene failed: page.evaluate: Target crashed 
- [1] **nebula** scene failed: page.evaluate: Target crashed 
- [1] **andromeda** scene failed: page.evaluate: Target crashed 
- [1] **blackhole** scene failed: page.evaluate: Target crashed 
- [1] **ship** scene failed: scene timed out after 540 s

## Other metrics

```
title.simulatorStartS
  a29cfba: 0.556
  464ca6e5: 1.193
earth.angDeg
  a29cfba: 36.87
  464ca6e5: 36.87
moonwalk.landmark
  a29cfba: "Apollo 11 landing site"
  464ca6e5: "Apollo 11 landing site"
ship.orbit
  a29cfba: {"alt":393,"v":7673}
  464ca6e5: {"alt":393,"v":7673}
god.consoleTail
  a29cfba: "th)✗ \"earth\" is not a number, unit or property (did you mean earth.mass?)\n  print(earth)\n        ^› create planet Nova mass=2 earth a=1.6 au✗ expected \"=\" after \"Nova\"\n  create planet Nova mass=2 earth a=1.6 au\n                     ^\n      \n      ›\n        helpscriptexamples…Circular orbitsHeavy JupiterSecond sunHot EarthBlack holeRetrograde Moon\n        ✕\n      ▶ Run scriptSave .txtLoad .txtClear"
  464ca6e5: undefined
vr-menu.menu
  a29cfba: {"distM":1.27,"widthM":1.3,"angW":54.2,"offAxisDeg":10,"canvasPx":1600,"pxPerDeg":29.5,"text24Deg":0.81,"headY":-0.03,"panelY":0.88}
  464ca6e5: {"distM":1.27,"widthM":1.3,"angW":54.2,"offAxisDeg":10,"canvasPx":1600,"pxPerDeg":29.5,"text24Deg":0.81,"headY":-0.03,"panelY":0.88}
vr-menu.head
  a29cfba: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":28.07,"distR":4}
  464ca6e5: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":28.07,"distR":4}
vr-travel.vignetteDuringTravel
  a29cfba: [{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0}]
  464ca6e5: [{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0},{"t":false,"vig":true,"tun":0}]
vr-travel.saturn
  a29cfba: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":31.89,"distR":3.5}
  464ca6e5: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":31.89,"distR":3.5}
vr-earth.head
  a29cfba: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":67.38,"distR":1.5}
  464ca6e5: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":67.38,"distR":1.5}
vr-jupiter.head
  a29cfba: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":53.13,"distR":2}
  464ca6e5: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":53.13,"distR":2}
vr-blackhole.head
  a29cfba: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":11.42,"distR":10}
  464ca6e5: {"ipdM":0.06300000101327896,"rigScale":1,"angDeg":11.42,"distR":10}
vr-god.godTab
  a29cfba: {"tab":true}
  464ca6e5: {"tab":true}
ship.chase
  a29cfba: undefined
  464ca6e5: {"mode":"chase","on":false,"movedM":0,"hudChanged":false}
ship.warpReadout
  a29cfba: undefined
  464ca6e5: {"speed":"2.28 km/s","throttle":0,"boost":false,"altitude":"70,081 km","reference":"orbiting Earth","target":"Moon","targetKind":"Moon","distance":"2.272×10^5 km","eta":"warp: arriving in 3 s","warp":"warping","time":"2026-10-01 20:00 · real time","missions":"0 / 25 complete","hint":"W/S throttle · Y SAS · I boost · J warp · V view","flight":{"lines":["Ap 70,081 km  8 h 50 min","Pe 70,081 km  1 d 14 h","surface 3.29 km/s  vert 0.0 m/s"],"g":"0.0 g","sas":"hold attitude","fuel":1,"clocks":"ship 8.0 s · univ 8.0 s","warning":"","lock":""}}
god.stationDuringDocking
  a29cfba: undefined
  464ca6e5: {"frames":35,"gone":0,"medianM":14787}
god.launch
  a29cfba: undefined
  464ca6e5: {"alt0":3505,"alt1":279803,"v":24}
```

## Side by side

- d01-title: `d01-title.jpg`
- d02-simulator: `d02-simulator.jpg`
- d03-earth: `d03-earth.jpg`
- d04-earth-low: `d04-earth-low.jpg`
- d19-ship-orbit: `d19-ship-orbit.jpg`
- v01-menu: `v01-menu.jpg`
- v02-saturn: `v02-saturn.jpg`
- v03-earth-close: `v03-earth-close.jpg`
- v04-jupiter: `v04-jupiter.jpg`
- v05-blackhole: `v05-blackhole.jpg`
- v06-orion-inside: `v06-orion-inside.jpg`
- v07-in-andromeda: `v07-in-andromeda.jpg`
- v08-god-tab: `v08-god-tab.jpg`