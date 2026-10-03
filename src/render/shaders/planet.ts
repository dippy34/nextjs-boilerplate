import { MATERIAL_GLSL } from '../Materials';
import { OUTPUT_FRAGMENT } from './xr';

/**
 * Procedural surface of a planet around another star (types from universe/Planets.ts):
 *   0 lava, 1 hot rock, 2 desert, 3 temperate, 4 ocean, 5 ice, 6 sub-Neptune, 7 ice giant,
 *   8 gas giant, 9 hot Jupiter.
 *
 * Rocky worlds: continents from domain-warped noise, mountain belts along "plate boundaries"
 * (ridged multifractal), seas below a sea level chosen for the planet's land fraction. The
 * height field shades the surface (relief normal from the same function), and more octaves of
 * detail are added as the explorer comes closer, down to the pixel. Temperate and ocean worlds
 * get climate: temperature from the planet's equilibrium temperature, latitude and altitude;
 * moisture from latitude belts (wet tropics, dry subtropics, wet mid-latitudes), the coast and
 * noise; biomes from both (forest, grassland, savanna, desert, tundra, snow) with bare rock on
 * high ground. Oceans are darker when deep and turquoise in the shallows, with a sun glint;
 * clouds follow the climate belts, swirl into cyclones and cast shadows.
 * Giants: zonal bands with wavy edges, long streaks sheared along the latitude circles, chains
 * of ovals and a few large storms; limb darkening; hot Jupiters glow dull red.
 *
 * `terrain()` is mirrored on the CPU in universe/ExoTerrain.ts (`exoTerrain`): the landing
 * ground uses it, so it must stay identical.
 */
export const EXO_FRAG = /* glsl */ `
#include <common>
#include <logdepthbuf_pars_fragment>
uniform int uType;
uniform float uSeed;
uniform vec3 uC1;           // palette: vegetation / dark bands
uniform vec3 uC2;           // soil / mid bands
uniform vec3 uC3;           // rock, highlands / bright bands
uniform vec3 uSea;          // ocean colour (deep)
uniform float uSeaLevel;    // height of the sea (0..1 of the terrain function)
uniform float uIceLat;      // sine of the ice-cap edge latitude (1 = none)
uniform float uClouds;      // cloud cover 0..1
uniform vec3 uAtmoColor;
uniform float uAtmo;        // limb haze strength
uniform float uBands;       // number of bands (giants)
uniform float uTurb;        // band turbulence
uniform float uGlow;        // thermal glow on the night side (lava, hot Jupiters)
uniform float uTeq;         // equilibrium temperature (K)
uniform float uRelief;      // relief range / planet radius (for the shading of the height field)
uniform float uDry;         // 0 wet .. 1 dry climate
uniform vec3 uSunDir;       // world unit vector planet -> star
uniform vec3 uSunColor;     // luminance-normalised star colour
uniform float uSunIrr;      // irradiance from the star (Sun at 1 AU = PI)
uniform float uExposure;
uniform float uTime;
uniform mat3 uBodyToWorld;
uniform float uLite;        // 1 in VR: fewer noise octaves, no domain warp
uniform float uTerrain;     // 1 = drawing the landing terrain (render/TerrainPatch.ts)
uniform float uHScale;      // terrain relief scale (fades in on descent)
uniform vec3 uHoleDir;      // sphere only: body-fixed centre of the terrain patch
uniform float uHoleCos;     // ... and the cosine of its angular radius (2 = no hole)
varying vec3 vTerrN;
varying float vSun;
varying vec3 vNormalBF;
varying vec3 vPosView;
varying vec2 vUv;
varying vec3 vGround;
${MATERIAL_GLSL}

float ph(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float pn(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(ph(i), ph(i + vec3(1,0,0)), f.x), mix(ph(i + vec3(0,1,0)), ph(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(ph(i + vec3(0,0,1)), ph(i + vec3(1,0,1)), f.x), mix(ph(i + vec3(0,1,1)), ph(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbmN(vec3 p, int n) { float s = 0.0, a = 0.5; for (int i = 0; i < 7; i++) { if (i >= n) break; s += a * pn(p); p = p * 2.03 + 1.7; a *= 0.5; } return s; }
// ridged multifractal: each octave weighted by the ridge below it, so detail gathers on the crests
float ridgedN(vec3 p, int n) {
  float s = 0.0, a = 0.5, w = 1.0;
  for (int i = 0; i < 6; i++) {
    if (i >= n) break;
    float r = 1.0 - abs(pn(p) * 2.0 - 1.0);
    r *= r;
    s += a * r * w;
    w = clamp(r * 1.6, 0.0, 1.0);
    p = p * 2.1 + 3.1; a *= 0.5;
  }
  return s;
}
// the height field (0..~1), shared with the CPU (universe/ExoTerrain.ts)
float terrain(vec3 n) {
  bool lite = uLite > 0.5;
  vec3 q = n * 2.2 + uSeed;
  vec3 w = lite ? vec3(pn(q * 0.5 + 1.3), pn(q * 0.5 + 7.9), pn(q * 0.5 + 4.1)) - 0.5
                : vec3(fbmN(q * 0.5 + 1.3, 4), fbmN(q * 0.5 + 7.9, 4), fbmN(q * 0.5 + 4.1, 4)) - 0.5;
  float cont = fbmN(q * 0.7 + w * 2.0, lite ? 4 : 6);
  float plate = pn(q * 0.55 + w * 1.4 + 11.0);
  float belt = 1.0 - smoothstep(0.0, 0.14, abs(plate - 0.5));
  float mount = ridgedN(q * 2.0 + w, lite ? 3 : 5);
  float land = smoothstep(0.38, 0.6, cont);
  return 0.7 * cont + 0.3 * mount * (0.3 + 0.7 * belt) * (0.35 + 0.65 * land);
}
// detail below the height field's finest octave, down to the pixel (shading only)
float detail(vec3 n, float fp) {
  float s = 0.0, a = 0.5, f = 150.0;
  for (int i = 0; i < 9; i++) {
    if (f * fp > 0.35 || (uLite > 0.5 && i >= 3)) break;
    s += a * (pn(n * f + uSeed * 3.7) - 0.5);
    f *= 2.07; a *= 0.55;
  }
  return s;
}

vec3 biome(float h, float sea, float lat, float slope, vec3 nB, float mtn, out float veg, out float snowOut) {
  // climate: temperature index (0 frozen .. 1 hot) and moisture (0 dry .. 1 wet)
  float alt = max(h - sea, 0.0);
  float temp = (uTeq - 230.0) / 110.0 + 0.45 * (1.0 - lat * lat) - 0.35 - 3.2 * alt;
  float al = abs(lat);
  float belts = 0.55 + 0.45 * cos(al * 12.0) * (1.0 - smoothstep(0.75, 1.0, al));   // wet tropics, dry ~30°, wet ~55°
  float coast = 1.0 - smoothstep(0.0, 0.12, alt);
  float moist = clamp(belts * 0.7 + coast * 0.35 + (fbmN(nB * 5.0 + uSeed * 2.1, uLite > 0.5 ? 2 : 4) - 0.5) * 0.9 - uDry * 0.6, 0.0, 1.0);
  vec3 sand = mix(uC2, vec3(0.86, 0.74, 0.52), 0.55);
  vec3 forest = uC1;
  vec3 grass = mix(uC1, uC2, 0.35) * 1.25;
  vec3 tundra = mix(uC2, vec3(0.5, 0.48, 0.42), 0.5);
  vec3 c = mix(sand, mix(grass, forest, smoothstep(0.55, 0.8, moist)), smoothstep(0.25, 0.5, moist));
  // savanna and dry steppe tint in warm, half-dry land
  c = mix(c, mix(sand, grass, 0.4), smoothstep(0.3, 0.5, moist) * (1.0 - smoothstep(0.5, 0.7, moist)) * smoothstep(0.5, 0.8, temp) * 0.6);
  c = mix(tundra, c, smoothstep(0.08, 0.3, temp));
  // beaches
  c = mix(c, sand * 1.1, (1.0 - smoothstep(0.0, 0.012, alt)) * smoothstep(0.2, 0.4, temp));
  // bare rock on steep or high ground
  float rock = clamp(smoothstep(0.3, 0.7, slope) + smoothstep(0.1, 0.25, alt) * 0.7 + mtn * 0.4, 0.0, 1.0);
  c = mix(c, uC3, rock * 0.85);
  // snow: cold places, and high mountains
  float snow = smoothstep(0.08, -0.04, temp + 0.08 * (pn(nB * 40.0 + uSeed) - 0.5)) * (1.0 - smoothstep(0.75, 0.95, slope) * 0.5);
  veg = smoothstep(0.25, 0.6, moist) * smoothstep(0.08, 0.3, temp) * (1.0 - rock);
  snowOut = snow;
  return mix(c, vec3(0.93, 0.95, 0.98), snow);
}

// clouds: climate belts, cyclones (warped noise), fine texture
float clouds(vec3 nB, float t) {
  float lat = nB.z;
  float al = abs(lat);
  float belts = 0.5 + 0.35 * cos(al * 12.0) + 0.2 * (1.0 - smoothstep(0.0, 0.15, al));
  // zonal drift: winds differ by latitude
  float ang = t * (0.0025 + 0.002 * cos(al * 6.0));
  float ca = cos(ang), sa = sin(ang);
  vec3 p = vec3(ca * nB.x - sa * nB.y, sa * nB.x + ca * nB.y, nB.z);
  vec3 q = p * vec3(3.0, 3.0, 4.5) + uSeed;
  vec3 w = vec3(pn(q * 0.7 + 3.1), pn(q * 0.7 + 8.3), 0.0) - 0.5;
  // swirl: rotate the warp with latitude (cyclones turn opposite ways in the two hemispheres)
  float sw = sign(lat) * 1.6;
  w.xy = mat2(cos(sw), -sin(sw), sin(sw), cos(sw)) * w.xy;
  float c = fbmN(q + w * 2.2, uLite > 0.5 ? 3 : 5);
  c += 0.25 * (pn(q * 6.0 + w * 4.0) - 0.5);
  float cover = uClouds * belts;
  return smoothstep(1.0 - cover - 0.08, 1.0 - cover + 0.22, c + 0.25);
}

void main() {
  vec3 nB = normalize(vNormalBF);
  if (uTerrain < 0.5 && dot(nB, uHoleDir) > uHoleCos) discard;
  vec3 nW = normalize(uBodyToWorld * nB);
  vec3 V = normalize(-vPosView);
  float mu0 = dot(nW, uSunDir);
  float lat = nB.z;
  vec3 sunB = uSunDir * uBodyToWorld;    // the star's direction in the body frame
  float fp = max(length(fwidth(nB)), 1e-7);   // radians per pixel
  vec3 albedo;
  float emit = 0.0;
  vec3 emitColor = vec3(1.0, 0.35, 0.08);
  float spec = 0.0;
  float cloud = 0.0;
  float shadow = 1.0;
  vec3 nShade = nW;       // shading normal (relief)
  float limb = 1.0;
  // ground materials up close (render/Materials.ts): flat A, flat B, steep, snow; shares of B and snow
  vec4 msel = vec4(2.0, 5.0, 3.0, 6.0);
  float veg = 0.0, snowG = 0.0, mrock = 0.0;
  if (uType >= 6) {
    // banded atmosphere
    vec2 ring = nB.xy / max(length(nB.xy), 1e-3);
    float la = asin(clamp(lat, -1.0, 1.0));
    // differential rotation: each latitude drifts at its own rate
    float ang = uTime * (0.002 + 0.0015 * cos(la * uBands * 0.8 + uSeed));
    ring = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * ring;
    float wave = fbmN(vec3(ring * 1.6, la * 7.0) + uSeed, uLite > 0.5 ? 2 : 4) - 0.5;
    float lw = la + uTurb * 0.07 * wave;
    float b = 0.5 + 0.5 * sin(lw * uBands * 2.0 + uSeed + 0.6 * sin(lw * uBands * 0.7 + uSeed * 2.0));
    // streaks sheared along the latitude circles
    float streak = fbmN(vec3(ring * 3.0 + wave * 2.5, la * 70.0) + uSeed * 1.3, uLite > 0.5 ? 3 : 5);
    float fine = fbmN(vec3(ring * 9.0 + wave * 4.0, la * 180.0) + uSeed * 2.1, uLite > 0.5 ? 1 : 3);
    albedo = mix(mix(uC1, uC2, smoothstep(0.15, 0.55, b)), uC3, smoothstep(0.55, 0.95, b * 0.75 + streak * 0.45));
    albedo *= 0.85 + 0.3 * fine * uTurb;
    // festoons and dark barges at band edges
    float edge = smoothstep(0.42, 0.5, b) * (1.0 - smoothstep(0.5, 0.58, b));
    albedo = mix(albedo, uC1 * 0.75, edge * smoothstep(0.55, 0.75, streak) * 0.6);
    // storms: a few large ovals and chains of small white ones
    for (int k = 0; k < 3; k++) {
      vec3 c = normalize(vec3(ph(vec3(uSeed, float(k), 1.0)) - 0.5, ph(vec3(uSeed, float(k), 2.0)) - 0.5, (ph(vec3(uSeed, float(k), 3.0)) - 0.5) * 0.9));
      vec3 dd = nB - c;
      float sz = 0.05 + 0.08 * ph(vec3(uSeed, float(k), 4.0));
      float r = length(dd * vec3(1.0, 1.0, 2.2)) / sz;
      float swirl = pn(vec3(dd.xy * 30.0 / sz, float(k)) + uSeed);
      vec3 sc = k == 0 ? uC3 * vec3(1.1, 0.75, 0.6) : vec3(0.95, 0.93, 0.9);
      albedo = mix(albedo, sc * (0.85 + 0.3 * swirl), smoothstep(1.0, 0.6, r) * 0.85);
    }
    float chainLat = 0.35 + 0.3 * ph(vec3(uSeed, 7.0, 1.0));
    float ov = pn(vec3(ring * 14.0, 0.0) + uSeed * 5.0);
    albedo = mix(albedo, vec3(0.94, 0.93, 0.9), smoothstep(0.82, 0.9, ov) * (1.0 - smoothstep(0.0, 0.025, abs(abs(lat) - chainLat))) * 0.8);
    // polar regions: darker, bluer haze
    albedo = mix(albedo, albedo * vec3(0.75, 0.8, 0.95), smoothstep(0.75, 0.95, abs(lat)));
    limb = pow(max(dot(nW, V), 0.0), 0.25);
    if (uType == 9) emit = uGlow * (0.6 + 0.4 * streak);
  } else {
    float h = terrain(nB);
    float sea = uSeaLevel;
    bool seas = uType == 3 || uType == 4;
    // relief normal from the height field (finite differences at the pixel's scale, or screen derivatives in VR)
    vec3 t1 = normalize(cross(abs(nB.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0), nB));
    vec3 t2 = cross(nB, t1);
    float eps = clamp(fp * 1.5, 2e-5, 0.01);
    float dd = detail(nB, fp);
    float hd = h + dd * 0.012;
    vec2 g;
    if (uLite > 0.5) {
      g = vec2(0.0);   // headset: no relief shading (the colours carry the terrain)
    } else {
      float hx = terrain(normalize(nB + t1 * eps)) + detail(normalize(nB + t1 * eps), fp) * 0.012;
      float hy = terrain(normalize(nB + t2 * eps)) + detail(normalize(nB + t2 * eps), fp) * 0.012;
      g = vec2(hx - hd, hy - hd) / eps;
    }
    bool wet = seas && h < sea;
    // slope of the ground (relief range over the radius), exaggerated a little so it reads from orbit
    vec2 gs = wet ? vec2(0.0) : g * uRelief * 2.5;
    float slope = clamp(length(gs) * 3.0, 0.0, 1.0);
    vec3 nBs = normalize(nB - t1 * gs.x - t2 * gs.y);
    nShade = normalize(uBodyToWorld * nBs);
    float mtn = seas ? smoothstep(sea + 0.12, sea + 0.28, h) : smoothstep(0.45, 0.62, h);
    if (seas) {
      if (wet) {
        float depth = smoothstep(sea, sea - 0.12, h);
        vec3 shallow = mix(uSea * 2.2, vec3(0.1, 0.45, 0.5), 0.45);
        albedo = mix(shallow, uSea, depth);
        spec = 1.0;
      } else {
        albedo = biome(h, sea, lat, slope, nB, mtn, veg, snowG) * (0.9 + 2.0 * dd);
      }
      cloud = clouds(nB, uTime);
      // cloud shadows: the cloud between this point and the star
      vec3 sp = normalize(nB + sunB * 0.006);
      shadow = 1.0 - 0.6 * clouds(sp, uTime) * smoothstep(0.0, 0.3, dot(nB, sunB));
    } else if (uType == 0) {
      // lava: dark crust, glowing cracks and pools
      float cr = ridgedN(nB * 6.0 + uSeed, uLite > 0.5 ? 3 : 5);
      albedo = mix(uC1, uC2, smoothstep(0.22, 0.55, h)) * (0.9 + 2.0 * dd);
      emit = uGlow * (smoothstep(0.8, 0.95, cr) + smoothstep(0.24, 0.18, h) * 0.8);
    } else if (uType == 5) {
      float cracks = smoothstep(0.47, 0.5, abs(pn(nB * 9.0 + uSeed) - 0.5) + 0.47);
      albedo = mix(uC2, uC3, smoothstep(0.22, 0.55, h)) * (0.85 + 0.15 * cracks) * (0.95 + dd);
    } else {
      // deserts and hot rock: dunes in the lowlands, rock on high and steep ground
      float dunes = 0.5 + 0.5 * sin(dot(nB, vec3(140.0, 60.0, 20.0)) + 6.0 * pn(nB * 12.0 + uSeed));
      albedo = mix(uC1, uC2, smoothstep(0.22, 0.6, h));
      albedo = mix(albedo, uC2 * 1.08, dunes * (1.0 - smoothstep(0.32, 0.45, h)) * 0.25);
      albedo = mix(albedo, uC3, clamp(smoothstep(0.3, 0.7, slope) + mtn * 0.6, 0.0, 1.0) * 0.7);
      albedo *= 0.9 + 2.0 * dd;
    }
    // polar caps
    float cap = smoothstep(uIceLat, uIceLat + 0.06, abs(lat) + 0.08 * (fbmN(nB * 6.0 + uSeed, 3) - 0.5));
    albedo = mix(albedo, vec3(0.92, 0.95, 1.0), cap);
    spec *= 1.0 - cap;
    snowG = max(snowG, cap);
    if (seas) msel = vec4(5.0, 7.0, 3.0, 6.0);            // dry soil / forest floor / cliff / snow
    else if (uType == 0) msel = vec4(2.0, 0.0, 3.0, 6.0);  // lava fields: dark rocky ground
    else if (uType == 5) { msel = vec4(6.0, 6.0, 3.0, 6.0); snowG = 1.0; }
    else if (uType == 2) { msel = vec4(4.0, 5.0, 3.0, 6.0); veg = 1.0 - smoothstep(0.28, 0.4, h); } // dunes in the lowlands
    else msel = vec4(1.0, 2.0, 3.0, 6.0);                  // hot rock: pocked regolith and stony ground
    albedo = mix(albedo, vec3(0.95), cloud);
    if (cloud > 0.0) nShade = normalize(mix(nShade, nW, cloud));
  }
  float light = max(dot(nShade, uSunDir), 0.0) * smoothstep(-0.05, 0.08, mu0);
  if (uTerrain > 0.5) {
    // landing terrain: the relief's own normal and shadows, inside the geometric day side, with
    // the scanned ground materials' grain
    vec3 nTB = normalize(vTerrN);
    if (uMatOn > 0.5 && uType < 6 && uHScale > 0.01) {
      vec3 nG;
      vec3 det = groundDetail(vGround, nB, nTB, length(fwidth(vPosView)), msel, veg, snowG, uLite, nG);
      albedo *= mix(vec3(1.0), det, uHScale * (1.0 - cloud));
      nTB = normalize(mix(nTB, nG, uHScale));
    }
    vec3 nT = normalize(mix(nW, uBodyToWorld * nTB, uHScale));
    light = max(dot(nT, uSunDir), 0.0) * smoothstep(-0.04, 0.06, mu0) * mix(1.0, clamp(0.5 + vSun, 0.0, 1.0), uHScale);
  }
  vec3 sunL = uSunColor * (uSunIrr / 3.14159265);
  vec3 radiance = albedo * sunL * light * shadow * limb;
  // sea glint (rough water) and a little sky reflection at grazing angles
  if (spec > 0.0 && mu0 > 0.0) {
    vec3 Hh = normalize(uSunDir + V);
    float nh = max(dot(nW, Hh), 0.0);
    float fres = 0.02 + 0.98 * pow(1.0 - max(dot(nW, V), 0.0), 5.0);
    radiance += sunL * (pow(nh, 160.0) * 3.0 + pow(nh, 18.0) * 0.08) * spec * (1.0 - cloud) * shadow;
    radiance += uAtmoColor * sunL * fres * 0.06 * spec * smoothstep(-0.1, 0.3, mu0);
  }
  // atmosphere: bright limb on the day side, a thin ring of scattered light at the terminator
  float mu = max(dot(nW, V), 0.0);
  float rim = pow(1.0 - mu, 3.0);
  radiance += uAtmoColor * sunL * uAtmo * rim * smoothstep(-0.25, 0.3, mu0) * 0.9;
  // thermal glow (night side mostly)
  // (scaled to the starlight so it shows at the exposure the lit planet sets)
  radiance += emitColor * emit * luminance(sunL) * 0.15 * (0.4 + 0.6 * smoothstep(0.2, -0.2, mu0));
  gl_FragColor = vec4(min(radiance * uExposure, vec3(6.0e4)), 1.0);
${OUTPUT_FRAGMENT}
  #include <logdepthbuf_fragment>
}`;
