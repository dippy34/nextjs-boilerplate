import { DataArrayTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, RGBAFormat, UnsignedByteType } from 'three';

/**
 * Ground materials for close-up surfaces (public/data/materials, pipeline/fetch_materials.py:
 * Poly Haven CC0 scans of lunar regolith, rock, sand, dry soil, snow and forest ground).
 *
 * Two texture arrays, one layer per material:
 *  - uMatCol: the colour divided by the material's mean colour (stored at half scale, so 0.5 is
 *    "the mean"): the shaders multiply a world's own colour by it, which adds the scan's pebbles,
 *    cracks and grain without changing the world's colour;
 *  - uMatNrm: the normal map (x, y in red and green) and the height (alpha), for lighting the
 *    grain and for height-aware blending between materials.
 */
export const MATERIALS = {
  uMatCol: { value: null as DataArrayTexture | null },
  uMatNrm: { value: null as DataArrayTexture | null },
  uMatOn: { value: 0 },
};

/** Layer indices (manifest order). */
export const MAT = { regolith: 0, regolithPocked: 1, rockGround: 2, cliff: 3, sand: 4, drySoil: 5, snow: 6, forest: 7 } as const;

interface Manifest { size: number; layers: { name: string; diff: string; nor: string; disp: string; mean: number[] }[] }

async function pixels(url: string, size: number): Promise<Uint8ClampedArray> {
  const blob = await fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    return r.blob();
  });
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none', resizeWidth: size, resizeHeight: size, resizeQuality: 'high' });
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  return ctx.getImageData(0, 0, size, size).data;
}

const srgb = (v: number) => { const a = v / 255; return a <= 0.04045 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2.4; };

/** Load the materials into the shared uniforms (1024 px layers on desktop, 512 in the headset tier). */
export async function loadMaterials(base: string, vr: boolean): Promise<void> {
  const m = (await fetch(`${base}/materials/manifest.json`).then((r) => r.json())) as Manifest;
  const size = vr ? 512 : Math.min(1024, m.size);
  const n = m.layers.length;
  const col = new Uint8Array(size * size * 4 * n);
  const nrm = new Uint8Array(size * size * 4 * n);
  const lut = new Float32Array(256);
  for (let i = 0; i < 256; i++) lut[i] = srgb(i);
  await Promise.all(m.layers.map(async (l, k) => {
    const [d, nm, h] = await Promise.all([pixels(`${base}/materials/${l.diff}`, size), pixels(`${base}/materials/${l.nor}`, size), pixels(`${base}/materials/${l.disp}`, size)]);
    const o = k * size * size * 4;
    for (let i = 0; i < size * size; i++) {
      for (let c = 0; c < 3; c++) col[o + i * 4 + c] = Math.min(255, Math.round((lut[d[i * 4 + c]] / Math.max(l.mean[c], 1e-3)) * 127.5));
      col[o + i * 4 + 3] = 255;
      nrm[o + i * 4] = nm[i * 4];
      nrm[o + i * 4 + 1] = nm[i * 4 + 1];
      nrm[o + i * 4 + 2] = nm[i * 4 + 2];
      nrm[o + i * 4 + 3] = h[i * 4];
    }
  }));
  const make = (data: Uint8Array) => {
    const t = new DataArrayTexture(data, size, size, n);
    t.format = RGBAFormat;
    t.type = UnsignedByteType;
    t.wrapS = t.wrapT = RepeatWrapping;
    t.minFilter = LinearMipmapLinearFilter;
    t.magFilter = LinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 4;
    t.needsUpdate = true;
    return t;
  };
  MATERIALS.uMatCol.value = make(col);
  MATERIALS.uMatNrm.value = make(nrm);
  MATERIALS.uMatOn.value = 1;
}

/**
 * GLSL: the material detail of the ground at a point. `g`: position on the ground (m, patch frame),
 * `e`/`nrt`: the patch's east and north directions, `up`: local vertical, `tn`: the terrain's normal
 * (all body-fixed), `mpp`: metres per pixel; `sel`: the world's materials (flat A, flat B, steep,
 * snow), `mix2`: share of flat B (0..1), `snowW`: share of snow. Returns the colour factor (rgb) and
 * the bent normal (body-fixed) in `nOut`.
 */
export const MATERIAL_GLSL = /* glsl */ `
uniform highp sampler2DArray uMatCol;
uniform highp sampler2DArray uMatNrm;
uniform float uMatOn;
uniform vec3 uTanE;      // body-fixed east and north at the terrain patch's centre
uniform vec3 uTanN;
float mh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// one scale of one material: texture coordinates rotated and shifted per scale (no visible tiling grid)
vec4 matCol(vec2 uv, float layer) { return texture(uMatCol, vec3(uv, layer)); }
vec4 matNrm(vec2 uv, float layer) { return texture(uMatNrm, vec3(uv, layer)); }
vec3 groundDetail(vec3 g, vec3 up, vec3 tn, float mpp, vec4 sel, float mix2, float snowW, float lite, out vec3 nOut) {
  vec3 e = uTanE, nr = uTanN;
  // slope: flat ground uses the horizontal projection, cliffs a vertical one across the slope
  float steep = smoothstep(0.18, 0.42, 1.0 - dot(tn, up));
  vec3 down = tn - up * dot(tn, up);
  vec3 side = length(down) > 1e-4 ? normalize(cross(up, down)) : e;
  vec2 pF = vec2(dot(g, e), dot(g, nr));
  vec2 pC = vec2(dot(g, side), dot(g, up));
  vec3 col = vec3(0.0);
  vec3 bend = vec3(0.0);
  float wsum = 0.0;
  float S = 2.2;
  for (int k = 0; k < 3; k++) {
    // a scale is drawn while one repeat of it spans more than ~24 pixels
    float w = smoothstep(24.0, 110.0, S / max(mpp, 1e-4));
    if (lite > 0.5 && k != 1) w = 0.0;
    if (w > 0.001) {
      float a = float(k) * 2.39996 + 0.7;
      mat2 R = mat2(cos(a), -sin(a), sin(a), cos(a));
      vec2 uf = R * pF / S + vec2(0.37, 0.11) * float(k);
      vec2 uc = R * pC / S + vec2(0.21, 0.53) * float(k);
      vec4 cA = matCol(uf, sel.x), cB = matCol(uf, sel.y), cS = matCol(uc, sel.z), cW = matCol(uf, sel.w);
      vec4 nA = matNrm(uf, sel.x), nB2 = matNrm(uf, sel.y), nS = matNrm(uc, sel.z), nW2 = matNrm(uf, sel.w);
      // height-aware blends: the higher material shows through first
      float b2 = smoothstep(-0.25, 0.25, mix2 * 2.0 - 1.0 + (nB2.a - nA.a) * 0.6);
      vec4 cF = mix(cA, cB, b2), nF = mix(nA, nB2, b2);
      float bs = smoothstep(-0.2, 0.2, snowW * 2.0 - 1.0 + (nW2.a - nF.a) * 0.5);
      cF = mix(cF, cW, bs); nF = mix(nF, nW2, bs);
      float bc = smoothstep(-0.2, 0.2, steep * 2.0 - 1.0 + (nS.a - nF.a) * 0.6);
      vec3 c = mix(cF.rgb, cS.rgb, bc) * 2.0;
      vec2 nf = (nF.rg * 2.0 - 1.0), ns = (nS.rg * 2.0 - 1.0);
      vec3 rb = R[0][0] * e + R[1][0] * nr, rn = R[0][1] * e + R[1][1] * nr;
      vec3 rbs = R[0][0] * side + R[1][0] * up, rns = R[0][1] * side + R[1][1] * up;
      vec3 bf = nf.x * rb + nf.y * rn, bsv = ns.x * rbs + ns.y * rns;
      col += w * c;
      bend += w * mix(bf, bsv, bc);
      wsum += w;
    }
    S *= 5.5;
  }
  if (wsum < 1e-3) { nOut = tn; return vec3(1.0); }
  col /= wsum;
  nOut = normalize(tn + bend / wsum * 0.9);
  // far away the detail fades into the mean (the map's own colour)
  float f = smoothstep(0.0, 0.6, wsum);
  return mix(vec3(1.0), col, f);
}
`;
