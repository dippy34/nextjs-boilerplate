import { OUTPUT_FRAGMENT } from './xr';
import { STAR_LOOK_UNIFORMS } from './body';

/**
 * A star's photosphere: granulation (cellular, bright cells with dark lanes) at the star's own
 * scale, giant convection cells on supergiants, spots with umbra/penumbra in the star's active
 * latitudes, faculae brightening towards the limb, differential rotation, gravity darkening on fast
 * rotators, quadratic limb darkening, and occasional flares on active red dwarfs.
 */
export const STAR_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 uColor;        // luminance-normalised blackbody colour
uniform float uRadiance;    // mean disk radiance (photometric units)
uniform float uExposure;
uniform float uTime;
uniform mat3 uBodyToWorld;
uniform float uLite;          // headset tier: no bright points
${STAR_LOOK_UNIFORMS}
varying vec3 vNormalBF;
varying vec3 vPosView;
varying vec2 vUv;
float h3(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
// arithmetic hash (no sin: sin of large arguments loses all precision and the cells line up on a grid)
vec3 h33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
float n3(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
// cellular noise: x = distance to the nearest cell centre, y = to the second nearest, z = a random
// value of the nearest cell (its own brightness)
vec3 cells(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  float d1 = 9.0, d2 = 9.0, id = 0.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) for (int z = -1; z <= 1; z++) {
    vec3 g = vec3(float(x), float(y), float(z));
    vec3 o = h33(i + g);
    float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; id = h3(i + g + 7.7); } else if (d < d2) d2 = d;
  }
  return vec3(d1, d2, id);
}
float fbm3(vec3 p) { return 0.55 * n3(p) + 0.3 * n3(p * 2.1 + 7.0) + 0.15 * n3(p * 4.3 + 13.0); }
vec3 rotateAbout(vec3 v, vec3 k, float a) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c); }

void main() {
  // the surface normal of the drawn (flattened) ellipsoid: with the sphere's own normal the limb of
  // a fast rotator came out dark on one side (that normal faces away along part of the outline)
  vec3 nE = normalize(vNormalBF + uAxis * dot(vNormalBF, uAxis) * (1.0 / max(1.0 - uFlat, 0.3) - 1.0));
  vec3 nW = normalize(uBodyToWorld * nE);
  vec3 V = normalize(-vPosView);
  float mu = clamp(dot(nW, V), 0.0, 1.0);
  // surface coordinates rotating with the star (equator faster: differential rotation)
  float lat = dot(vNormalBF, uAxis);
  // (the seed only shifts the pattern a little: large offsets cost precision)
  vec3 q = rotateAbout(normalize(vNormalBF), uAxis, -uRotRate * uTime * (1.0 - 0.25 * lat * lat)) + fract(uSeed * 0.01371) * 13.0;
  // granulation: bright cell centres, dark intergranular lanes, slowly evolving. Cells are warped
  // so they are irregular, and fade out once they are smaller than a pixel (no moiré).
  vec3 gp = q * uGranFreq;
  float cellPx = 1.0 / max(length(fwidth(gp)), 1e-6);           // pixels per cell
  float gVis = smoothstep(1.5, 5.0, cellPx);
  vec3 warp = vec3(n3(gp * 0.35 + 5.0), n3(gp * 0.35 + 17.0), n3(gp * 0.35 + 29.0)) - 0.5;
  vec3 c = cells(gp + warp * 0.9 + vec3(0.0, 0.0, uTime * 0.03));
  // few, huge cells (supergiants) have broad, soft lanes; many small cells (dwarfs) sharp ones
  float soft = smoothstep(60.0, 6.0, uGranFreq);
  // dark intergranular lanes of varying width (narrow and dark between big bright granules)
  float laneW = 0.1 + 0.16 * n3(gp * 0.6 + 2.0) + 0.55 * soft;
  float lanes = smoothstep(0.0, laneW, c.y - c.x);
  lanes *= lanes * (3.0 - 2.0 * lanes);
  // each granule its own brightness, brightest in its middle and rounded off towards its edge;
  // some large ones with a darker centre (exploding granules)
  float own = 0.6 + 0.8 * c.z;
  float centre = 1.0 - smoothstep(0.0, 0.6, c.x);
  float explode = step(0.88, c.z) * smoothstep(0.3, 0.0, c.x) * 0.45;
  float dwarf = lanes * own * (0.35 + 0.85 * centre - explode) - 0.7;
  // supergiants: blotchy, multi-scale bright and dark patches more than a cell pattern
  float blot = fbm3(gp * 0.9 + warp * 2.0) + 0.5 * fbm3(gp * 2.3 + 9.0) - 0.75;
  float giant = (lanes * own - 0.8) * 0.6 + 1.6 * blot;
  float gran = 1.0 + uGranAmp * gVis * mix(dwarf * 2.4, giant, soft);
  // granulation smaller than a pixel still shows as a fine, even texture (each pixel averages a few
  // granules): drawn at the finest scale the pixels resolve, weaker the more granules it averages
  // (cheap: one value-noise octave), so a disk at a few radii is not a flat plate
  float fineF = uGranFreq * min(1.0, cellPx / 2.5);
  float avgN = max(uGranFreq / max(fineF, 1e-3), 1.0);
  gran += uGranAmp * (1.0 - gVis) * 1.4 / sqrt(avgN) * (n3(q * fineF + 3.3) - 0.5) * (1.0 - soft);
  // intergranular bright points (magnetic flux concentrations in the lanes), seen up close
  float bpVis = uLite > 0.5 ? 0.0 : smoothstep(8.0, 30.0, cellPx) * (1.0 - soft);
  if (bpVis > 0.0) {
    vec3 cb = cells(gp * 2.7 + 11.0);
    gran += uGranAmp * bpVis * (1.0 - lanes) * smoothstep(0.08, 0.0, cb.x) * step(0.8, h3(floor(gp * 2.7 + 11.0))) * 2.5;
  }
  // mesogranulation: granules brighter and darker in patches of a few
  gran *= 1.0 + 0.35 * uGranAmp * smoothstep(1.5, 5.0, cellPx * 0.25) * (n3(gp * 0.22 + 3.0) - 0.5);
  // giant convection cells / supergranulation (large on supergiants), visible from farther
  float bigVis = smoothstep(1.5, 5.0, cellPx * 6.0);
  gran *= 1.0 + 0.9 * uGranAmp * bigVis * (fbm3(q * max(1.6, uGranFreq * 0.12)) - 0.5);
  // a faint large-scale mottling on every star, so a disk seen from afar is not a flat blob
  // (white-light pictures of the Sun show little of it; this is artistic, kept subtle)
  float mottVis = smoothstep(2.0, 8.0, cellPx * uGranFreq / 9.0);
  gran *= 1.0 + 0.28 * mottVis * (fbm3(q * 9.0 + 41.0) - 0.5) * (uGranAmp > 0.02 ? 1.0 : 0.3);
  // spots in the active latitudes: umbra and penumbra
  float band = exp(-pow((abs(lat) - uSpotLat) / 0.22, 2.0));
  float sf = fbm3(q * 7.0 + 31.0) * band;
  float thr = 1.0 - clamp(uSpots * 2.2, 0.0, 0.95);
  float pen = smoothstep(thr - 0.06, thr, sf);
  float umb = smoothstep(thr + 0.03, thr + 0.08, sf);
  float spot = pen * 0.45 + umb * 0.5;
  // faculae: bright network around active regions, visible towards the limb
  float fac = uFaculae * smoothstep(thr - 0.2, thr - 0.05, sf) * (1.0 - spot) * pow(1.0 - mu, 1.5) * 0.6;
  // limb darkening (quadratic law, normalised to unit mean) and gravity darkening
  float x = 1.0 - mu;
  float ld = (1.0 - uLimbA * x - uLimbB * x * x) / (1.0 - uLimbA / 3.0 - uLimbB / 6.0);
  float gd = 1.0 - uGravDark * (1.0 - lat * lat);
  vec3 col = uColor * ld * gd * gran * (1.0 - spot) * (1.0 + fac);
  // cooler (redder) spots, lanes and equator; hotter cell centres a little whiter; and a redder
  // limb (the light there comes from higher, cooler layers: limb darkening is stronger in blue)
  float cool = clamp(spot * 1.4 + uGravDark * (1.0 - lat * lat) + (1.0 - gran) * 1.5 + 0.45 * x * x * x * x, 0.0, 1.0);
  col *= mix(vec3(1.0), vec3(1.0, 0.72, 0.5), cool);
  // shown more saturated than the blackbody's own pale tint (as photographs and the eye's
  // impression of a star's colour are): an M star orange-red, a G star yellow-white, an O star blue
  // (with a slight warm bias: the Sun reads yellow-white, as in photographs, not pinkish grey)
  col *= vec3(1.0, 0.97, 0.84);
  col = max(mix(vec3(dot(col, vec3(0.2126, 0.7152, 0.0722))), col, 1.4), 0.0);
  // (the display curve keeps hues now: the blackbody colour is shown as it is, a G star white)
  // flares on active red dwarfs: a bright patch that flashes up and fades
  if (uFlares > 0.0) {
    float epoch = floor(uTime / 23.0);
    if (h3(vec3(epoch, uSeed, 3.0)) < uFlares * 2.0) {
      vec3 fp = normalize(h33(vec3(epoch, uSeed, 7.0)) * 2.0 - 1.0);
      float age = fract(uTime / 23.0) * 23.0;
      float f = exp(-age / 3.0) * smoothstep(0.0, 0.5, age) * 4.0;
      col += vec3(0.9, 0.95, 1.0) * f * exp(-pow(length(normalize(vNormalBF) - fp) / 0.08, 2.0));
    }
  }
  gl_FragColor = vec4(min(col * uRadiance * uExposure, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;

