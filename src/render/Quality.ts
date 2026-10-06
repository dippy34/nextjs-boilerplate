import { QUALITY_LEVEL } from './shaders/xr';

/**
 * Adaptive quality: a governor that keeps the frame rate by stepping a global quality level down
 * when frames are missed and back up after a long run without misses.
 *
 * A browser paces frames to the display (or the headset), so a frame time only says something when
 * a frame is late: a frame counts as missed when it takes more than 1.3 times the budget (60 Hz on
 * a desktop, the session's rate in a headset). Over a fifth of the last 45 frames missed, the
 * latest among them: one level down (at most once a second). No miss for `upWait` ms: one level up;
 * a step up undone within 3 s doubles the wait (up to a minute), so the level does not oscillate.
 *
 * Levels: 0 full quality .. 3 lowest. What a level does is up to each layer (QUALITY.level):
 * the renderer scales its internal resolution on a desktop (RENDER_SCALE); in a headset, whose
 * framebuffer is fixed for the session, the volume pass and the terrain coarsen instead.
 *
 * CPU-bound frames are told apart: a late frame whose main-thread time (App.frame) took most of the
 * budget (and, where the GPU timer exists, more than the GPU) is CPU-bound. Lowering resolution
 * cannot help those (the Quest 3 benchmark: CPU 10-22 ms against 13.3, level stuck at 3 for
 * nothing), so they neither step the level down nor hold a step back up. `QUALITY.cpuBound` says
 * whether most of the recent late frames were CPU-bound (for the perf HUD).
 *
 * Off in automated browsers (navigator.webdriver: software rendering misses every frame, and test
 * screenshots must not change), unless the page has ?governor=1; ?governor=0 turns it off.
 */
export const QUALITY = { level: 0, levels: 4, enabled: true, cpuBound: false };

/** a late frame whose main thread took this share of the budget is CPU-bound */
export const CPU_BOUND_SHARE = 0.8;

/** keep the shader-side copy (shaders/xr.ts QUALITY_LEVEL) in step */
function setLevel(l: number): void {
  QUALITY.level = l;
  QUALITY_LEVEL.uQuality.value = l;
}

/** internal render resolution per level (desktop) */
export const RENDER_SCALE = [1, 0.85, 0.72, 0.6];
/** headset: the volume pass's resolution relative to its own scale, per level */
export const XR_VOLUME_FACTOR = [1, 0.85, 0.72, 0.6];
/** headset: the terrain's pixels per cell (split threshold) relative to its own, per level */
export const XR_TERRAIN_FACTOR = [1, 1.2, 1.45, 1.75];

export class Governor {
  private last = 0;
  private misses: boolean[] = [];
  private sinceChange = 0;
  private upWait = 5000;
  private lastUpAt = -1e9;
  /** of the recent late frames, which were CPU-bound */
  private cpuLate: boolean[] = [];

  constructor(enabled: boolean) {
    QUALITY.enabled = enabled;
  }

  /** Whether the governor runs here (see the class comment). */
  static wanted(): boolean {
    if (typeof location === 'undefined') return false;
    const q = new URLSearchParams(location.search).get('governor');
    if (q === '1') return true;
    if (q === '0') return false;
    return !(typeof navigator !== 'undefined' && navigator.webdriver);
  }

  /**
   * Once per frame at time `now` (ms) with the frame budget (ms) and the previous frame's
   * main-thread and GPU times (ms, -1 when unknown); true when the level changed.
   */
  update(now: number, budgetMs: number, cpuMs = -1, gpuMs = -1): boolean {
    const dt = now - this.last;
    this.last = now;
    // (paused tabs, the first frame, a session starting: no measurement)
    if (!QUALITY.enabled || !(dt > 0) || dt > 1000) return false;
    const late = dt > budgetMs * 1.3;
    const cpuBound = late && cpuMs >= budgetMs * CPU_BOUND_SHARE && !(gpuMs > cpuMs);
    // only the late frames a lower quality could fix count as misses
    this.misses.push(late && !cpuBound);
    if (this.misses.length > 45) this.misses.shift();
    if (late) {
      this.cpuLate.push(cpuBound);
      if (this.cpuLate.length > 45) this.cpuLate.shift();
      let n = 0;
      for (const c of this.cpuLate) if (c) n++;
      QUALITY.cpuBound = n > this.cpuLate.length / 2;
    }
    this.sinceChange += dt;
    let missed = 0;
    for (const m of this.misses) if (m) missed++;
    // (still missing now: a window holding the misses of a load that has passed steps no further)
    if (this.misses.length >= 30 && missed > this.misses.length * 0.2 && this.misses[this.misses.length - 1] && this.sinceChange > 1000
      && QUALITY.level < QUALITY.levels - 1) {
      setLevel(QUALITY.level + 1);
      if (now - this.lastUpAt < 3000) this.upWait = Math.min(60000, this.upWait * 2);
      this.sinceChange = 0;
      this.misses = [];
      return true;
    }
    if (missed === 0 && this.sinceChange > this.upWait && QUALITY.level > 0) {
      setLevel(QUALITY.level - 1);
      this.lastUpAt = now;
      this.sinceChange = 0;
      return true;
    }
    return false;
  }
}
