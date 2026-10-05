import { DataTexture, RGBAFormat, Texture, UnsignedByteType, Vector2, type WebGLRenderer } from 'three';

/**
 * Texture streaming without main-thread stalls (the Quest's CPU makes a 4096×2048 map a 50+ ms
 * hitch when it is decoded and uploaded in one go).
 *
 * - Decode off the main thread: maps are fetched as blobs and decoded by createImageBitmap
 *   (flipped there, so the upload never flips on the CPU), never as <img> elements.
 * - Budgeted uploads: `pump()` runs once per frame and uploads until its time budget is spent (at
 *   least one piece a frame). A large map is allocated once (texStorage) and then copied in strips
 *   of rows cut off the main thread, with the mipmaps generated after the last strip.
 * - A texture is handed to its material only once it is complete, so the renderer never uploads it
 *   inside a draw.
 */

/** rows per strip: 4096 × 256 RGBA = 4 MB a copy */
export const STRIP_BYTES = 4096 * 256 * 4;

export interface MapResult { tex: Texture; meanLum: number }

export interface MapOptions {
  /** fill in wrapping, filtering and colour space */
  setup?: (tex: Texture) => void;
  /** also measure the map's mean linear luminance (from a 64×32 copy resized off the main thread) */
  lum?: boolean;
  /** downscale wider maps to this width while decoding (headset memory and upload time) */
  maxWidth?: number;
}

interface Piece {
  run: () => void;
  /** pieces still to come for the same texture after this one (0 = the last) */
  left: number;
}

export class UploadQueue {
  private pieces: Piece[] = [];
  /** ms of uploading per frame (at least one piece is always done) */
  budgetMs = 3;
  /** pieces uploaded since the start, and in the last frame */
  uploaded = 0;
  lastFrame = 0;

  constructor(private readonly now: () => number = () => performance.now()) {}

  get pending(): number { return this.pieces.length; }

  /** queue work; resolves after its last piece ran */
  add(run: () => void): Promise<void> {
    return new Promise((resolve) => this.pieces.push({ run: () => { run(); resolve(); }, left: 0 }));
  }

  /** queue a texture's pieces in order; resolves after the last ran */
  addAll(runs: (() => void)[]): Promise<void> {
    return new Promise((resolve) => {
      runs.forEach((run, i) => {
        const last = i === runs.length - 1;
        this.pieces.push({ run: last ? () => { run(); resolve(); } : run, left: runs.length - 1 - i });
      });
      if (!runs.length) resolve();
    });
  }

  /** Once per frame: upload until the budget is spent. */
  pump(): void {
    const t0 = this.now();
    let n = 0;
    while (this.pieces.length) {
      const p = this.pieces.shift()!;
      try { p.run(); } catch (e) { console.warn('texture upload failed', e); }
      n++;
      if (this.now() - t0 >= this.budgetMs) break;
    }
    this.uploaded += n;
    this.lastFrame = n;
  }
}

/** The app's queue; App.frame pumps it and the renderer is set by the app. */
export const UPLOADS = new UploadQueue();
let renderer: WebGLRenderer | null = null;
export function setUploadRenderer(r: WebGLRenderer): void {
  renderer = r;
}

/** Upload an existing texture (whole) in the queue; resolves when it is on the GPU. */
export function uploadTexture(tex: Texture): Promise<Texture> {
  return UPLOADS.add(() => renderer?.initTexture(tex)).then(() => tex);
}

/** strip boundaries (row offsets and heights) for a map of `w`×`h` */
export function strips(w: number, h: number, bytes = STRIP_BYTES): [number, number][] {
  const rows = Math.max(1, Math.floor(bytes / (w * 4)));
  const out: [number, number][] = [];
  for (let y = 0; y < h; y += rows) out.push([y, Math.min(rows, h - y)]);
  return out;
}

/**
 * Fetch and decode a colour map off the main thread, then upload it in strips through the queue.
 * Resolves with the finished texture (and its mean luminance when asked).
 */
export async function loadMap(url: string, opts: MapOptions = {}): Promise<MapResult> {
  const blob = await (await fetch(url)).blob();
  const base: ImageBitmapOptions = { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' };
  let bmp = await createImageBitmap(blob, base);
  if (opts.maxWidth && bmp.width > opts.maxWidth) {
    const w = opts.maxWidth, h = Math.round(bmp.height * w / bmp.width);
    const small = await createImageBitmap(bmp, { ...base, imageOrientation: 'none', resizeWidth: w, resizeHeight: h, resizeQuality: 'high' });
    bmp.close();
    bmp = small;
  }
  const meanLum = opts.lum ? await meanLinearLuminance(bmp) : 0.3;
  const tex = await uploadBitmap(bmp, opts.setup);
  return { tex, meanLum };
}

/** Upload a decoded bitmap (already oriented for flipY = false) in strips; resolves when complete. */
export async function uploadBitmap(bmp: ImageBitmap, setup?: (tex: Texture) => void): Promise<Texture> {
  const w = bmp.width, h = bmp.height;
  const parts = strips(w, h);
  if (parts.length === 1 || !renderer) {
    // small: one piece
    const tex = new Texture(bmp);
    tex.flipY = false;
    tex.premultiplyAlpha = false;
    setup?.(tex);
    tex.needsUpdate = true;
    return uploadTexture(tex);
  }
  // cut the strips off the main thread first, then queue the copies
  const cuts = await Promise.all(parts.map(([y, n]) => createImageBitmap(bmp, 0, y, w, n, { imageOrientation: 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' })));
  bmp.close();
  const tex = new DataTexture(null, w, h, RGBAFormat, UnsignedByteType);
  tex.flipY = false;
  tex.premultiplyAlpha = false;
  setup?.(tex);
  const wantMips = tex.generateMipmaps;
  const r = renderer;
  const src = new Texture();
  src.flipY = false;
  const pos = new Vector2();
  const runs = cuts.map((cut, i) => () => {
    if (i === 0) {
      // allocate the storage (all mip levels) without data
      tex.source.dataReady = false;
      tex.generateMipmaps = wantMips;
      r.initTexture(tex);
    }
    // mipmaps once, with the last strip
    tex.generateMipmaps = wantMips && i === cuts.length - 1;
    src.image = cut;
    r.copyTextureToTexture(src, tex, null, pos.set(0, parts[i][0]));
    cut.close();
  });
  await UPLOADS.addAll(runs);
  tex.generateMipmaps = wantMips;
  // later version bumps (e.g. a filter change) must not re-upload: there is no image data to send
  tex.source.dataReady = false;
  return tex;
}

async function meanLinearLuminance(bmp: ImageBitmap): Promise<number> {
  try {
    const small = await createImageBitmap(bmp, { resizeWidth: 64, resizeHeight: 32, resizeQuality: 'medium' });
    const c = document.createElement('canvas');
    c.width = 64; c.height = 32;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(small, 0, 0);
    small.close();
    return meanLum64(ctx.getImageData(0, 0, 64, 32).data);
  } catch {
    return 0.3;
  }
}

/** Area-weighted mean linear luminance of a 64×32 equirectangular RGBA thumbnail (no-data pixels skipped). */
export function meanLum64(d: ArrayLike<number>): number {
  let sum = 0, wsum = 0;
  const lin = (v: number) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  for (let y = 0; y < 32; y++) {
    const w = Math.cos(((y + 0.5) / 32 - 0.5) * Math.PI); // area weight
    for (let x = 0; x < 64; x++) {
      const i = (y * 64 + x) * 4;
      const l = 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
      if (l < 0.002) continue; // unimaged (no-data) areas, e.g. Pluto's southern hemisphere
      sum += w * l;
      wsum += w;
    }
  }
  return wsum > 0 ? sum / wsum : 0.3;
}
