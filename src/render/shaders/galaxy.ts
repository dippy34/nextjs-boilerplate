import { blackbodyRGB, luminance } from '../../astro/photometry';
import { ARM_PITCH, ARM_R_SUN, ARM_STRENGTH, ARM_WIDTH, AV_PER_PC, BAR_ANGLE, EXT_RGB, LUM, POP_TEFF, R0 } from '../../universe/Galaxy';

const f = (x: number) => (Number.isInteger(x) ? `${x}.0` : `${x}`);
const tint = (teff: number) => {
  const c = blackbodyRGB(teff);
  const L = luminance(c);
  return `vec3(${f(c[0] / L)}, ${f(c[1] / L)}, ${f(c[2] / L)})`;
};

/**
 * GLSL version of the galaxy model in universe/Galaxy.ts (same constants), plus procedural clumps:
 * dust clouds and star-forming (H II) knots in the young disk.
 */
export const GALAXY_GLSL = /* glsl */ `
const float R0 = ${f(R0)};
const float ARM_TAN = ${f(Math.tan(ARM_PITCH))};
const float ARM_SIN = ${f(Math.sin(ARM_PITCH))};
const float ARM_COS = ${f(Math.cos(ARM_PITCH))};
const float ARM_R = ${f(ARM_R_SUN)};
const float ARM_W = ${f(ARM_WIDTH)};
const vec4 ARM_S = vec4(${ARM_STRENGTH.map(f).join(', ')});
const float BAR_C = ${f(Math.cos(BAR_ANGLE))};
const float BAR_S = ${f(Math.sin(BAR_ANGLE))};
const float AV_PC = ${f(AV_PER_PC)};
const vec3 EXT = vec3(${EXT_RGB.map(f).join(', ')});
const vec3 C_OLD = ${tint(POP_TEFF.old)};
const vec3 C_YOUNG = ${tint(POP_TEFF.young)};
const vec3 C_BULGE = ${tint(POP_TEFF.bulge)};
const vec3 C_HII = vec3(1.55, 0.62, 0.9);

float gSmooth(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }

float armFactor(vec2 q) {
  float R = length(q);
  if (R < 1.0) return 0.0;
  float th = atan(q.y, q.x);
  float base = PI + log(R / ARM_R) / ARM_TAN;
  float a = 0.0;
  for (int j = 0; j < 4; j++) {
    float d = th - (base - float(j) * 0.5 * PI);
    d -= 2.0 * PI * floor(d / (2.0 * PI) + 0.5);
    float perp = R * d * ARM_SIN;
    a += ARM_S[j] * exp(-perp * perp / (2.0 * ARM_W * ARM_W));
  }
  a *= gSmooth(2800.0, 4200.0, R) * (1.0 - gSmooth(14000.0, 17000.0, R));
  vec2 s = vec2(q.x + R0, q.y);
  float along = s.x * ARM_SIN + s.y * ARM_COS;
  float across = s.x * ARM_COS - s.y * ARM_SIN;
  a += 0.55 * exp(-across * across / (2.0 * 300.0 * 300.0)) * exp(-along * along / (2.0 * 2500.0 * 2500.0));
  return a;
}

// thin, young, thick, bulge+nucleus (relative densities) and dust
void populations(vec3 p, out vec4 pop, out float dust, out float arms) {
  float R = length(p.xy);
  float az = abs(p.z);
  float hole = 1.0 - exp(-pow(R / 3000.0, 3.0));
  float outer = R > 15000.0 ? exp(-(R - 15000.0) / 1200.0) : 1.0;
  arms = armFactor(p.xy);
  pop.x = exp(-(R - R0) / 2600.0) * exp(-az / 260.0) * hole * outer;
  pop.y = exp(-(R - R0) / 3500.0) * exp(-az / 90.0) * hole * outer * (0.12 + 1.4 * arms);
  pop.z = 0.12 * exp(-(R - R0) / 2000.0) * exp(-az / 900.0) * outer;
  float xb = p.x * BAR_C - p.y * BAR_S, yb = p.x * BAR_S + p.y * BAR_C;
  float rs = pow(pow(pow(xb / 1700.0, 2.0) + pow(yb / 640.0, 2.0), 2.0) + pow(p.z / 440.0, 4.0), 0.25);
  float r = length(p);
  pop.w = 50.0 * exp(-0.5 * rs * rs) + 1.2e6 / (1.0 + pow(r / 1.5, 1.8)) * exp(-(r / 40.0) * (r / 40.0));
  dust = exp(-(R - R0) / 3200.0) * exp(-az / 110.0) * hole * outer * (0.3 + 1.1 * arms) / DUST_NORM;
}

float gHash(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float gNoise(vec3 p) {
  vec3 i = floor(p), u = fract(p);
  u = u * u * (3.0 - 2.0 * u);
  return mix(mix(mix(gHash(i), gHash(i + vec3(1, 0, 0)), u.x), mix(gHash(i + vec3(0, 1, 0)), gHash(i + vec3(1, 1, 0)), u.x), u.y),
             mix(mix(gHash(i + vec3(0, 0, 1)), gHash(i + vec3(1, 0, 1)), u.x), mix(gHash(i + vec3(0, 1, 1)), gHash(i + vec3(1, 1, 1)), u.x), u.y), u.z);
}
`;

export const GLOW_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

/**
 * Integrated starlight of the galaxy along each direction from the eye: log-spaced samples from
 * 1 pc (dust always counts) with light only beyond uNear (closer stars are drawn as stars).
 * Output: V-band column luminosity in L☉/pc², tinted by population colour (luminance = V).
 */
export function glowFrag(dustNorm: number): string {
  return /* glsl */ `
precision highp float;
#define PI 3.141592653589793
const float DUST_NORM = ${f(dustNorm)};
${GALAXY_GLSL}
uniform vec3 uCam;
uniform mat3 uToGal;
uniform float uNear;
uniform int uSteps;
uniform float uSeed;
varying vec3 vDir;

vec2 bounds(vec3 o, vec3 d) {
  float t0 = 0.0, t1 = 1e9;
  if (abs(d.z) > 1e-9) {
    float a = (-4000.0 - o.z) / d.z, b = (4000.0 - o.z) / d.z;
    t0 = max(t0, min(a, b)); t1 = min(t1, max(a, b));
  } else if (abs(o.z) > 4000.0) return vec2(0.0);
  float A = dot(d.xy, d.xy), B = 2.0 * dot(o.xy, d.xy), C = dot(o.xy, o.xy) - 22000.0 * 22000.0;
  if (A > 1e-12) {
    float disc = B * B - 4.0 * A * C;
    if (disc < 0.0) return vec2(0.0);
    float q = sqrt(disc);
    t0 = max(t0, (-B - q) / (2.0 * A)); t1 = min(t1, (-B + q) / (2.0 * A));
  } else if (C > 0.0) return vec2(0.0);
  return t1 > t0 ? vec2(t0, t1) : vec2(0.0);
}

void main() {
  vec3 d = normalize(uToGal * normalize(vDir));
  vec3 o = uCam;
  vec2 tb = bounds(o, d);
  vec3 L = vec3(0.0);
  if (tb.y > max(tb.x, uNear * 0.5)) {
    float a = max(tb.x, 1.0), b = tb.y;
    float k = log(b / a);
    float n = float(uSteps);
    float jit = gHash(vec3(gl_FragCoord.xy, uSeed));
    vec3 T = vec3(1.0);
    vec4 pop; float dust; float arms;
    for (int i = 0; i < 256; i++) {
      if (i >= uSteps) break;
      float t = a * exp(k * (float(i) + jit) / n);
      float ds = t * k / n;
      vec3 p = o + d * t;
      populations(p, pop, dust, arms);
      // clumpy interstellar medium: dust clouds and H II knots along the arms
      float cl = gNoise(p / 140.0) * 0.65 + gNoise(p / 47.0) * 0.35;
      dust *= 0.15 + 3.0 * cl * cl; // mean ~1
      // kiloparsec-scale star clouds and dust complexes along the arms (flocculent structure)
      float big = gNoise(p / vec3(700.0, 700.0, 300.0) + 5.0);
      pop.y *= 0.3 + 1.4 * big;
      dust *= 0.4 + 1.2 * big;
      float knots = pow(gNoise(p / 70.0 + 17.0), 6.0) * 9.0;
      // the old disk brightens a little in the arms too (density waves)
      vec3 j = ${f(LUM.thin)} * pop.x * (0.8 + 0.35 * arms) * C_OLD + ${f(LUM.young)} * pop.y * C_YOUNG * (0.6 + 0.8 * cl)
             + ${f(LUM.thick)} * pop.z * C_OLD + ${f(LUM.bulge)} * pop.w * C_BULGE
             + 0.012 * pop.y * knots * C_HII;
      vec3 dt = 0.921 * AV_PC * dust * EXT * ds;
      float w = gSmooth(uNear * 0.5, uNear * 1.5, t);
      L += T * j * ds * w * exp(-0.5 * dt);
      T *= exp(-dt);
      if (T.g < 1e-4) break;
    }
  }
  gl_FragColor = vec4(L, 1.0);
}`;
}
