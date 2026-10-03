import { FIX_LOGDEPTH, OUTPUT_FRAGMENT, PROJECT_PARS } from './xr';

export const RING_VERT = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_vertex>
${PROJECT_PARS}
varying vec3 vLocal;   // ring-plane coordinates in body radius units
varying vec3 vPosView;
void main() {
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPosView = wp.xyz;
  gl_Position = projectView(viewMatrix * wp);
  #include <logdepthbuf_vertex>
${FIX_LOGDEPTH}
}`;

/**
 * Saturn's rings. The optical depth comes from the measured radial profile (Voyager PPS, the
 * texture); on top of it:
 *  - each ring has its own particles: the C ring and the Cassini Division darker and greyer, the B
 *    ring brightest and reddish-tan, the A ring paler (Cassini colour and albedo profiles, roughly);
 *  - ringlets finer than the profile resolves (36 km per texel): bands of optical depth down to a
 *    few hundred metres, strongest in the B ring, drawn only once they span pixels;
 *  - the light: single scattering by a layer of backscattering particles (lit side; brighter at
 *    small phase angles, with the narrow opposition surge around the anti-solar point), diffuse
 *    transmission on the unlit side (where the thin C ring and Cassini Division glow and the dense
 *    B ring goes dark), the planet's shadow (with a penumbra) and light from Saturn's day side.
 */
export const RING_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform sampler2D uRingTex;
uniform vec2 uRingRadii;
uniform vec3 uColor;
uniform vec3 uSunDirBF;     // Sun direction in body-fixed frame
uniform vec3 uViewDirBF;    // direction ring centre -> camera in body-fixed frame
uniform vec3 uCamBF;        // camera position, body-fixed (planet radii)
uniform float uReqKm;       // planet radius (km)
uniform float uSunIrr;
uniform float uExposure;
uniform float uPlanetRadius;
uniform float uPolar;
uniform float uShine;       // Saturnshine relative to sunlight
varying vec3 vLocal;
varying vec3 vPosView;
float rh1(float x) { return fract(sin(x * 127.1) * 43758.5453); }
float rn1(float x) { float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(rh1(i), rh1(i + 1.0), f); }
// colour (relative to the planet's) and brightness of the particles at radius rk (km)
vec3 ringColour(float rk) {
  vec3 cC = vec3(0.62, 0.58, 0.54);      // C ring, Cassini Division: dark, grey-brown
  vec3 cB = vec3(1.08, 0.95, 0.80);      // B ring: bright, reddish tan
  vec3 cA = vec3(0.94, 0.90, 0.84);      // A ring: paler
  vec3 c = mix(cC, cB, smoothstep(91000.0, 93500.0, rk));
  c = mix(c, cC * 1.1, smoothstep(117000.0, 117800.0, rk) * (1.0 - smoothstep(121800.0, 122300.0, rk)));
  c = mix(c, cA, smoothstep(121800.0, 122300.0, rk));
  c = mix(c, vec3(0.8, 0.78, 0.76), smoothstep(137500.0, 139000.0, rk));   // F ring: dusty
  return c;
}
// fine radial structure: a multiplier on the optical depth, faded out below the pixel size
float ringlets(float rk, float fw) {
  float amp = mix(0.45, 0.9, smoothstep(92000.0, 94000.0, rk) * (1.0 - smoothstep(117000.0, 117600.0, rk)));
  amp = mix(amp, 0.35, smoothstep(122000.0, 123000.0, rk));
  float s = 0.0, w = 0.0;
  float lam = 25.0;
  for (int i = 0; i < 6; i++) {
    float vis = smoothstep(1.0, 4.0, lam / max(fw, 1e-3));
    s += vis * (rn1(rk / lam + float(i) * 13.7) - 0.5) * (i < 2 ? 1.0 : 0.7);
    w += vis;
    lam *= 0.4;
  }
  return exp(amp * s * 1.2);
}
void main() {
  float r = length(vLocal.xy);
  if (r < uRingRadii.x || r > uRingRadii.y) discard;
  float rk = r * uReqKm;
  float a = texture2D(uRingTex, vec2((r - uRingRadii.x) / (uRingRadii.y - uRingRadii.x), 0.5)).r;
  float tau = -log(max(1.0 - a, 1e-3)) * ringlets(rk, fwidth(rk));
  vec3 S = normalize(uSunDirBF);
  vec3 V = normalize(uCamBF - vLocal);
  float mu0 = max(abs(S.z), 1e-3);
  float mu = max(abs(V.z), 1e-3);
  float alpha = 1.0 - exp(-tau / mu);
  bool sameSide = (S.z * V.z) > 0.0;
  // phase angle: backscattering particles, and the opposition surge within a degree or so
  float ph = acos(clamp(dot(S, V), -1.0, 1.0));
  float P = (1.5 * exp(-1.1 * ph) + 0.3) * (1.0 + 0.7 * exp(-ph / 0.02));
  float bright = sameSide ? (1.0 - exp(-tau * (1.0 / mu0 + 1.0 / mu))) * mu0 / (mu0 + mu) * 2.0 * P
                          : (exp(-tau / mu) - exp(-tau / mu0)) / max(1.0 / mu0 - 1.0 / mu, 1e-3) / mu * 0.6;
  // the planet's shadow, with a penumbra (the Sun is 0.06 degrees across from Saturn)
  vec3 p = vLocal;
  vec3 ps = vec3(p.xy, p.z / uPolar);
  vec3 ss = normalize(vec3(S.xy, S.z / uPolar));
  float b = dot(ps, ss);
  float miss = length(ps - ss * b);            // closest approach of the sunward ray to the centre
  float shadow = b < 0.0 ? smoothstep(0.985, 1.005, miss) : 1.0;
  // Saturnshine: the planet's day side lights the ring's near parts, on both faces
  vec3 toP = normalize(-p);
  float shine = uShine * max(dot(toP, S) * -0.5 + 0.5, 0.0) * smoothstep(5.0, 1.2, r) * (1.0 - exp(-tau / mu));
  vec3 radiance = uColor * ringColour(rk) * 0.5 * (uSunIrr / 3.14159265) * (max(bright, 0.0) * shadow + shine);
  // Premultiplied alpha output
  gl_FragColor = vec4(min(radiance * uExposure, vec3(6.0e4)), alpha);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;
