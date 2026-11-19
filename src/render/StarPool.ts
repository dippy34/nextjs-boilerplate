import { BufferAttribute, BufferGeometry, DataTexture, FloatType, NearestFilter, RGBAFormat } from 'three';
import { STAR_VERT } from './StarField';

/**
 * One buffer for all procedural stars (the Milky Way's and other galaxies'), drawn in a single call.
 *
 * Stars live in fixed chunks of CHUNK vertices; a cell takes as many chunks as it needs (not
 * necessarily adjacent) and every vertex carries its cell's slot. Per slot a float texture holds
 * the cell centre minus the eye (pc, computed in double precision on the CPU each frame, so stars
 * stay steady at any distance), the extra magnitudes (dust, fade-in) and the band's reach, beyond
 * which its stars fade out. Free chunks point at slot 0, which is always hidden.
 */
export const CHUNK = 128;
const W = 128;
/** slot texels: [offset.xyz, extra mag (≥ 50: hidden)], [reach pc, 0, 0, 0] */
const TEXELS = 2;

export const POOL_VERT = (() => {
  const a = 'vec3 rel = uOffset + aPos * uScale;';
  const b = '- 5.0 + uExtinction;';
  if (!STAR_VERT.includes(a) || !STAR_VERT.includes(b)) throw new Error('StarPool: STAR_VERT changed');
  return STAR_VERT
    .replace('attribute float aMT;', `attribute float aMT;
attribute float aCell;
uniform sampler2D uSlots;`)
    .replace(a, `int s0 = int(aCell + 0.5) * ${TEXELS};
  vec4 sA = texelFetch(uSlots, ivec2(s0 % ${W}, s0 / ${W}), 0);
  vec4 sB = texelFetch(uSlots, ivec2((s0 + 1) % ${W}, (s0 + 1) / ${W}), 0);
  vec3 rel = sA.xyz + aPos;
  // past 80% of the band's reach its stars fade out (the volume takes their light back)
  float reachFade = 1.0 - smoothstep(0.8 * sB.x, sB.x, length(rel));
  if (sA.w > 50.0 || reachFade <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 1.0;
    return;
  }`)
    .replace(b, '- 5.0 + sA.w - 1.0857 * log(reachFade);');
})();

export interface PoolHandle { slot: number; chunks: number[]; count: number }

export class StarPool {
  readonly geometry = new BufferGeometry();
  readonly slots: DataTexture;
  readonly capacity: number;
  private pos: Float32Array;
  private mt: Uint16Array;
  private cellOf: Uint16Array;
  private freeChunks: number[] = [];
  private freeSlots: number[] = [];
  private slotData: Float32Array;
  /** stars stored */
  used = 0;
  private top = 0;

  constructor(capacity: number, readonly maxSlots = 4096) {
    const nChunks = Math.ceil(capacity / CHUNK);
    this.capacity = nChunks * CHUNK;
    this.pos = new Float32Array(this.capacity * 3);
    this.mt = new Uint16Array(this.capacity);
    this.cellOf = new Uint16Array(this.capacity);
    const pa = new BufferAttribute(this.pos, 3);
    this.geometry.setAttribute('aPos', pa);
    this.geometry.setAttribute('position', pa);
    this.geometry.setAttribute('aMT', new BufferAttribute(this.mt, 1, false));
    this.geometry.setAttribute('aCell', new BufferAttribute(this.cellOf, 1, false));
    this.geometry.setDrawRange(0, 0);
    // lowest first (pop from the end), so the draw range stays tight
    for (let i = nChunks - 1; i >= 0; i--) this.freeChunks.push(i);
    for (let i = maxSlots - 1; i >= 1; i--) this.freeSlots.push(i);
    const H = Math.ceil((maxSlots * TEXELS) / W);
    this.slotData = new Float32Array(W * H * 4);
    this.slots = new DataTexture(this.slotData, W, H, RGBAFormat, FloatType);
    this.slots.minFilter = this.slots.magFilter = NearestFilter;
    this.hide(0);
    this.slots.needsUpdate = true;
  }

  get freeStars(): number {
    return this.freeChunks.length * CHUNK;
  }

  /** Store `count` stars (positions relative to the cell centre, packed magnitude/colour); null if full. */
  add(pos: Float32Array, mt: Uint16Array, count: number): PoolHandle | null {
    const need = Math.ceil(count / CHUNK);
    if (!count || need > this.freeChunks.length || !this.freeSlots.length) return null;
    this.freeChunks.sort((a, b) => b - a);
    const slot = this.freeSlots.pop()!;
    const chunks = this.freeChunks.splice(this.freeChunks.length - need, need);
    const pa = this.geometry.attributes.aPos as BufferAttribute;
    const ma = this.geometry.attributes.aMT as BufferAttribute;
    const ca = this.geometry.attributes.aCell as BufferAttribute;
    for (let j = 0; j < chunks.length; j++) {
      const v0 = chunks[j] * CHUNK, i0 = j * CHUNK, n = Math.min(CHUNK, count - i0);
      this.pos.set(pos.subarray(i0 * 3, (i0 + n) * 3), v0 * 3);
      this.mt.set(mt.subarray(i0, i0 + n), v0);
      this.cellOf.fill(slot, v0, v0 + n);
      // (the rest of a cell's last chunk stays on the hidden slot)
      this.cellOf.fill(0, v0 + n, v0 + CHUNK);
      pa.addUpdateRange(v0 * 3, CHUNK * 3); ma.addUpdateRange(v0, CHUNK); ca.addUpdateRange(v0, CHUNK);
      this.top = Math.max(this.top, chunks[j] + 1);
    }
    pa.needsUpdate = ma.needsUpdate = ca.needsUpdate = true;
    this.used += count;
    this.geometry.setDrawRange(0, this.top * CHUNK);
    this.hide(slot);
    return { slot, chunks, count };
  }

  remove(h: PoolHandle): void {
    const ca = this.geometry.attributes.aCell as BufferAttribute;
    for (const c of h.chunks) {
      this.cellOf.fill(0, c * CHUNK, (c + 1) * CHUNK);
      ca.addUpdateRange(c * CHUNK, CHUNK);
      this.freeChunks.push(c);
    }
    ca.needsUpdate = true;
    this.hide(h.slot);
    this.freeSlots.push(h.slot);
    this.used -= h.count;
    // shrink the draw range past free chunks at the top
    const free = new Set(this.freeChunks);
    while (this.top > 0 && free.has(this.top - 1)) this.top--;
    this.geometry.setDrawRange(0, this.top * CHUNK);
  }

  /** Show slot `s` this frame: cell centre minus eye (pc), extra magnitudes, band reach (pc). */
  show(s: number, ox: number, oy: number, oz: number, mag: number, reachPc: number): void {
    const o = s * TEXELS * 4;
    const d = this.slotData;
    d[o] = ox; d[o + 1] = oy; d[o + 2] = oz; d[o + 3] = Math.min(mag, 49);
    d[o + 4] = reachPc;
  }

  hide(s: number): void {
    this.slotData[s * TEXELS * 4 + 3] = 99;
  }

  /** after the frame's show/hide calls */
  commit(): void {
    this.slots.needsUpdate = true;
  }
}
