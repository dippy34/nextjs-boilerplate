import { DataArrayTexture, LinearFilter, LinearMipmapLinearFilter, Matrix4, RepeatWrapping, RGBAFormat, type Texture, UnsignedByteType, Vector2 } from 'three';

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
  // rock shadows and contact shading on the ground (render/Rocks.ts): two cascades side by side
  // (near, far), R = the rocks' depth towards the Sun (exp-encoded), G = darkening around their
  // bases (seen from above); the matrices take camera-relative world positions to (u, v, depth)
  uRockMap: { value: null as Texture | null },
  uRockShM: { value: new Matrix4() },
  uRockShM1: { value: new Matrix4() },
  uRockAOM: { value: new Matrix4() },
  uRockAOM1: { value: new Matrix4() },
  uRockOn: { value: 0 },
  uRockTexel: { value: new Vector2(1 / 4096, 1 / 2048) },
};

/**
 * GLSL: shadows of the rocks at a camera-relative world point `p` (1 lit .. 0 shadowed), and the
 * contact darkening around their bases in `ao` (0 .. 1).
 */
export const ROCK_SHADOW_GLSL = /* glsl */ `
uniform sampler2D uRockMap;
uniform mat4 uRockShM;
uniform mat4 uRockShM1;
uniform mat4 uRockAOM;
uniform mat4 uRockAOM1;
uniform float uRockOn;
uniform vec2 uRockTexel;
// percentage-closer filtering of one cascade (u in [lo, lo + 0.5]); -1 outside it
float rockPcf(vec3 s, float lo, float bias, float lite) {
  vec2 e2 = vec2(min(s.x - lo, lo + 0.5 - s.x) * 2.0, min(s.y, 1.0 - s.y));
  if (min(e2.x, e2.y) < 0.002) return -1.0;
  // (R holds exp(depth / 16 m): positive, with the same relative precision everywhere)
  float ref = exp((s.z + bias) / 16.0);
  float sum = 0.0;
  if (lite > 0.5) {
    for (int i = 0; i < 4; i++) {
      vec2 o = vec2(float(i & 1), float(i >> 1)) - 0.5;
      sum += step(texture2D(uRockMap, s.xy + o * uRockTexel).r, ref);
    }
    sum *= 0.25;
  } else {
    // 3x3 texels, bilinearly weighted: smooth edges without blur
    vec2 tc = s.xy / uRockTexel - 0.5;
    vec2 f = fract(tc);
    vec2 base = (floor(tc) + 0.5) * uRockTexel;
    for (int y = -1; y <= 2; y++) for (int x = -1; x <= 2; x++) {
      float wx = x == -1 ? 1.0 - f.x : x == 2 ? f.x : 1.0;
      float wy = y == -1 ? 1.0 - f.y : y == 2 ? f.y : 1.0;
      sum += wx * wy * step(texture2D(uRockMap, base + vec2(float(x), float(y)) * uRockTexel).r, ref);
    }
    sum /= 9.0;
  }
  return mix(1.0, sum, smoothstep(0.002, 0.05, min(e2.x, e2.y)));
}
// contact darkening of one cascade, bilinear (the map is sampled nearest); -1 outside it
float rockAoAt(vec2 a, float lo) {
  vec2 e2 = vec2(min(a.x - lo, lo + 0.5 - a.x) * 2.0, min(a.y, 1.0 - a.y));
  if (min(e2.x, e2.y) < 0.002) return -1.0;
  vec2 tc = a / uRockTexel - 0.5;
  vec2 f = fract(tc);
  vec2 b = (floor(tc) + 0.5) * uRockTexel;
  float g = mix(mix(texture2D(uRockMap, b).g, texture2D(uRockMap, b + vec2(uRockTexel.x, 0.0)).g, f.x),
                mix(texture2D(uRockMap, b + vec2(0.0, uRockTexel.y)).g, texture2D(uRockMap, b + uRockTexel).g, f.x), f.y);
  return g * smoothstep(0.002, 0.05, min(e2.x, e2.y));
}
/**
 * Shadows of the rocks at a camera-relative world point p (1 lit .. 0 shadowed), and the contact
 * darkening around their bases in ao (0 .. 1): the near cascade where it reaches, the far one beyond.
 */
float rockShadow(vec3 p, float bias, float lite, out float ao) {
  ao = 0.0;
  if (uRockOn < 0.5) return 1.0;
  float lit = rockPcf((uRockShM * vec4(p, 1.0)).xyz, 0.0, bias, lite);
  if (lit < 0.0) lit = rockPcf((uRockShM1 * vec4(p, 1.0)).xyz, 0.5, bias * 3.0, lite);
  ao = rockAoAt((uRockAOM * vec4(p, 1.0)).xy, 0.0);
  if (ao < 0.0) ao = rockAoAt((uRockAOM1 * vec4(p, 1.0)).xy, 0.5);
  return lit < 0.0 ? 1.0 : lit;
}
`;

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
      // (OpenGL normal maps: green points up the image, which is -v here: rows load top first)
      nrm[o + i * 4 + 1] = 255 - nm[i * 4 + 1];
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
 * GLSL: the material detail of the ground at a point. `g`: position on the ground (m, relative to
 * the terrain patch's origin), `up`: local vertical, `tn`: the terrain's normal (all body-fixed),
 * `mpp`: metres per pixel; `sel`: the world's materials (flat A, flat B, steep, snow), `mix2`:
 * share of flat B (0..1), `snowW`: share of snow. Returns the colour factor (rgb, around 1) and the
 * bent normal (body-fixed) in `nOut`. groundDetailS also takes the body-fixed Sun direction and
 * returns the shadows the grain casts on itself (1 = lit) for low sunlight.
 *
 * Texture coordinates are fixed to the ground: the patch's offset from a material anchor near the
 * explorer (uMatO, in the anchor's east/north/up axes uTanE/uTanN, computed in double precision by
 * render/TerrainPatch.ts), so a newly built patch does not shift them. Each scale is hex-tiled
 * (Mikkelsen 2022: a triangle lattice whose vertices each show the scan at a random offset and
 * rotation, blended by the scan's height), so no repeating grid shows; four scales of 2 m to 330 m,
 * each drawn while its repeat spans enough pixels, the coarser ones blurred (only their mottling)
 * where a finer one is drawn: a scan is never seen magnified as a stretched photo.
 */
export const MATERIAL_GLSL = /* glsl */ `
${ROCK_SHADOW_GLSL}
uniform highp sampler2DArray uMatCol;
uniform highp sampler2DArray uMatNrm;
uniform float uMatOn;
uniform vec3 uTanE;      // body-fixed east, north and up of the material anchor
uniform vec3 uTanN;
uniform vec3 uMatO;      // the patch origin in the anchor's frame (m)
vec2 mrot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
vec2 mhash2(vec2 p) { p = mod(p, 289.0); return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float gMatLite;   // headset tier: one tap per material and scale instead of three (cheaper, the tiling shows more)
// one material at one scale, hex-tiled: colour (rgb), normal slope in the projection's axes (xy) and height
void hexMat(vec2 uv, vec2 gx, vec2 gy, float layer, out vec3 col, out vec2 nrm, out float hgt) {
  if (gMatLite > 0.5) {
    vec4 c1 = textureGrad(uMatCol, vec3(uv, layer), gx, gy), n1 = textureGrad(uMatNrm, vec3(uv, layer), gx, gy);
    col = c1.rgb * 2.0; nrm = n1.rg * 2.0 - 1.0; hgt = n1.a;
    return;
  }
  vec2 st = uv * 3.4641016;
  vec2 sk = vec2(st.x - 0.57735027 * st.y, 1.15470054 * st.y);
  vec2 id = floor(sk);
  vec3 t = vec3(fract(sk), 0.0);
  t.z = 1.0 - t.x - t.y;
  float s = step(0.0, -t.z), s2 = 2.0 * s - 1.0;
  vec3 w = vec3(-t.z * s2, s - t.y * s2, s - t.x * s2);
  vec2 v1 = id + vec2(s, s), v2 = id + vec2(s, 1.0 - s), v3 = id + vec2(1.0 - s, s);
  col = vec3(0.0); nrm = vec2(0.0); hgt = 0.0;
  vec4 c[3]; vec4 n[3]; float a[3];
  for (int i = 0; i < 3; i++) {
    vec2 v = i == 0 ? v1 : i == 1 ? v2 : v3;
    vec2 r = mhash2(v);
    a[i] = r.x * 6.2831853;
    vec2 q = mrot(uv, a[i]) + r * 7.31 + r.yx * 3.17;
    vec2 qx = mrot(gx, a[i]), qy = mrot(gy, a[i]);
    c[i] = textureGrad(uMatCol, vec3(q, layer), qx, qy);
    n[i] = textureGrad(uMatNrm, vec3(q, layer), qx, qy);
  }
  // sharpen the lattice weights and let the higher grain win
  vec3 W = w * w * w * vec3(0.25 + n[0].a, 0.25 + n[1].a, 0.25 + n[2].a);
  W /= W.x + W.y + W.z;
  for (int i = 0; i < 3; i++) {
    col += W[i] * c[i].rgb;
    nrm += W[i] * mrot(n[i].rg * 2.0 - 1.0, -a[i]);
    hgt += W[i] * n[i].a;
  }
  col *= 2.0;
}
// the hex-tiled height alone
float hexH(vec2 uv, vec2 gx, vec2 gy, float layer) {
  vec2 st = uv * 3.4641016;
  vec2 sk = vec2(st.x - 0.57735027 * st.y, 1.15470054 * st.y);
  vec2 id = floor(sk);
  vec3 t = vec3(fract(sk), 0.0);
  t.z = 1.0 - t.x - t.y;
  float s = step(0.0, -t.z), s2 = 2.0 * s - 1.0;
  vec3 w = vec3(-t.z * s2, s - t.y * s2, s - t.x * s2);
  vec2 v1 = id + vec2(s, s), v2 = id + vec2(s, 1.0 - s), v3 = id + vec2(1.0 - s, s);
  vec3 h;
  for (int i = 0; i < 3; i++) {
    vec2 v = i == 0 ? v1 : i == 1 ? v2 : v3;
    vec2 r = mhash2(v);
    float a = r.x * 6.2831853;
    h[i] = textureGrad(uMatNrm, vec3(mrot(uv, a) + r * 7.31 + r.yx * 3.17, layer), mrot(gx, a), mrot(gy, a)).a;
  }
  vec3 W = w * w * w * (0.25 + h);
  return dot(W, h) / (W.x + W.y + W.z);
}
vec3 groundDetailS(vec3 g, vec3 up, vec3 tn, float mpp, vec4 sel, float mix2, float snowW, float lite, vec3 sunB, out vec3 nOut, out float shadow, out float cliff) {
  vec3 e = uTanE, nr = uTanN, u3 = cross(e, nr);
  gMatLite = lite;
  shadow = 1.0;
  cliff = 0.0;
  // flat ground: the horizontal projection; cliffs: the two vertical ones, blended by the slope's direction
  float steep = smoothstep(0.16, 0.4, 1.0 - dot(tn, up));
  vec3 P = uMatO + vec3(dot(g, e), dot(g, nr), dot(g, u3));
  vec3 dPx = dFdx(P), dPy = dFdy(P);
  float te = abs(dot(tn, e)), tnr = abs(dot(tn, nr));
  float wE = smoothstep(0.35, 0.65, te / max(te + tnr, 1e-4));   // facing east/west: the north-up plane
  vec3 col = vec3(1.0);
  vec3 bend = vec3(0.0);
  float vis = 0.0;
  float S = 2.0;
  float shown = 0.0;
  float finer = 0.0;     // visibility of the next finer scale
  for (int k = 0; k < 4; k++) {
    // a scale is drawn while one repeat of it spans more than ~20 pixels
    float v = smoothstep(20.0, 90.0, S / max(mpp, 1e-4));
    if (lite > 0.5 && shown >= 2.0) v = 0.0;
    if (v > 0.002) {
      shown += 1.0;
      // where a finer scale is drawn, this one adds only its mottling (blurred), weaker
      float blur = mix(1.0, 5.0, finer);
      float amp = mix(1.0, 0.55, finer);
      vec2 o = vec2(0.37, 0.11) * float(k);
      vec2 uv = P.xy / S + o;
      vec2 gx = dPx.xy / S * blur, gy = dPy.xy / S * blur;
      vec3 cA, cB, cS, cW; vec2 nA, nB, nS, nW; float hA, hB, hS, hW;
      vec3 cF; vec2 nF; float hF;
      if (mix2 < 0.98) hexMat(uv, gx, gy, sel.x, cA, nA, hA);
      if (mix2 > 0.02) hexMat(uv + 0.5, gx, gy, sel.y, cB, nB, hB);
      if (mix2 <= 0.02) { cF = cA; nF = nA; hF = hA; }
      else if (mix2 >= 0.98) { cF = cB; nF = nB; hF = hB; }
      else {
        // height-aware blend: the higher material shows through first
        float b2 = smoothstep(-0.2, 0.2, mix2 * 2.0 - 1.0 + (hB - hA) * 0.6);
        cF = mix(cA, cB, b2); nF = mix(nA, nB, b2); hF = mix(hA, hB, b2);
      }
      if (snowW > 0.02) {
        hexMat(uv + 0.25, gx, gy, sel.w, cW, nW, hW);
        float bs = smoothstep(-0.2, 0.2, snowW * 2.0 - 1.0 + (hW - hF) * 0.5);
        cF = mix(cF, cW, bs); nF = mix(nF, nW, bs); hF = mix(hF, hW, bs);
      }
      vec3 bF = nF.x * e + nF.y * nr;
      vec3 c = cF;
      vec3 b = bF;
      if (steep > 0.02) {
        // the cliff scan on vertical planes (along north and along east), up the slope
        vec3 cS1 = vec3(0.0), cS2 = vec3(0.0); vec2 nS1 = vec2(0.0), nS2 = vec2(0.0); float hS1 = 0.0, hS2 = 0.0;
        if (wE < 0.98) hexMat(vec2(P.x, P.z) / S + o.yx, vec2(dPx.x, dPx.z) / S * blur, vec2(dPy.x, dPy.z) / S * blur, sel.z, cS1, nS1, hS1);
        if (wE > 0.02) hexMat(vec2(P.y, P.z) / S + o.yx, vec2(dPx.y, dPx.z) / S * blur, vec2(dPy.y, dPy.z) / S * blur, sel.z, cS2, nS2, hS2);
        cS = mix(cS1, cS2, wE); hS = mix(hS1, hS2, wE);
        vec3 bS = mix(nS1.x * e + nS1.y * u3, nS2.x * nr + nS2.y * u3, wE);
        // (the cliff's slopes are in its own plane: tilt them onto the terrain's)
        bS -= tn * dot(bS, tn);
        float bc = smoothstep(-0.2, 0.2, steep * 2.0 - 1.0 + (hS - hF) * 0.6);
        c = mix(cF, cS, bc);
        b = mix(bF, bS, bc);
        hF = mix(hF, hS, bc);
        cliff = max(cliff, bc * v);
      }
      col *= mix(vec3(1.0), c, v * amp);
      bend += b * v * amp / blur;
      // grain shadows at low sun (finest drawn scale, desktop): the height towards the Sun rising above the light ray
      if (lite < 0.5 && shown < 1.5 && v > 0.3) {
        vec2 sd = vec2(dot(sunB, e), dot(sunB, nr));
        float sl = length(sd);
        float su = dot(sunB, up);
        if (sl > 1e-3 && su > 0.0) {
          sd /= sl;
          float tanEl = su / sl;
          float occ = 0.0;
          // heights are about 4 % of the repeat (a 2 m scan of regolith: ~8 cm of relief)
          for (int j = 1; j <= 4; j++) {
            float dist = float(j * j) * 0.006;
            float hq = hexH(uv + sd * dist, gx, gy, mix2 > 0.5 ? sel.y : sel.x);
            occ = max(occ, ((hq - hF) * 0.04 - dist * tanEl) / 0.004);
          }
          shadow = mix(1.0, 1.0 - clamp(occ, 0.0, 1.0) * 0.85, v * (1.0 - steep));
        }
      }
      vis = max(vis, v);
    }
    finer = v;
    S *= 5.5;
  }
  nOut = normalize(tn + bend * 0.9);
  return col;
}
vec3 groundDetail(vec3 g, vec3 up, vec3 tn, float mpp, vec4 sel, float mix2, float snowW, float lite, out vec3 nOut) {
  float sh, cl;
  return groundDetailS(g, up, tn, mpp, sel, mix2, snowW, lite, up, nOut, sh, cl);
}
`;
