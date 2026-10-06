import {
  LinearFilter, LinearMipmapLinearFilter, Mesh, NoBlending, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial,
  Texture, Vector3, Vector4, WebGLRenderTarget, type WebGLRenderer,
} from 'three';

/** Index written by pipeline/build_tiles.py. */
export interface TileIndex {
  tileSize: number;
  bodies: Record<string, { maxLevel: number; channels: string; source: string }>;
}

/** What the body shader needs to sample the detail texture. */
export interface DetailBinding {
  texture: Texture;
  /** map-UV window covered by the texture: u0, v0, du, dv (u wraps) */
  rect: Vector4;
  /** texels around the equator at the window's level (for close-up procedural detail) */
  mapWidth: number;
}

const COPY_VERT = /* glsl */ `
uniform vec4 uDst;   // destination rect in the atlas (0..1): x, y, w, h
uniform vec4 uSrc;   // source rect in the source texture's UV: u0, v0, du, dv (u may wrap)
varying vec2 vSrc;
void main() {
  vec2 p = position.xy * 0.5 + 0.5;
  vSrc = uSrc.xy + p * uSrc.zw;
  gl_Position = vec4((uDst.xy + p * uDst.zw) * 2.0 - 1.0, 0.0, 1.0);
}`;
const COPY_FRAG = /* glsl */ `
uniform sampler2D uTex;
varying vec2 vSrc;
void main() { gl_FragColor = vec4(texture2D(uTex, vec2(fract(vSrc.x), vSrc.y)).rgb, 1.0); }`;

/**
 * Close-up detail for the body being approached: tiles of the map pyramid (512 px, level L has
 * 2^(L+1) x 2^L of them) around the point of the surface under the view are composed into one
 * atlas texture covering a window of the map; the body shader samples it inside the window and the
 * global map outside. Until a tile arrives its area shows the parent tile (or the global map).
 */
export class TileDetail {
  private index: TileIndex | null = null;
  private rt: WebGLRenderTarget;
  private n: number;
  private scene = new Scene();
  private cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private mat: ShaderMaterial;
  /** decoded tiles, most recently used last */
  private cache = new Map<string, Texture>();
  private pending = new Set<string>();
  private maxCache: number;
  /** current window: body key, level, first column, first row */
  private win: { key: string; level: number; c0: number; r0: number } | null = null;
  /** tiles drawn into the atlas for the current window, at the level they were drawn */
  private drawn = new Map<string, number>();
  private dirty = false;
  readonly binding: DetailBinding;
  /** body map key the binding belongs to (null = none) */
  activeKey: string | null = null;

  constructor(private base: string, vr = false) {
    this.n = vr ? 4 : 8;
    this.maxCache = vr ? 48 : 160;
    this.rt = this.makeTarget();
    this.mat = new ShaderMaterial({
      vertexShader: COPY_VERT, fragmentShader: COPY_FRAG,
      uniforms: { uTex: { value: null }, uDst: { value: new Vector4() }, uSrc: { value: new Vector4() } },
      depthTest: false, depthWrite: false, blending: NoBlending,
    });
    const quad = new Mesh(new PlaneGeometry(2, 2), this.mat);
    quad.frustumCulled = false;
    this.scene.add(quad);
    this.binding = { texture: this.rt.texture, rect: new Vector4(0, 0, 1, 1), mapWidth: 0 };
    fetch(`${base}/tiles.json`).then((r) => (r.ok ? r.json() : null)).then((j) => { this.index = j; }).catch(() => undefined);
  }

  private makeTarget(): WebGLRenderTarget {
    const s = this.n * 512;
    const rt = new WebGLRenderTarget(s, s, { depthBuffer: false, generateMipmaps: true, minFilter: LinearMipmapLinearFilter, magFilter: LinearFilter });
    rt.texture.anisotropy = 4;
    return rt;
  }

  has(key: string): boolean {
    return !!this.index?.bodies[key];
  }

  /**
   * Choose the window for body map `key` seen from `camBF` (camera position in the body-fixed
   * frame, metres) with the view's centre ray `dirBF` (body-fixed unit vector), and refresh the atlas.
   * `lonLeft` is the map's left-edge longitude (deg). Returns false if no detail is needed.
   */
  update(gl: WebGLRenderer, key: string, globalMap: Texture | null, radius: number, camBF: Vector3, dirBF: Vector3, pixelAngle: number, lonLeft: number): boolean {
    const info = this.index?.bodies[key];
    if (!info || !globalMap) { this.activeKey = null; return false; }
    const d = camBF.length();
    const alt = Math.max(d - radius, radius * 1e-4);
    // the surface point under the centre of the view (or straight below)
    const p = hitSphere(camBF, dirBF, radius) ?? camBF.clone().normalize();
    const ang = Math.acos(Math.max(-1, Math.min(1, p.clone().normalize().dot(camBF.clone().normalize()))));
    // distance to that point sets the needed texel size (at least the altitude)
    const dist = Math.max(alt, p.clone().multiplyScalar(radius / p.length()).distanceTo(camBF));
    const needTexels = (2 * Math.PI * radius) / Math.max(dist * pixelAngle, 1e-6);
    let level = Math.ceil(Math.log2(needTexels / 1024));
    if (level < 3 || ang > 1.4) { this.activeKey = null; return false; }
    level = Math.min(level, info.maxLevel);
    const cols = 2 ** (level + 1), rows = 2 ** level;
    const n = Math.min(this.n, rows);
    const lon = Math.atan2(p.y, p.x) * (180 / Math.PI);
    const lat = Math.asin(Math.max(-1, Math.min(1, p.z / p.length()))) * (180 / Math.PI);
    const u = (((lon - lonLeft) % 360) + 360) % 360 / 360;
    const v = (90 - lat) / 180; // from the top
    const c0 = Math.floor(u * cols - n / 2 + 0.5);
    const r0 = Math.max(0, Math.min(rows - n, Math.floor(v * rows - n / 2 + 0.5)));
    const w = this.win;
    if (!w || w.key !== key || w.level !== level || Math.abs(w.c0 - c0) > 1 || Math.abs(w.r0 - r0) > 1) {
      this.win = { key, level, c0: ((c0 % cols) + cols) % cols, r0 };
      this.drawn.clear();
      this.fillFromGlobal(gl, globalMap);
    }
    const win = this.win!;
    // request and draw the window's tiles (falling back to their parents)
    let changed = false;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const r = win.r0 + i, c = (win.c0 + j) % cols;
        const id = `${level}/${r}_${c}`;
        if ((this.drawn.get(id) ?? -1) >= level) continue;
        const tex = this.tile(key, level, r, c);
        if (tex) { this.drawTile(gl, tex, i, j, n, null); this.drawn.set(id, level); changed = true; continue; }
        // parent tiles fill in until the tile itself arrives
        for (let pl = level - 1; pl >= 3; pl--) {
          const k = level - pl, pr = r >> k, pc = c >> k;
          if ((this.drawn.get(id) ?? -1) >= pl) break;
          const pt = this.cache.get(`${key}/${pl}/${pr}_${pc}`);
          if (!pt) continue;
          const s = 1 / 2 ** k;
          this.drawTile(gl, pt, i, j, n, new Vector4((c - (pc << k)) * s, 1 - (r - (pr << k) + 1) * s, s, s));
          this.drawn.set(id, pl);
          changed = true;
          break;
        }
      }
    }
    if (changed || this.dirty) this.finish(gl);
    this.activeKey = key;
    this.binding.rect.set(win.c0 / cols, 1 - (win.r0 + n) / rows, n / cols, n / rows);
    this.binding.mapWidth = 512 * cols;
    return true;
  }

  /** The window's area of the global map, so the atlas is complete before any tile arrives. */
  private fillFromGlobal(gl: WebGLRenderer, map: Texture): void {
    const w = this.win!;
    const cols = 2 ** (w.level + 1), rows = 2 ** w.level;
    const n = Math.min(this.n, rows);
    this.mat.uniforms.uTex.value = map;
    (this.mat.uniforms.uDst.value as Vector4).set(0, 0, n / this.n, n / this.n);
    (this.mat.uniforms.uSrc.value as Vector4).set(w.c0 / cols, 1 - (w.r0 + n) / rows, n / cols, n / rows);
    this.render(gl, false);
    this.dirty = true;
  }

  private drawTile(gl: WebGLRenderer, tex: Texture, i: number, j: number, n: number, src: Vector4 | null): void {
    void n;
    this.mat.uniforms.uTex.value = tex;
    const s = 1 / this.n;
    (this.mat.uniforms.uDst.value as Vector4).set(j * s, 1 - (i + 1) * s, s, s);
    (this.mat.uniforms.uSrc.value as Vector4).copy(src ?? new Vector4(0, 0, 1, 1));
    this.render(gl, false);
    this.dirty = true;
  }

  private finish(gl: WebGLRenderer): void {
    // an empty pass with mipmapping on regenerates the atlas mipmaps once per batch
    this.mat.uniforms.uTex.value = null;
    (this.mat.uniforms.uDst.value as Vector4).set(0, 0, 0, 0);
    this.render(gl, true);
    this.dirty = false;
  }

  private render(gl: WebGLRenderer, mips: boolean): void {
    const prev = gl.getRenderTarget();
    const xrWas = gl.xr.enabled;
    const clearWas = gl.autoClear;
    gl.xr.enabled = false;
    gl.autoClear = false;
    this.rt.texture.generateMipmaps = mips;
    gl.setRenderTarget(this.rt);
    gl.render(this.scene, this.cam);
    gl.setRenderTarget(prev);
    gl.autoClear = clearWas;
    gl.xr.enabled = xrWas;
  }

  /** A tile if decoded; otherwise starts loading it and returns null. */
  private tile(key: string, level: number, r: number, c: number): Texture | null {
    const id = `${key}/${level}/${r}_${c}`;
    const t = this.cache.get(id);
    if (t) {
      this.cache.delete(id);
      this.cache.set(id, t);
      return t;
    }
    if (!this.pending.has(id) && this.pending.size < 12) {
      this.pending.add(id);
      fetch(`${this.base}/${key.replace(/_day$/, '')}/${level}/${r}_${c}.jpg`)
        .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.blob(); })
        .then((b) => createImageBitmap(b, { imageOrientation: 'flipY' }))
        .then((bmp) => {
          const tex = new Texture(bmp);
          tex.flipY = false;
          tex.minFilter = LinearFilter;
          tex.generateMipmaps = false;
          tex.needsUpdate = true;
          this.cache.set(id, tex);
          while (this.cache.size > this.maxCache) {
            const [old, ot] = this.cache.entries().next().value as [string, Texture];
            ot.dispose();
            (ot.image as ImageBitmap).close?.();
            this.cache.delete(old);
          }
        })
        .catch(() => undefined)
        .finally(() => this.pending.delete(id));
    }
    return null;
  }

  dispose(): void {
    this.rt.dispose();
    for (const t of this.cache.values()) t.dispose();
    this.cache.clear();
  }
}

/** First intersection of the ray from `o` along unit `d` with the sphere of radius `r` at the origin. */
function hitSphere(o: Vector3, d: Vector3, r: number): Vector3 | null {
  const b = o.dot(d);
  const c = o.lengthSq() - r * r;
  const disc = b * b - c;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  if (t < 0) return null;
  return o.clone().addScaledVector(d, t);
}
