import type { SpaceObject } from '../../universe/Body';
import { bodyView, starLuminosity } from '../BodyView';
import type { God, SpawnType } from '../God';
import { FLAG_STAR } from '../NBody';
import {
  apsides, AU, equilibriumTemp, escapeVelocity, fmtDuration, fmtLength, fmtMass, hillRadius, isco, L_SUN, M_EARTH, M_SUN, mainSequence, num,
  orbitalPeriod, scaleHeight, schwarzschildRadius, surfaceGravity, surfaceTemp,
} from '../physics';
import { type Collection, type Got, PROPS, ScriptError, type ScriptWorld, type Value } from './Script';

const PLANET_TYPES: Record<string, SpawnType> = { rocky: 'rocky', terran: 'terran', earth: 'terran', ocean: 'ocean', ice: 'ice', lava: 'lava', giant: 'giant', gas: 'giant' };

/** God mode as the console's world: names, collections, properties (SI) and actions. */
export class GodWorld implements ScriptWorld {
  constructor(private god: God) {}

  private get sb() { return this.god.sandbox; }
  private get sys() { return this.god.app.system; }

  find(name: string): number | null {
    const n = name.toLowerCase();
    for (const e of this.sb.entities.values()) if (e.name.toLowerCase() === n) return e.id;
    // Solar System bodies first (a moon and an asteroid can share a name: the bigger wins)
    let best: number | null = null, bestR = -1;
    for (const b of this.sys.bodies) if (b.valid && b.name.toLowerCase() === n && b.radius > bestR) { best = b.id; bestR = b.radius; }
    if (best !== null) return best;
    const o: SpaceObject | null = this.god.app.findByName(name);
    return o ? this.god.idOf(o) : null;
  }

  nameOf(id: number): string {
    return this.sb.entityOf(id)?.name ?? this.sys.byId.get(id)?.name ?? `#${id}`;
  }

  collection(kind: Collection, of: number | null): number[] {
    const out: number[] = [];
    const parentOf = (id: number): number | null => {
      const e = this.sb.entityOf(id);
      if (e) return this.sb.parentId(e);
      return this.sys.byId.get(id)?.parent?.id ?? null;
    };
    const ids = new Set<number>();
    for (const b of this.sys.bodies) if (b.valid) ids.add(b.id);
    for (const e of this.sb.entities.values()) ids.add(e.id);
    for (const id of ids) {
      const e = this.sb.entityOf(id), b = this.sys.byId.get(id);
      const bk = b?.kind, st = e?.spawn?.type;
      let ok = false;
      switch (kind) {
        case 'planets': ok = bk === 'planet' && st !== 'moon'; break;
        case 'moons': ok = (bk === 'moon' || st === 'moon') && (of === null || parentOf(id) === of); break;
        case 'dwarfs': ok = bk === 'dwarf'; break;
        case 'asteroids': ok = bk === 'asteroid' || bk === 'tno'; break;
        case 'stars': ok = bk === 'star' || !!(e && e.flags & FLAG_STAR); break;
        case 'created': ok = !!e && e.kind !== 'body'; break;
        case 'all': ok = true; break;
        case 'children': ok = parentOf(id) === of; break;
      }
      if (ok) out.push(id);
    }
    return out;
  }

  get(id: number, prop: string): Got | null {
    const v = bodyView(this.god, id);
    if (!v) return null;
    const o = v.orbit;
    const a = o && o.el.e < 1 ? o.el.q / (1 - o.el.e) : NaN;
    const d = (x: { value: number; math: string }, k = 1): Got => ({ value: x.value * k, math: x.math });
    const T = () => {
      if (!v.light) return null;
      const teq = equilibriumTemp(v.light.lum, v.light.d, v.albedo);
      return { teq, ts: surfaceTemp(teq.value, v.greenhouse) };
    };
    switch (prop) {
      case 'mass': return { value: v.massKg };
      case 'radius': return { value: v.radius };
      case 'density': return { value: v.massKg / ((4 / 3) * Math.PI * v.radius ** 3) };
      case 'rpol': return { value: v.rpol };
      case 'rotation': return { value: v.rotation ?? (o ? orbitalPeriod(a, o.parentMassKg, v.massKg).value : 0) };
      case 'obliquity': return { value: v.obliquity };
      case 'a': return o ? { value: a } : null;
      case 'e': return o ? { value: o.el.e } : null;
      case 'i': return o ? { value: o.el.i } : null;
      case 'node': return o ? { value: ((o.el.node % 360) + 360) % 360 } : null;
      case 'peri': return o ? { value: ((o.el.peri % 360) + 360) % 360 } : null;
      case 'M': {
        if (!o || !(a > 0)) return null;
        const n = Math.sqrt(o.el.mu / a ** 3);
        const M = (((this.sb.jd - o.el.tp) * 86400 * n * 180) / Math.PI) % 360;
        return { value: (M + 360) % 360 };
      }
      case 'albedo': return { value: v.albedo };
      case 'greenhouse': return { value: v.greenhouse };
      case 'pressure': return { value: v.pressure * 1e5 };
      case 'molar': return { value: v.molar };
      case 'spin': return { value: v.bhSpin };
      case 'g': return d(surfaceGravity(v.massKg, v.radius));
      case 'v_esc': return d(escapeVelocity(v.massKg, v.radius), 1000);
      case 'P': return o ? d(orbitalPeriod(a, o.parentMassKg, v.massKg)) : null;
      case 'q': return o ? d(apsides(a, o.el.e).peri) : null;
      case 'Q': return o ? d(apsides(a, o.el.e).apo) : null;
      case 'hill': return o ? d(hillRadius(a, o.el.e, v.massKg, o.parentMassKg)) : null;
      case 'T_eq': { const t = T(); return t ? d(t.teq) : null; }
      case 'T_s': { const t = T(); return t ? d(t.ts) : null; }
      case 'H': { const t = T(); return t && v.pressure > 0 ? d(scaleHeight(t.ts.value, v.molar, surfaceGravity(v.massKg, v.radius).value), 1000) : null; }
      case 'L': return v.kind === 'star' ? { value: starLuminosity(v.massKg), math: mainSequence(v.massKg / M_SUN).lum.math } : null;
      case 'Teff': return v.kind === 'star' ? d(mainSequence(v.massKg / M_SUN).teff) : null;
      case 'r_s': return d(schwarzschildRadius(v.massKg));
      case 'isco': return v.kind === 'hole' ? d(isco(v.massKg, v.bhSpin)) : null;
    }
    return null;
  }

  set(id: number, prop: string, si: number): void {
    const g = this.god;
    const v = bodyView(g, id);
    if (!v) throw new ScriptError(`${this.nameOf(id)} is gone`);
    const orbitProp = ['a', 'e', 'i', 'node', 'peri', 'M'].includes(prop);
    if (orbitProp && !v.orbit) throw new ScriptError(`${v.name} orbits nothing`);
    const pos = (x: number, what: string) => { if (!(x > 0)) throw new ScriptError(`${what} must be positive`); return x; };
    switch (prop) {
      case 'mass': g.setPhysical(id, { massKg: pos(si, 'a mass') }); break;
      case 'radius': g.setPhysical(id, { radius: pos(si, 'a radius') }); break;
      case 'density': g.setPhysical(id, { densityKgM3: pos(si, 'a density') }); break;
      case 'rpol': g.setPhysical(id, { rpol: pos(si, 'a radius') }); break;
      case 'rotation': if (si === 0) g.spin(id, 'stop'); else g.setRotation(id, Math.abs(si), si < 0); break;
      case 'obliquity': g.spin(id, { tiltDeg: Math.max(0, Math.min(180, si)) }); break;
      case 'a': g.setOrbit(id, { a: pos(si, 'a') }); break;
      case 'e': if (si < 0 || si >= 1) throw new ScriptError('e must be 0 ≤ e < 1 for an orbit (0.99 at most)'); g.setOrbit(id, { e: Math.min(0.99, si) }); break;
      case 'i': g.setOrbit(id, { i: Math.max(0, Math.min(180, si)) }); break;
      case 'node': g.setOrbit(id, { node: si }); break;
      case 'peri': g.setOrbit(id, { peri: si }); break;
      case 'M': g.setOrbit(id, { M: si }); break;
      case 'albedo': g.ensureActive(); g.sandbox.setPhys(id, { albedo: Math.max(0, Math.min(1, si)) }); break;
      case 'greenhouse': g.ensureActive(); g.sandbox.setPhys(id, { greenhouse: si }); break;
      case 'pressure': g.ensureActive(); g.sandbox.setPhys(id, { pressure: Math.max(0, si / 1e5), molar: v.molar }); break;
      case 'molar': g.ensureActive(); g.sandbox.setPhys(id, { molar: pos(si, 'a molar mass'), pressure: v.pressure }); break;
      case 'spin': g.ensureActive(); g.sandbox.setPhys(id, { spin: Math.max(-0.998, Math.min(0.998, si)) }); break;
      default: throw new ScriptError(`${prop} can't be set`);
    }
  }

  create(kind: string, name: string | null, params: Record<string, Value | string>, around: number | null): number {
    const g = this.god;
    const num_ = (k: string, dim: number[] | null): number | undefined => {
      const p = params[k];
      if (p === undefined) return undefined;
      if (typeof p === 'string') throw new ScriptError(`${k} must be a number`);
      if (dim && p.d.some((x, i) => Math.abs(x - dim[i]) > 1e-9)) throw new ScriptError(`${k} needs a unit (${k === 'mass' ? 'e.g. 3 Mearth' : k === 'a' ? 'e.g. 1.6 AU' : k === 'density' ? 'e.g. 4.5 g/cm3' : k === 'radius' ? 'e.g. 6000 km' : ''})`);
      return p.v;
    };
    const known = ['mass', 'a', 'density', 'radius', 'e', 'i', 'type'];
    for (const k of Object.keys(params)) if (!known.includes(k)) throw new ScriptError(`unknown parameter "${k}" (mass, a, density, radius, e, i, type)`);
    let type: SpawnType;
    if (kind === 'star') type = 'star';
    else if (kind === 'blackhole' || kind === 'hole') type = 'hole';
    else if (kind === 'swarm' || kind === 'asteroids') type = 'swarm';
    else if (kind === 'moon') type = 'moon';
    else {
      const t = params.type;
      if (t !== undefined && (typeof t !== 'string' || !PLANET_TYPES[t.toLowerCase()])) throw new ScriptError(`type is one of ${Object.keys(PLANET_TYPES).join(', ')}`);
      const mk = num_('mass', [1, 0, 0, 0]);
      type = t ? PLANET_TYPES[(t as string).toLowerCase()] : mk !== undefined && mk > 50 * M_EARTH ? 'giant' : 'terran';
    }
    const massKg = num_('mass', [1, 0, 0, 0]) ?? (type === 'star' ? M_SUN : type === 'hole' ? 10 * M_SUN : type === 'moon' ? 0.0123 * M_EARTH : type === 'giant' ? 318 * M_EARTH : M_EARTH);
    const centerId = around ?? (type === 'moon' ? (g.selectedId() ?? 399) : 10);
    const center = bodyView(g, centerId);
    if (!center) throw new ScriptError('nothing to orbit');
    const aDefault = type === 'moon' ? Math.max(center.radius * 30, 2e8) : type === 'star' ? 30 * AU : type === 'hole' ? 40 * AU : type === 'swarm' ? 2.8 * AU : 1.5 * AU;
    const a = num_('a', [0, 1, 0, 0]) ?? aDefault;
    if (!(a > center.radius)) throw new ScriptError(`a = ${fmtLength(a)} is inside ${center.name}`);
    const unitMass = type === 'star' || type === 'hole' ? massKg / M_SUN : massKg / M_EARTH;
    let id: number | null = null;
    this.batch(() => {
      id = g.spawnOnOrbit(type, unitMass, a, centerId, name ?? undefined);
      if (id === null) return;
      const rho = num_('density', [1, -3, 0, 0]), R = num_('radius', [0, 1, 0, 0]);
      if (R !== undefined) g.setPhysical(id, { radius: R });
      else if (rho !== undefined) { const keep = g.derive; g.derive = 'radius'; g.setPhysical(id, { densityKgM3: rho }); g.derive = keep; }
      const e = num_('e', [0, 0, 0, 0]), i = num_('i', [0, 0, 0, 0]);
      if (e !== undefined || i !== undefined) g.setOrbit(id, { ...(e !== undefined ? { e } : {}), ...(i !== undefined ? { i } : {}) });
    });
    if (id === null) throw new ScriptError('could not create it');
    return id;
  }

  command(cmd: 'reverse' | 'delete' | 'select' | 'goto' | 'circularize', id: number): void {
    const g = this.god;
    if (cmd === 'reverse') g.preset(id, 'reverse');
    else if (cmd === 'circularize') g.preset(id, 'circular');
    else if (cmd === 'delete') g.remove(id);
    else {
      const e = g.sandbox.entityOf(id);
      const o = e ? g.objectOf(e) : this.sys.byId.get(id) ?? null;
      if (!o) throw new ScriptError(`can't find ${this.nameOf(id)} to ${cmd}`);
      g.app.select(o);
      if (cmd === 'goto') g.app.goTo(o);
    }
  }

  simulate(on: boolean): void { this.god.setSimulation(on); }
  reset(): void { this.god.reset(); }
  undo(): boolean { return this.god.sandbox.undo(); }
  batch(fn: () => void): void { this.god.ensureActive(); this.god.sandbox.batch(fn); }

  show(prop: string, si: number): string {
    const def = PROPS[prop];
    const d = def?.dim.join(',');
    if (prop === 'molar') return `${num(si * 1000)} g/mol`;
    if (prop === 'rotation') return `${fmtDuration(Math.abs(si))}${si < 0 ? ' (retrograde)' : ''}`;
    switch (d) {
      case '1,0,0,0': return fmtMass(si);
      case '0,1,0,0': return si < 1e7 && prop !== 'a' ? `${num(si / 1e3)} km` : fmtLength(si);
      case '0,0,1,0': return fmtDuration(si);
      case '0,0,0,1': return `${num(si)} K (${num(si - 273.15)} °C)`;
      case '1,-3,0,0': return `${num(si / 1000)} g/cm³`;
      case '0,1,-2,0': return `${num(si)} m/s² (${num(si / 9.80665)} g)`;
      case '0,1,-1,0': return `${num(si / 1000)} km/s`;
      case '1,-1,-2,0': return `${num(si / 1e5)} bar`;
      case '1,2,-3,0': return `${num(si / L_SUN)} L☉`;
    }
    return ['obliquity', 'i', 'node', 'peri', 'M'].includes(prop) ? `${num(si)}°` : num(si);
  }
}

