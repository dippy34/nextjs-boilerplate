import { FIX_LOGDEPTH, OUTPUT_FRAGMENT, PROJECT_PARS } from './xr';

/**
 * Single-scattering atmosphere (Rayleigh + Mie), ray-marched along the view ray
 * in the planet's frame, with planet shadow. The optical depth towards the Sun
 * uses the Chapman grazing-incidence function in closed form:
 *   Ch(x, chi) ~ c / ((c - 1) cos chi + 1),  c = sqrt(pi x / 2),  x = r / H   (chi <= 90 deg)
 * and, below the horizon, the full path through the tangent point minus the
 * upward half (2 c0 rho(r0) - rho(r) Ch(x, 180 - chi)).
 * The work is done in a frame where the oblate planet is a sphere (z scaled by a/b).
 */
export const CHAPMAN = /* glsl */ `
// column density (m) of an exponential layer from radius r towards zenith-angle cosine mu, to infinity
float sunColumn(float r, float mu, float H, float Rp) {
  float c = sqrt(1.5707963 * r / H);
  float rho = exp(-(r - Rp) / H);
  if (mu >= 0.0) return H * rho * c / ((c - 1.0) * mu + 1.0);
  float s = sqrt(max(0.0, 1.0 - mu * mu));
  float r0 = r * s;
  if (r0 < Rp) return 1.0e12; // the planet is in the way
  float c0 = sqrt(1.5707963 * r0 / H);
  float rho0 = exp(-(r0 - Rp) / H);
  return H * (2.0 * c0 * rho0 - rho * c / ((c - 1.0) * (-mu) + 1.0));
}
`;

export const ATMO_VERT = /* glsl */ `
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

export const ATMO_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uO;          // camera position in the scaled planet frame (m)
uniform mat3 uToBody;     // world direction -> scaled planet frame
uniform vec3 uSun;        // Sun direction, scaled planet frame
uniform float uRp;        // planet (equatorial) radius, m
uniform float uRt;        // top of the atmosphere, m
uniform vec3 uBetaR;      // Rayleigh scattering (= extinction) at the reference level, 1/m
uniform float uHR;
uniform vec3 uBetaMs;     // Mie scattering, 1/m
uniform vec3 uBetaMe;     // Mie extinction, 1/m
uniform float uHM;
uniform vec3 uG;          // Mie asymmetry per channel
uniform float uSunIrr;
uniform vec3 uSunColor;
uniform float uExposure;
uniform float uGroundMix; // 1 = full aerial perspective over the disk; <1 when the map already shows the atmosphere
uniform int uSteps;
varying vec3 vWorld;
${CHAPMAN}
vec2 hitSphere(vec3 o, vec3 d, float R) {
  // robust for |o| >> R: discriminant from the perpendicular distance
  float b = dot(o, d);
  vec3 perp = cross(o, d);
  float disc = R * R - dot(perp, perp);
  if (disc < 0.0) return vec2(1.0, -1.0);
  float s = sqrt(disc);
  return vec2(-b - s, -b + s);
}
void main() {
  vec3 d = normalize(uToBody * normalize(vWorld));
  vec2 ta = hitSphere(uO, d, uRt);
  if (ta.y <= 0.0 || ta.x > ta.y) discard;
  float t0 = max(ta.x, 0.0);
  float t1 = ta.y;
  vec2 tp = hitSphere(uO, d, uRp);
  bool ground = tp.x <= tp.y && tp.y > 0.0;
  if (ground) t1 = min(t1, max(tp.x, 0.0));
  float ds = (t1 - t0) / float(uSteps);
  float mu = dot(d, uSun);
  float pR = 0.0596831 * (1.0 + mu * mu);
  vec3 g2 = uG * uG;
  vec3 pM = 0.0795775 * (1.0 - g2) / pow(max(1.0 + g2 - 2.0 * uG * mu, 1e-4), vec3(1.5));
  float odR = 0.0, odM = 0.0;
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 32; i++) {
    if (i >= uSteps) break;
    vec3 p = uO + d * (t0 + (float(i) + 0.5) * ds);
    float r = length(p);
    float h = r - uRp;
    float rR = exp(-h / uHR) * ds;
    float rM = exp(-h / uHM) * ds;
    odR += 0.5 * rR; odM += 0.5 * rM;
    float muS = dot(p, uSun) / r;
    float cR = sunColumn(r, muS, uHR, uRp);
    if (cR < 1.0e11) {
      float cM = sunColumn(r, muS, uHM, uRp);
      vec3 T = exp(-(uBetaR * (odR + cR) + uBetaMe * (odM + cM)));
      sum += T * (uBetaR * rR * pR + uBetaMs * rM * pM);
    }
    odR += 0.5 * rR; odM += 0.5 * rM;
  }
  vec3 Tview = exp(-(uBetaR * odR + uBetaMe * odM));
  float k = ground ? uGroundMix : 1.0;
  vec3 L = sum * uSunIrr * uSunColor * k;
  float alpha = (1.0 - dot(Tview, vec3(0.3333))) * k;
  gl_FragColor = vec4(min(L * uExposure, vec3(6.0e4)), clamp(alpha, 0.0, 1.0));
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

/**
 * The same atmosphere over the landing terrain (render/TerrainPatch.ts): drawn on the terrain's own
 * geometry after it, marching from the camera to the ground point actually there rather than to the
 * reference sphere (which would hide mountains seen against the sky, or over-haze them). The shell
 * itself is drawn before the terrain, which covers it.
 */
export const ATMO_HAZE_FRAG = ATMO_FRAG
  .replace('varying vec3 vWorld;', 'varying vec3 vPosView;')
  .replace(`  vec3 d = normalize(uToBody * normalize(vWorld));
  vec2 ta = hitSphere(uO, d, uRt);
  if (ta.y <= 0.0 || ta.x > ta.y) discard;
  float t0 = max(ta.x, 0.0);
  float t1 = ta.y;
  vec2 tp = hitSphere(uO, d, uRp);
  bool ground = tp.x <= tp.y && tp.y > 0.0;
  if (ground) t1 = min(t1, max(tp.x, 0.0));`, `  vec3 pe = uToBody * vPosView;
  float te = length(pe);
  vec3 d = pe / te;
  vec2 ta = hitSphere(uO, d, uRt);
  if (ta.y <= 0.0 || ta.x > ta.y || ta.x > te) discard;
  float t0 = max(ta.x, 0.0);
  float t1 = min(ta.y, te);
  bool ground = true;`);
