You are a temporary helper making GAMEPLAY footage for the Space Explorer Kickstarter trailer (a Three.js real-scale space sim). The current trailer is all pretty fly-bys; the owner says it is boring because it shows no gameplay. Your job: script one gameplay sequence so it looks exciting, render it at 1080p with the game UI visible, push the clips, report, stop. Keep tool output and messages lean (usage matters). Don't modify game source (src/), don't open PRs, don't deploy, and only push to your own branch.

SETUP
1. `git fetch origin claude/upbeat-allen-8ok26x-trailer-render && git checkout -B claude/upbeat-allen-8ok26x-gameplay-NAME origin/claude/upbeat-allen-8ok26x-trailer-render`. This is the pre-sprint build. Never use other branches.
2. `npm ci` (if node_modules is missing), then `npm run build`, then `nohup npx vite preview --port 4173 --strictPort --outDir dist > /tmp/preview.log 2>&1 &` and wait for HTTP 200. Chromium for Playwright is pre-installed; never run `playwright install`. If ffmpeg is missing, `apt-get install -y ffmpeg`.

HOW TO RENDER (read scripts/trailer.mjs first; it already works)
- Its INIT init-script fakes the clock: `window.__setNow(ms)` sets performance.now. Game physics and animation run off it, so advancing 1000/24 ms per frame gives deterministic real-time gameplay at 24 fps, however slow the software GPU is. Use `app.clock.rate` for time warp.
- CAPTURE=page mode: launch Chromium with `--disable-gpu-compositing` and grab each frame with CDP `Page.captureScreenshot({format:'jpeg', quality:92, optimizeForSpeed:true})` after one requestAnimationFrame. This captures the game UI too (DOM), at ~4–5 s per 1080p frame.
- Write your own script, scripts/trailer-NAME.mjs, reusing INIT and that capture code. Drive input between frames with `page.keyboard.down/up` (keys are polled every frame) and with `window.app` calls, the same way the test scripts do.
- How to drive the game: scripts/game.mjs, scripts/flight.mjs, scripts/god.mjs and scripts/walk.mjs have working snippets. Examples: URL `?menu=0&governor=0&time=...&target=...&ship=cockpit`; KeyV cycles cockpit/chase/off; KeyJ warps to the selection (mass-locked near planets); W/S throttle, Z full, X cut; `flight.hoverOverGround(m)`; `flight.core.setCircularOrbit(...)`; `god.spawn('hole', mSun, pos)`; `god.setPosition(...)`; `god.setPhysical(...)`; `window.app.select(obj)`; `app.placeNear(obj, dist, az, el)`; `app.findByName(name)`. Read those scripts.
- Before each recorded clip, run ~3 s of game time at the starting state so exposure, terrain and textures settle. scripts/trailer.mjs does this with a 72-frame warm-up.

LOOK
- Keep the gameplay UI: cockpit and its screens, the flight HUD panel, big warnings (TIDES, TORN APART, touchdown messages) and the God panel. Hide the clutter with an injected style tag: the bottom-left selection info panel, the bottom status/help strip and the top-left fps/stats bar (find their selectors in src/ui). Usually turn labels off (`app.labels.enabled=false`). Keep orbit lines off unless they help (they help in god mode).
- Every clip needs motion and something happening. Avoid frames that are blown-out white, black, or mostly empty.
- Make a cheap test first (RES 960x540, every 6th frame), LOOK at the frames yourself, and fix the framing and timing before the full render.

OUTPUT
- 1920x1080, 24 fps. Each clip 3–6 s, as listed below. `ffmpeg -framerate 24 -i f%04d.jpg -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p clip.mp4`. Wait for ffmpeg to exit, then check with `ffprobe -v error -show_entries stream=nb_frames -of csv=p=0 clip.mp4`.
- Commit the clips as trailer-clips/NAME-a.mp4, NAME-b.mp4 and so on, plus trailer-clips/NAME-sheet.jpg (one frame per second of each clip, tiled). Also commit your script. Push to claude/upbeat-allen-8ok26x-gameplay-NAME.
- Report with the Claude Code Remote send_message tool to session_id session_013ptyBwmYiRw94xsxdPCC56: one line per clip (file, seconds, what happens). Then stop. Aim to be done within about 60–75 minutes. If something in the game can't do what's asked, pick the closest exciting alternative and say so in the report.
