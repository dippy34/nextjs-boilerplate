# Walking on the surfaces

`src/app/Walk.ts` is a first-person character controller for any solid world that has landing
terrain (`src/render/TerrainPatch.ts`). It is independent of the flight model: while you are on
foot it owns the camera, and `App.frame` skips the free-flight rig and the ground clamp.

## Controls

Desktop:

| | |
| --- | --- |
| `B` | start walking (flies down and lands first if you are high up); `B` again returns to free flight |
| `W A S D` / arrows | walk |
| mouse | look (the pointer is grabbed; `Esc` releases it, click to grab it again) |
| `Shift` | run — in low gravity this becomes the bounding lope of the Apollo films |
| `Space` | jump |
| `C`, `Ctrl` | crouch (toggle / hold) |
| `G`, `J`, `V`, digits | leave walking and do the usual thing (fly to, warp, board the ship, go to a planet) |

VR (`src/app/VR.ts`):

| | |
| --- | --- |
| wrist panel **WALK** / **FLY**, menu **Walk** button | start / stop walking |
| left thumbstick | walk, relative to where the head looks |
| left grip | run |
| right thumbstick | snap turn (or smooth turn — Settings) |
| `A` / `X` | jump |
| `Y` | the menu, as always; the laser and the panels keep working |
| Places tab → **Walk there** | choosing a place then travels there, glides down onto the site and walks |

Settings (VR menu → Settings): comfort vignette on/off, standing / seated height.
Seated (or a headset without floor-level tracking) lifts the view to a standing eye height;
standing uses the headset's own height above the floor, so you really are as tall as you are.

## Physics

* **Frame.** The walker's position and velocity live in the world's body-fixed frame, so the ground
  does not slide away as the world turns. `Walk.R` (body-fixed → world) is recovered each frame by
  probing `TerrainPatch.below` along the three world axes, and the ground below a direction comes
  from `TerrainPatch.groundRadius`, i.e. the terrain as drawn.
* **Gravity** is `GM/r²` from the world's own gravitational parameter (`Body.gm`, or `G·mass` for a
  generated planet; a density estimate for a body with no measured mass): 1.62 m/s² on the Moon,
  3.72 on Mars, 9.81 on Earth.
* **Walking** is 1.4 m/s, running 2.6–3.8 m/s (less in low gravity: traction is proportional to
  weight), crouching 0.7 m/s. Acceleration is friction-limited, so the Moon feels slippery.
* **Jumping** is a true ballistic arc: the legs give the same 2.5 m/s take-off everywhere, which is
  1.9 m high and 3.0 s long on the Moon, 0.84 m and 1.3 s on Mars, 0.32 m and 0.5 s on Earth. On a
  small moon the take-off is capped so a jump never rises more than ~25 m, and no velocity ever
  reaches 0.3 of the escape speed — you cannot accidentally jump into orbit.
* **Air control** is limited to a gentle nudge of the horizontal velocity, scaled by gravity.
* **Slopes** steeper than 35° cannot be climbed: you slide down them, with a little friction.
* **Ground following** moves along the surface and re-projects onto it each step; the drawn feet
  radius is smoothed (and clamped to 0.4 m) so a terrain LOD rebuild cannot jolt the view, while a
  real jump is not smoothed away. Walking off a cliff edge becomes a fall.
* **Rocks** (`Rocks.rocksNear`, bounding spheres) are part of what you stand on: rocks up to a
  0.4 m step are walked onto and off, you can land on top of bigger ones, and a rock taller than a
  step is solid all the way up — it stops you (body radius 0.25 m) and you slide along it.
* **Eye height** is 1.7 m standing, 1.05 m crouched, with a small landing dip and an optional
  footstep bob (desktop only, never in VR).

## Extras

`GroundMarks` (same file) leaves bootprints in regolith behind you — one per step, both feet on
landing — and kicks up dust when you land or run. The dust is ballistic (no air on the Moon;
Mars' thin air keeps fine grains up a little longer, Earth's air settles them quickly) and lands
back on the ground. Both are drawn camera-relative from body-fixed positions, over the terrain and
under its haze. Earth keeps no prints (grass, water, cities).

## Tests

* `tests/walk.test.ts` — the physics on its own: gravity per world, jump heights and times,
  frame-rate independence, the lope, slopes, ground that rises under the feet, NaN recovery, dust.
* `scripts/walk.mjs` — the real app in headless Chromium: walking at Apollo 17 and in Gale Crater,
  eye height 1.7 ± 0.1 m, jumps, running, leaving and re-entering free flight, a generated planet,
  the refusal on Jupiter, the spaceship; then the same in an emulated Quest 3 (IWER): the wrist
  button, the thumbsticks, snap turn, `A` to jump, the comfort vignette, the menu.
* `scripts/shots/walk.mjs` — views for visual review (standing, bootprints, dust).
