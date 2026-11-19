/**
 * God mode's sounds, synthesised with Web Audio: a deep boom for collisions (a rumble for a black
 * hole's meal), a soft whoosh when something is created, a poof when something is deleted.
 * Silent until the first user gesture (browsers block audio before that).
 */
export class GodAudio {
  enabled = true;
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;

  private context(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      try { this.ctx = new Ctx(); } catch { return null; }
      const len = this.ctx.sampleRate * 2;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      let b = 0;
      for (let i = 0; i < len; i++) { b = 0.97 * b + 0.03 * (Math.random() * 2 - 1); d[i] = b * 5; }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private noiseBurst(ctx: AudioContext, t: number, dur: number, f0: number, f1: number, gain: number, type: BiquadFilterType = 'lowpass'): void {
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(t); src.stop(t + dur + 0.05);
  }

  /** Collision: strength 0..1; `deep` for a black hole swallowing something. */
  boom(strength: number, deep = false): void {
    const ctx = this.context();
    if (!ctx) return;
    const t = ctx.currentTime;
    const s = Math.max(0.15, Math.min(1, strength));
    this.noiseBurst(ctx, t, 1.2 + 2 * s, deep ? 400 : 1600, 40, 0.5 * s);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(deep ? 55 : 90, t);
    o.frequency.exponentialRampToValueAtTime(deep ? 22 : 30, t + 1.5 + s);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.6 * s, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8 + s);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 2 + s);
  }

  whoosh(): void {
    const ctx = this.context();
    if (ctx) this.noiseBurst(ctx, ctx.currentTime, 0.7, 300, 3000, 0.18, 'bandpass');
  }

  poof(): void {
    const ctx = this.context();
    if (ctx) this.noiseBurst(ctx, ctx.currentTime, 0.45, 2500, 200, 0.2, 'bandpass');
  }
}
