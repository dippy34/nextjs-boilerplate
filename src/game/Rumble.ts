/**
 * The low sound of something enormous: a deep rumble (brown noise through a low-pass) and a slow,
 * beating drone that swell as a massive body fills the view, pitched lower the heavier it is
 * (src/universe/Scale.ts: rumbleLevel, rumblePitch). Subtle by design; synthesised with Web Audio,
 * its own context, created on the first click, key or touch (browsers block audio before a gesture).
 */
export class Rumble {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private drone: OscillatorNode[] = [];
  private filt: BiquadFilterNode | null = null;
  enabled = true;
  /** last level asked for (0..1), for tests */
  level = 0;
  private armed = false;

  /** Start on the first user gesture (pointer, key or touch; entering VR is a click). */
  arm(): void {
    if (this.armed || typeof window === 'undefined') return;
    this.armed = true;
    const go = () => {
      this.start();
      for (const ev of ['pointerdown', 'keydown', 'touchstart'] as const) window.removeEventListener(ev, go, true);
    };
    for (const ev of ['pointerdown', 'keydown', 'touchstart'] as const) window.addEventListener(ev, go, true);
  }

  start(): void {
    if (this.ctx) { if (this.enabled) void this.ctx.resume(); return; }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(ctx.destination);
    this.gain = out;
    // rumble: brown noise, low-passed
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) { b = 0.995 * b + 0.005 * (Math.random() * 2 - 1); d[i] = b * 14; }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 90; lp.Q.value = 0.7;
    const ng = ctx.createGain(); ng.gain.value = 0.9;
    noise.connect(lp); lp.connect(ng); ng.connect(out);
    this.filt = lp;
    // drone: a fundamental, its octave and a slightly detuned fifth that beat slowly (a headset's
    // small speakers can't make 30 Hz, the overtones carry it)
    const dg = ctx.createGain(); dg.gain.value = 0.22;
    const df = ctx.createBiquadFilter(); df.type = 'lowpass'; df.frequency.value = 220;
    for (const [mult, amp] of [[1, 1], [2.003, 0.55], [3.01, 0.25]] as const) {
      const o = ctx.createOscillator();
      o.type = mult === 1 ? 'sine' : 'triangle';
      o.frequency.value = 36 * mult;
      const og = ctx.createGain(); og.gain.value = amp;
      o.connect(og); og.connect(df);
      o.start();
      this.drone.push(o);
    }
    // a slow swell (0.07 Hz) on the drone, like something vast turning
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lg = ctx.createGain(); lg.gain.value = 0.08;
    lfo.connect(lg); lg.connect(dg.gain); lfo.start();
    df.connect(dg); dg.connect(out);
    noise.start();
    if (!this.enabled) void ctx.suspend();
  }

  setEnabled(on: boolean): void {
    if (on === this.enabled) return;
    this.enabled = on;
    if (!this.ctx) return;
    if (on) void this.ctx.resume(); else void this.ctx.suspend();
  }

  /** `level` 0..1 (rumbleLevel), `pitch` the drone's fundamental in Hz (rumblePitch). */
  update(level: number, pitch: number): void {
    this.level = level;
    if (!this.ctx || !this.gain || !this.filt) return;
    const t = this.ctx.currentTime;
    this.gain.gain.setTargetAtTime(0.22 * level * level, t, 0.8);
    this.filt.frequency.setTargetAtTime(60 + 80 * level, t, 0.8);
    this.drone.forEach((o, i) => o.frequency.setTargetAtTime(pitch * [1, 2.003, 3.01][i], t, 1.5));
  }
}
