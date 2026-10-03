import { FIX_LOGDEPTH, OUTPUT_FRAGMENT, PROJECT_PARS } from './xr';

/**
 * Black hole: gravitational lensing of everything behind it plus a thin accretion disk,
 * traced per pixel in the Schwarzschild metric. Units: Schwarzschild radius rs = 1.
 *
 * A photon moves in the plane spanned by its position and direction; with u = 1/r its orbit
 * obeys d²u/dφ² = −u + 1.5 u² (Binet equation with the GR term). Rays are traced backwards
 * from the eye with RK4 in φ until they escape (u → 0, the direction there is the asymptote)
 * or fall in (u ≥ 1). The background is the scene as seen from the eye without the hole (a
 * cube map refreshed a face per frame), looked up in the escape direction. Rays that stay far
 * from the hole (impact parameter and eye distance > 30 rs) use the weak-field deflection
 * 2/b + 15π/(16 b²), scaled by the fraction still ahead of the eye.
 *
 * The disk plane is crossed where n·(cos φ e1 + sin φ e2) = 0, i.e. every π from a known
 * angle, so crossings are found exactly. Emission: Novikov–Thorne/Shakura–Sunyaev temperature
 * profile with a zero-torque inner edge at the ISCO (3 rs); gas on circular orbits seen by a
 * static observer moves at β = sqrt(rs / (2 (r − rs))); the observed temperature is g·T with
 * g = sqrt(1 − rs/r) / (γ (1 − β cos θ)) (gravitational redshift and Doppler shift), and a
 * blackbody at temperature T stays a blackbody at g·T, so beaming comes out of the Planck
 * lookup by itself.
 */
export const BH_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec3 vWorld;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

export const BH_FRAG = /* glsl */ `
precision highp float;
#include <common>
#include <logdepthbuf_pars_fragment>
uniform samplerCube uEnv;
uniform sampler2D uLut;      // blackbody: rgb chromaticity (luminance 1), a = log10(Y / Y_sun)
uniform vec3 uO;             // eye (rig origin) relative to the hole, in rs
uniform float uRs;           // metres per rs
uniform vec3 uN;             // disk normal (unit)
uniform vec3 uE1;            // disk plane basis (texture angle)
uniform vec3 uE2;
uniform float uRin;          // disk inner / outer radius (rs); uRout = 0: no disk
uniform float uRout;
uniform float uTmax;         // peak disk temperature (K)
uniform float uSunDisk;      // radiance of the Sun's disk (engine units)
uniform float uExposure;
uniform float uTime;
uniform int uMaxSteps;
uniform float uStepK;
varying vec3 vWorld;

const float LUT_LOG_MIN = 2.5;
const float LUT_LOG_SPAN = 5.5;

vec3 planck(float T) {
  float x = clamp((log2(max(T, 1.0)) * 0.30103 - LUT_LOG_MIN) / LUT_LOG_SPAN, 0.0, 1.0);
  vec4 t = texture2D(uLut, vec2(x * (255.0 / 256.0) + 0.5 / 256.0, 0.5));
  return t.rgb * exp2(t.a * 3.3219281);
}

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
// Streaky gas: noise on (angle on a circle, log r), stretched along the orbit, advected with a
// slowed-down Keplerian angular speed. Two layers cross-fade so the shear never winds up.
float streaks(float lr, float ang, float seed) {
  float n = 0.0, amp = 0.6, fr = 1.0;
  for (int o = 0; o < 3; o++) {
    vec3 q = vec3(cos(ang) * 2.2 * fr, sin(ang) * 2.2 * fr, lr * 9.0 * fr + seed);
    n += amp * vnoise(q);
    amp *= 0.5; fr *= 2.3;
  }
  return n;
}
float diskTexture(float r, float ang) {
  float lr = log(r);
  float w = 1.4 * pow(uRin / r, 1.5);           // rad/s, inner edge fastest
  float P = 14.0;
  float p1 = fract(uTime / P), p2 = fract(uTime / P + 0.5);
  float n1 = streaks(lr, ang - w * p1 * P, 0.0);
  float n2 = streaks(lr, ang - w * p2 * P, 37.0);
  float n = n1 * (1.0 - abs(2.0 * p1 - 1.0)) + n2 * (1.0 - abs(2.0 * p2 - 1.0));
  return smoothstep(0.15, 0.95, n);
}

// Light from the disk where the traced ray crosses it at P (rs) moving along k (eye -> scene).
vec4 diskHit(vec3 P, vec3 k, float r) {
  if (r < uRin * 0.8 || r > uRout) return vec4(0.0);
  float x = r / uRin;
  float prof = x > 1.0 ? pow(x, -0.75) * pow(1.0 - inversesqrt(x), 0.25) / 0.48795 : 0.0;
  float T = uTmax * prof;
  vec3 vdir = normalize(cross(uN, P));
  float beta = min(sqrt(0.5 / max(r - 1.0, 0.5)), 0.995);
  float gam = inversesqrt(1.0 - beta * beta);
  float g = sqrt(max(1.0 - 1.0 / r, 1e-4)) / (gam * (1.0 - beta * dot(vdir, -k)));
  float ang = atan(dot(P, uE2), dot(P, uE1));
  float tex = diskTexture(r, ang);
  float edge = smoothstep(uRin * 0.95, uRin * 1.25, r) * (1.0 - smoothstep(uRout * 0.45, uRout, r));
  // dense near the hole, thinning outwards so the lensed sky shows through the outer disk
  float tau = 7.0 * pow(x, -0.85) * (0.2 + 1.3 * tex);
  float a = (1.0 - exp(-tau)) * edge;
  vec3 L = planck(T * g) * (0.6 + 0.8 * tex);
  L = max(mix(vec3(dot(L, vec3(0.2126, 0.7152, 0.0722))), L, 1.3), 0.0);  // a little more saturated, like the stars
  return vec4(L * (uSunDisk * uExposure), a);
}

void composite(inout vec3 acc, inout float tr, vec4 e) {
  acc += tr * e.a * e.rgb;
  tr *= 1.0 - e.a;
}

void main() {
  vec3 d = normalize(vWorld - cameraPosition);
  vec3 O = uO + cameraPosition / uRs;
  float r0 = max(length(O), 1.0001);
  vec3 acc = vec3(0.0);
  float tr = 1.0;
  float esc = 1.0;
  vec3 dirOut = d;
  bool hasDisk = uRout > 0.0;

  vec3 Lv = cross(O, d);
  float b = length(Lv);
  if (r0 > 30.0 && b > 30.0) {
    // weak field: straight line to the closest approach Q, deflected there towards the hole
    float tc = -dot(O, d);
    vec3 Q = O + d * tc;
    float cosPsi = -dot(O, d) / r0;
    float frac = 0.5 * (1.0 + cosPsi);
    float alpha = frac * (2.0 / b + 2.9452431 / (b * b));
    vec3 toward = -Q / max(length(Q), 1e-6);
    dirOut = normalize(cos(alpha) * d + sin(alpha) * toward);
    if (hasDisk) {
      float dn = dot(d, uN);
      vec3 start = O;
      if (tc > 0.0 && abs(dn) > 1e-6) {
        float t = -dot(O, uN) / dn;
        if (t > 0.0 && t < tc) { vec3 P = O + d * t; composite(acc, tr, diskHit(P, d, length(P))); }
      }
      if (tc > 0.0) start = Q;
      float dn2 = dot(dirOut, uN);
      if (abs(dn2) > 1e-6) {
        float t = -dot(start, uN) / dn2;
        if (t > 0.0) { vec3 P = start + dirOut * t; composite(acc, tr, diskHit(P, dirOut, length(P))); }
      }
    }
  } else {
    // strong field: integrate the photon orbit in its plane
    vec3 e1 = O / r0;
    vec3 tv = d - dot(d, e1) * e1;
    float tl = length(tv);
    vec3 e2 = tl > 1e-6 ? tv / tl : normalize(cross(e1, abs(e1.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0)));
    float u = 1.0 / r0;
    float du = -u * dot(d, e1) / max(tl, 1e-6);
    float A = dot(uN, e1), B = dot(uN, e2);
    float phiC = 1e9;
    if (hasDisk && abs(A) + abs(B) > 1e-6) {
      phiC = mod(atan(-A, B), PI);
      if (phiC < 1e-5) phiC += PI;
    }
    float phi = 0.0;
    bool done = false;
    esc = 0.0;
    for (int i = 0; i < 400; i++) {
      if (i >= uMaxSteps || tr < 0.01) break;
      float h = uStepK * mix(0.12, 0.035, smoothstep(0.02, 0.45, u));
      // RK4 on (u, du/dphi)
      float k1u = du,                   k1v = -u + 1.5 * u * u;
      float uu = u + 0.5 * h * k1u;
      float k2u = du + 0.5 * h * k1v,  k2v = -uu + 1.5 * uu * uu;
      uu = u + 0.5 * h * k2u;
      float k3u = du + 0.5 * h * k2v,  k3v = -uu + 1.5 * uu * uu;
      uu = u + h * k3u;
      float k4u = du + h * k3v,         k4v = -uu + 1.5 * uu * uu;
      float u1 = u + h / 6.0 * (k1u + 2.0 * k2u + 2.0 * k3u + k4u);
      float du1 = du + h / 6.0 * (k1v + 2.0 * k2v + 2.0 * k3v + k4v);
      if (phiC < phi + h) {
        float s = (phiC - phi) / h;
        float s2 = s * s, s3 = s2 * s;
        float uc = (2.0 * s3 - 3.0 * s2 + 1.0) * u + (s3 - 2.0 * s2 + s) * h * du + (-2.0 * s3 + 3.0 * s2) * u1 + (s3 - s2) * h * du1;
        if (uc > 0.0 && uc < 1.0) {
          float duc = mix(du, du1, s);
          vec3 rh = cos(phiC) * e1 + sin(phiC) * e2;
          vec3 ph = -sin(phiC) * e1 + cos(phiC) * e2;
          vec3 k = normalize(rh * (-duc / uc) * inversesqrt(max(1.0 - uc, 1e-4)) + ph);
          composite(acc, tr, diskHit(rh / uc, k, 1.0 / uc));
        }
        phiC += PI;
      }
      if (u1 <= 0.0) {
        float phiOut = phi + h * u / (u - u1);
        dirOut = cos(phiOut) * e1 + sin(phiOut) * e2;
        esc = 1.0;
        done = true;
        break;
      }
      if (u1 >= 1.0) { done = true; break; }
      u = u1; du = du1; phi += h;
    }
    if (!done && u < 0.08) {
      // out of steps far from the hole: finish along the flat-space solution u = u cos + du sin
      float phiOut = phi + atan(u, -du);
      dirOut = cos(phiOut) * e1 + sin(phiOut) * e2;
      esc = 1.0;
    }
  }
  vec3 bg = textureCube(uEnv, dirOut).rgb;
  vec3 col = min(acc + tr * esc * bg, vec3(6.0e4));
  gl_FragColor = vec4(col, 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;
