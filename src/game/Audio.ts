/**
 * Ship sounds, synthesised with Web Audio (no sound files): an engine hum that rises with the
 * throttle, a rushing sweep while the warp drive is engaged, chimes for completed missions and a
 * slow ambient pad. Starts on the first key press or click (browsers block audio before that).
 */
export class ShipAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private engine: { gain: GainNode; osc: OscillatorNode; osc2: OscillatorNode; filt: BiquadFilterNode } | null = null;
  private warp: { gain: GainNode; filt: BiquadFilterNode } | null = null;
  private pad: GainNode | null = null;
  enabled = true;
  private wanted = false;

  /** Call from a user gesture. */
  start(): void {
    this.wanted = true;
    if (this.ctx || !this.enabled) { void this.ctx?.resume(); return; }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    this.master = master;
    // noise source shared by the engine and the warp
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) { b = 0.98 * b + 0.02 * (Math.random() * 2 - 1); d[i] = b * 6; } // brownish noise
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    // engine: low hum + filtered rumble
    const eg = ctx.createGain(); eg.gain.value = 0;
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 180;
    const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 42;
    const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 63;
    const og = ctx.createGain(); og.gain.value = 0.18;
    osc.connect(og); osc2.connect(og); og.connect(filt);
    noise.connect(filt);
    filt.connect(eg); eg.connect(master);
    osc.start(); osc2.start();
    this.engine = { gain: eg, osc, osc2, filt };
    // warp: band-passed noise sweep
    const wg = ctx.createGain(); wg.gain.value = 0;
    const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.Q.value = 0.8; wf.frequency.value = 300;
    noise.connect(wf); wf.connect(wg); wg.connect(master);
    this.warp = { gain: wg, filt: wf };
    noise.start();
    // ambient pad: two slow detuned chords
    const pg = ctx.createGain(); pg.gain.value = 0;
    const pf = ctx.createBiquadFilter(); pf.type = 'lowpass'; pf.frequency.value = 900;
    for (const f of [110, 164.8, 220.5, 277.2]) {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + Math.random() * 0.07;
      const lg = ctx.createGain(); lg.gain.value = f * 0.004;
      lfo.connect(lg); lg.connect(o.frequency);
      o.connect(pf); o.start(); lfo.start();
    }
    pf.connect(pg); pg.connect(master);
    pg.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 6);
    this.pad = pg;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!this.ctx) { if (on && this.wanted) this.start(); return; }
    if (on) void this.ctx.resume(); else void this.ctx.suspend();
  }

  /** throttle 0..1, warp 0..1 */
  update(throttle: number, warp: number, active: boolean): void {
    if (!this.ctx || !this.engine || !this.warp || !this.pad) return;
    const t = this.ctx.currentTime;
    const on = active && this.enabled ? 1 : 0;
    this.engine.gain.gain.setTargetAtTime(on * (0.05 + 0.3 * throttle), t, 0.15);
    this.engine.filt.frequency.setTargetAtTime(160 + 900 * throttle, t, 0.2);
    this.engine.osc.frequency.setTargetAtTime(40 + 30 * throttle, t, 0.3);
    this.engine.osc2.frequency.setTargetAtTime(60 + 45 * throttle, t, 0.3);
    this.warp.gain.gain.setTargetAtTime(on * 0.5 * warp, t, 0.3);
    this.warp.filt.frequency.setTargetAtTime(250 + 2500 * warp, t, 0.6);
    this.pad.gain.setTargetAtTime(on * 0.035, t, 1.5);
  }

  /** A short rising chime. */
  chime(): void {
    if (!this.ctx || !this.master || !this.enabled) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = this.ctx!.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = this.ctx!.createGain(); g.gain.value = 0;
      g.gain.setValueAtTime(0, t + i * 0.09);
      g.gain.linearRampToValueAtTime(0.12, t + i * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.8);
      o.connect(g); g.connect(this.master!);
      o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.9);
    });
  }
}
