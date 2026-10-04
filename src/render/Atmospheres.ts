import {
  BackSide, CustomBlending, FrontSide, Group, Matrix3, Matrix4, Mesh, OneFactor, OneMinusSrcAlphaFactor, ShaderMaterial,
  SphereGeometry, Vector3,
} from 'three';
import { sunIrradianceAt } from '../astro/photometry';
import type { UPos } from '../core/upos';
import type { Body } from '../universe/Body';
import type { SolarSystem } from '../universe/SolarSystem';
import type { BodyView } from './Bodies';
import { ATMO_FRAG, ATMO_VERT } from './shaders/atmosphere';
import { GLOBALS } from './shaders/xr';

/** Bulk parameters from the NASA NSSDCA fact sheets (pipeline/fetch_atmospheres.py). */
export interface AtmosphereData {
  [name: string]: { scaleHeightKm: number; surfacePressureBar: number; temperatureK: number; meanMolecularWeight: number };
}

/** Optical parameters of one atmosphere in the engine's model. */
export interface AtmosphereSpec {
  betaR: [number, number, number]; // 1/m at the reference level
  HR: number;
  betaMs: [number, number, number];
  betaMe: [number, number, number];
  HM: number;
  g: [number, number, number];
  top: number;       // m above the reference radius
  groundMix: number; // see shader
  /** shade the surface with the transmitted (reddened) sunlight */
  surfaceTransmittance: boolean;
}

const K_B = 1.380649e-23;
const AMU = 1.66053907e-27;
// Earth sea-level Rayleigh coefficients at 680/550/440 nm (Bruneton & Neyret 2008), for N at 1 atm, 288.15 K.
const BETA_R_EARTH: [number, number, number] = [5.802e-6, 13.558e-6, 33.1e-6];
const N_EARTH = 101325 / (K_B * 288.15);
// (refractivity of the gas / refractivity of air)^2 -> Rayleigh cross-section ratio
const GAS_FACTOR: Record<string, number> = { N2: 1.0, CO2: 2.35, H2: 0.2 };

const scale = (v: [number, number, number], k: number): [number, number, number] => [v[0] * k, v[1] * k, v[2] * k];

/**
 * Model parameters. Rayleigh scattering scales the Earth coefficients by number density
 * (fact-sheet pressure / temperature) and gas refractivity; aerosols (Mie) are approximate
 * literature-style values chosen per world and documented as such in CREDITS.md.
 */
export function atmosphereFor(b: Body, data: AtmosphereData): AtmosphereSpec | null {
  const rayleigh = (pBar: number, tK: number, gas: keyof typeof GAS_FACTOR) =>
    scale(BETA_R_EARTH, ((pBar * 1e5) / (K_B * tK) / N_EARTH) * GAS_FACTOR[gas]);
  const d = data[b.name];
  switch (b.name) {
    case 'Earth': {
      const H = d.scaleHeightKm * 1e3;
      return { betaR: rayleigh(d.surfacePressureBar, 288.15, 'N2'), HR: H, betaMs: [3.996e-6, 3.996e-6, 3.996e-6], betaMe: [4.44e-6, 4.44e-6, 4.44e-6],
        HM: 1200, g: [0.8, 0.8, 0.8], top: 100e3, groundMix: 1, surfaceTransmittance: true };
    }
    case 'Mars': {
      const H = d.scaleHeightKm * 1e3;
      // Suspended dust: visible optical depth ~0.5 over one scale height; absorbs blue, forward-scatters
      // blue more strongly (blue sunsets).
      const ext = 0.5 / H;
      return { betaR: rayleigh(d.surfacePressureBar, d.temperatureK, 'CO2'), HR: H,
        betaMe: [ext, ext, ext], betaMs: [ext * 0.95, ext * 0.85, ext * 0.62], HM: H, g: [0.63, 0.68, 0.76],
        top: 120e3, groundMix: 1, surfaceTransmittance: true };
    }
    case 'Venus': {
      // Above the cloud tops (~0.1 bar, ~240 K): CO2 Rayleigh plus a thin sulphuric-acid haze.
      return { betaR: rayleigh(0.1, 240, 'CO2'), HR: d.scaleHeightKm * 1e3, betaMs: [2.5e-6, 2.5e-6, 2.4e-6], betaMe: [2.6e-6, 2.6e-6, 2.6e-6],
        HM: 5e3, g: [0.7, 0.7, 0.7], top: 160e3, groundMix: 0.3, surfaceTransmittance: false };
    }
    case 'Titan': {
      // Huygens HASI surface values (Fulchignoni et al. 2005): 1.467 bar, 93.7 K, N2. Scale height from kT/(mu m_u g).
      const g = b.gm / (b.radius * b.radius);
      const H = (K_B * 93.7) / (28.0 * AMU * g);
      // The disk is shaded with Titan's measured albedo spectrum (the haze top); the shell adds the
      // extended, partly transparent upper haze seen above the limb (extinction rising to the blue).
      const ext = 1.2 / 65e3;
      return { betaR: rayleigh(1.467, 93.7, 'N2'), HR: H, betaMe: [ext * 0.75, ext, ext * 1.35], betaMs: [ext * 0.75 * 0.95, ext * 0.85, ext * 1.35 * 0.55],
        HM: 65e3, g: [0.62, 0.62, 0.62], top: 650e3, groundMix: 0.35, surfaceTransmittance: false };
    }
    case 'Jupiter': case 'Saturn': case 'Uranus': case 'Neptune': {
      const H = d.scaleHeightKm * 1e3;
      // H2/He Rayleigh at the 1-bar level; the map already shows the disk, so only the limb haze is added.
      return { betaR: rayleigh(1, d.temperatureK, 'H2'), HR: H, betaMs: [0, 0, 0], betaMe: [0, 0, 0], HM: H,
        g: [0.7, 0.7, 0.7], top: 9 * H, groundMix: 0.12, surfaceTransmittance: false };
    }
    default:
      return null;
  }
}

interface Shell { body: object; spec: AtmosphereSpec; mesh: Mesh; mat: ShaderMaterial }

/** A world of another star with an atmosphere, as placed this frame (render/ExoPlanetLayer.ts). */
export interface ExoAtmosphere {
  key: object;
  name: string;
  radius: number;
  spec: AtmosphereSpec;
  /** centre relative to the camera (m) */
  rel: Vector3;
  /** body-fixed -> world rotation */
  orient: Matrix4;
  /** world direction and irradiance of the star, and its luminance-normalised colour */
  sunDir: Vector3;
  sunIrr: number;
  sunColor: Vector3;
}

/**
 * An Earth-like atmosphere for a generated temperate or ocean planet: N2 Rayleigh scattering at
 * `pressureBar`, the scale height from its temperature and gravity (molecular weight 29), and a
 * light Earth-like haze.
 */
export function earthLikeAtmosphere(pressureBar: number, tempK: number, gravity: number): AtmosphereSpec {
  const H = (K_B * tempK) / (29 * AMU * gravity);
  const n = ((pressureBar * 1e5) / (K_B * tempK)) / N_EARTH;
  return { betaR: scale(BETA_R_EARTH, n), HR: H, betaMs: scale([3.996e-6, 3.996e-6, 3.996e-6], pressureBar), betaMe: scale([4.44e-6, 4.44e-6, 4.44e-6], pressureBar),
    HM: 1200 * (H / 8500), g: [0.8, 0.8, 0.8], top: 12 * H, groundMix: 1, surfaceTransmittance: true };
}

export class AtmospheresLayer {
  readonly group = new Group();
  private shells = new Map<object, Shell>();
  private geo = new SphereGeometry(1, 96, 48);
  /** ray-march steps (fewer in VR) */
  steps = 16;

  constructor(private system: SolarSystem, private data: AtmosphereData, private exposure: { value: number }, private sunColor: [number, number, number]) {
    this.group.name = 'atmospheres';
  }

  /**
   * God mode's changes to a world's air: density (x, from pressure and temperature) and scale
   * height (x, from temperature, molar mass and gravity), or a whole atmosphere for a world that
   * had none. null restores the real one.
   */
  private tweaks = new Map<Body, { density: number; hScale: number; spec?: AtmosphereSpec }>();
  setTweak(b: Body, t: { density: number; hScale: number; spec?: AtmosphereSpec } | null): void {
    if (t) this.tweaks.set(b, t); else this.tweaks.delete(b);
    const s = this.shells.get(b);
    // a shell made for an atmosphere that is gone (or replaced) is rebuilt on demand
    if (s && (!t || t.spec) && !atmosphereFor(b, this.data)) { this.group.remove(s.mesh); s.mat.dispose(); this.shells.delete(b); }
  }

  spec(b: Body): AtmosphereSpec | null {
    return this.shells.get(b)?.spec ?? atmosphereFor(b, this.data) ?? this.tweaks.get(b)?.spec ?? null;
  }

  private shell(b: Body): Shell | null {
    const s = this.shells.get(b);
    if (s) return s;
    const spec = atmosphereFor(b, this.data) ?? this.tweaks.get(b)?.spec;
    return spec ? this.makeShell(b, b.name, b.radii[0], spec) : null;
  }

  private makeShell(key: object, name: string, radius: number, spec: AtmosphereSpec): Shell {
    let s: Shell;
    const mat = new ShaderMaterial({
      vertexShader: ATMO_VERT, fragmentShader: ATMO_FRAG,
      uniforms: {
        uO: { value: new Vector3() }, uToBody: { value: new Matrix3() }, uSun: { value: new Vector3() },
        uRp: { value: radius }, uRt: { value: radius + spec.top },
        uBetaR: { value: new Vector3(...spec.betaR) }, uHR: { value: spec.HR },
        uBetaMs: { value: new Vector3(...spec.betaMs) }, uBetaMe: { value: new Vector3(...spec.betaMe) }, uHM: { value: spec.HM },
        uG: { value: new Vector3(...spec.g) }, uSunIrr: { value: Math.PI }, uSunColor: { value: new Vector3(...this.sunColor) },
        uExposure: this.exposure, uGroundMix: { value: spec.groundMix }, uSteps: { value: this.steps },
        uPullIn: GLOBALS.uPullIn, uDepthK: GLOBALS.uDepthK,
      },
      transparent: true, depthWrite: false,
      blending: CustomBlending, blendSrc: OneFactor, blendDst: OneMinusSrcAlphaFactor,
    });
    const mesh = new Mesh(this.geo, mat);
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = false;
    mesh.renderOrder = 19.8; // after the planets, rings and point sources it dims; before the terrain (TerrainPatch)
    mesh.name = `${name} atmosphere`;
    this.group.add(mesh);
    s = { body: key, spec, mesh, mat };
    this.shells.set(key, s);
    return s;
  }

  /** Atmospheres of planets of other stars (call after update(), which hides every shell first). */
  updateExo(list: ExoAtmosphere[]): void {
    for (const e of list) {
      const s = this.shells.get(e.key) ?? this.makeShell(e.key, e.name, e.radius, e.spec);
      const u = s.mat.uniforms;
      u.uSteps.value = this.steps;
      const toBody = new Matrix3().setFromMatrix4(e.orient).transpose();
      u.uToBody.value.copy(toBody);
      (u.uO.value as Vector3).copy(e.rel).negate().applyMatrix3(toBody);
      (u.uSun.value as Vector3).copy(e.sunDir).applyMatrix3(toBody).normalize();
      u.uSunIrr.value = e.sunIrr;
      (u.uSunColor.value as Vector3).copy(e.sunColor);
      const Rt = e.radius + s.spec.top;
      const inside = (u.uO.value as Vector3).length() < Rt * 1.002;
      if (s.mat.side !== (inside ? BackSide : FrontSide)) {
        s.mat.side = inside ? BackSide : FrontSide;
        s.mat.depthTest = !inside;
        s.mat.needsUpdate = true;
      }
      s.mesh.matrix.copy(e.orient).scale(new Vector3(Rt, Rt, Rt)).setPosition(e.rel);
      s.mesh.matrixWorldNeedsUpdate = true;
      s.mesh.visible = true;
    }
    // planets left behind: drop their shells
    const keep = new Set(list.map((e) => e.key));
    for (const [k, s] of this.shells) {
      if (s.mesh.name.endsWith('atmosphere') && !this.system.bodies.includes(k as Body) && !keep.has(k)) {
        this.group.remove(s.mesh);
        s.mat.dispose();
        this.shells.delete(k);
      }
    }
  }

  /** Create every atmosphere shell now (for shader warm-up and so none is built mid-flight). */
  /** The shell material of a world (Body or generated planet) while its shell is drawn. */
  material(key: object): ShaderMaterial | null {
    const s = this.shells.get(key);
    return s && s.mesh.visible ? s.mat : null;
  }

  warmupObjects(): Mesh[] {
    const out: Mesh[] = [];
    for (const b of this.system.bodies) {
      const s = this.shell(b);
      if (s) out.push(s.mesh);
    }
    return out;
  }

  update(cam: UPos, views: Map<Body, BodyView>): void {
    const sunRel = this.system.sun.upos.sub(cam, new Vector3());
    const rot = new Matrix3();
    const m4 = new Matrix4();
    const tmp = new Vector3();
    for (const s of this.shells.values()) s.mesh.visible = false;
    for (const [b, v] of views) {
      if (!v.resolved || v.pixelRadius < 2.5) continue;
      const s = this.shell(b);
      if (!s) continue;
      const a = b.radii[0];
      const c = b.radii[2];
      const zs = a / c; // scale making the ellipsoid a sphere
      const u = s.mat.uniforms;
      u.uSteps.value = this.steps;
      // (God mode: density and height of the air, the world's size)
      const tw = this.tweaks.get(b);
      const dk = tw && !tw.spec ? tw.density : 1, hk = tw && !tw.spec ? tw.hScale : 1;
      (u.uBetaR.value as Vector3).set(...s.spec.betaR).multiplyScalar(dk);
      (u.uBetaMs.value as Vector3).set(...s.spec.betaMs).multiplyScalar(dk);
      (u.uBetaMe.value as Vector3).set(...s.spec.betaMe).multiplyScalar(dk);
      u.uHR.value = s.spec.HR * hk;
      u.uHM.value = s.spec.HM * hk;
      u.uRp.value = a;
      u.uRt.value = a + s.spec.top * hk;
      rot.setFromMatrix4(b.orientation);
      const toBody = rot.clone().transpose();
      // scaled frame: body frame with z multiplied by a/c
      const S = new Matrix3().set(1, 0, 0, 0, 1, 0, 0, 0, zs);
      u.uToBody.value.copy(S).multiply(toBody);
      (u.uO.value as Vector3).copy(v.rel).negate().applyMatrix3(u.uToBody.value);
      const toSun = tmp.copy(sunRel).sub(v.rel);
      const rSun = toSun.length();
      (u.uSun.value as Vector3).copy(toSun).divideScalar(rSun).applyMatrix3(u.uToBody.value).normalize();
      u.uSunIrr.value = sunIrradianceAt(rSun);
      const Rt = a + s.spec.top * hk;
      const inside = (u.uO.value as Vector3).length() < Rt * 1.002;
      if (s.mat.side !== (inside ? BackSide : FrontSide)) {
        s.mat.side = inside ? BackSide : FrontSide;
        s.mat.depthTest = !inside;
        s.mat.needsUpdate = true;
      }
      // mesh: ellipsoid of the atmosphere top, oriented with the body
      m4.copy(b.orientation).scale(tmp.set(Rt, Rt, Rt / zs)).setPosition(v.rel);
      s.mesh.matrix.copy(m4);
      s.mesh.matrixWorldNeedsUpdate = true;
      s.mesh.visible = true;
    }
  }
}
