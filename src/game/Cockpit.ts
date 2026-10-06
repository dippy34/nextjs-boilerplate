import { BoxGeometry, Group, Mesh, Quaternion, Vector3 } from 'three';
import { COLORS, Panel } from '../vr/Panel';
import { litMaterial } from './ShipModel';

/** What the cockpit screens show (filled in by the game every few frames). */
export interface CockpitReadout {
  speed: string;
  throttle: number;        // -1..1
  boost: boolean;
  altitude: string;
  reference: string;
  target: string;
  targetKind: string;
  distance: string;
  eta: string;
  warp: 'ready' | 'warping' | 'no target';
  time: string;
  missions: string;
  hint: string;
  /** real-physics flight data (null outside the ship's physics) */
  flight: { lines: string[]; g: string; sas: string; fuel: number; clocks: string; warning: string; lock: string } | null;
}

/**
 * The inside of the ship, built around the eye (rig-local metres, looking down -z): a dashboard with
 * three live screens, the canopy frame and side consoles. It hangs off the camera rig, so in VR the
 * player's head moves inside it naturally.
 */
export class Cockpit {
  readonly group = new Group();
  readout: CockpitReadout = {
    speed: '0 m/s', throttle: 0, boost: false, altitude: '', reference: '', target: 'none', targetKind: '', distance: '', eta: '',
    warp: 'no target', time: '', missions: '', hint: '', flight: null,
  };
  private screens: Panel[] = [];
  private timer = 0;

  constructor() {
    this.group.name = 'cockpit';
    const metal = litMaterial([0.16, 0.17, 0.2], 0.5, 0, 0.12);
    const trim = litMaterial([0.55, 0.22, 0.08], 0.3, 0, 0.12);
    const frame = litMaterial([0.08, 0.085, 0.1], 0.6, 0, 0.1);
    const lamp = (c: [number, number, number]) => litMaterial(c, 0, 1, 0);
    const box = (w: number, h: number, d: number, m = metal) => new Mesh(new BoxGeometry(w, h, d), m);
    const place = (mesh: Mesh, p: [number, number, number], r: [number, number, number] = [0, 0, 0]) => {
      mesh.position.set(...p);
      mesh.rotation.set(...r);
      mesh.frustumCulled = false;
      mesh.renderOrder = 20;
      this.group.add(mesh);
      return mesh;
    };
    // dashboard, tilted towards the pilot (its top edge ~20 degrees below the line of sight)
    place(box(1.3, 0.05, 0.42), [0, -0.33, -0.8], [0.55, 0, 0]);
    place(box(1.3, 0.36, 0.05, trim), [0, -0.53, -0.98], [0, 0, 0]);
    // side consoles
    for (const s of [-1, 1]) {
      place(box(0.26, 0.07, 0.8), [s * 0.6, -0.36, -0.4], [0, 0, s * 0.18]);
      for (let i = 0; i < 4; i++) place(box(0.025, 0.012, 0.025, lamp(i % 2 ? [0.2, 1, 0.5] : [1, 0.6, 0.15])), [s * 0.57, -0.318, -0.62 + i * 0.1]);
    }
    // canopy frame: windscreen pillars, roof bow, centre rib and side rails
    const strut = (a: Vector3, b: Vector3, t = 0.032) => {
      const len = a.distanceTo(b);
      const m = place(box(t, t, len, frame), [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2]);
      m.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), b.clone().sub(a).normalize()));
      return m;
    };
    const V = (x: number, y: number, z: number) => new Vector3(x, y, z);
    for (const s of [-1, 1]) {
      strut(V(s * 0.66, -0.3, -0.98), V(s * 0.46, 0.4, -0.62));     // windscreen pillar
      strut(V(s * 0.46, 0.4, -0.62), V(s * 0.42, 0.47, 0.35));      // roof rail
      strut(V(s * 0.72, -0.28, 0.4), V(s * 0.66, -0.3, -0.98));     // sill
    }
    strut(V(-0.46, 0.4, -0.62), V(0.46, 0.4, -0.62));               // roof bow
    strut(V(-0.42, 0.47, 0.35), V(0.42, 0.47, 0.35));
    strut(V(0, 0.44, -0.62), V(0, 0.49, 0.35), 0.022);                // centre rib
    // three screens on the dashboard
    const left = new Panel(384, 288, 0.24, (p) => this.paintLeft(p));
    const centre = new Panel(512, 288, 0.32, (p) => this.paintCentre(p));
    const right = new Panel(384, 288, 0.24, (p) => this.paintRight(p));
    const tilt = -0.95;
    centre.mesh.position.set(0, -0.27, -0.68);
    centre.mesh.rotation.set(tilt, 0, 0);
    left.mesh.position.set(-0.33, -0.28, -0.65);
    left.mesh.rotation.set(tilt, 0.42, 0.18);
    right.mesh.position.set(0.33, -0.28, -0.65);
    right.mesh.rotation.set(tilt, -0.42, -0.18);
    for (const s of [left, centre, right]) {
      // screens sit just above the dashboard: depth-tested like the rest of the cockpit
      const m = s.mesh.material as { depthTest: boolean; depthWrite: boolean };
      m.depthTest = true;
      m.depthWrite = true;
      s.mesh.renderOrder = 21;
      this.group.add(s.mesh);
      this.screens.push(s);
    }
    this.group.visible = false;
  }

  update(dt: number): void {
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.2;
    for (const s of this.screens) { s.dirty = true; s.update(); }
  }

  private frame(p: Panel, title: string): void {
    p.ctx.clearRect(0, 0, p.width, p.height);
    p.rect(3, 3, p.width - 6, p.height - 6, 18, 'rgba(4, 10, 20, 0.96)', 'rgba(127, 178, 255, 0.55)', 3);
    p.text(title, 18, 30, 20, COLORS.dim, 700);
  }

  private paintLeft(p: Panel): void {
    const r = this.readout;
    this.frame(p, 'FLIGHT');
    p.text(r.speed, 18, 92, 44, '#ffffff', 700, 'left', p.width - 36);
    p.text(r.boost ? 'BOOST' : 'throttle', 18, 128, 20, r.boost ? COLORS.warn : COLORS.dim, 600);
    // throttle bar
    const w = p.width - 36, x0 = 18, y0 = 146;
    p.rect(x0, y0, w, 22, 8, 'rgba(255,255,255,0.06)');
    const t = Math.max(-1, Math.min(1, r.throttle));
    const mid = x0 + w / 2;
    p.rect(t >= 0 ? mid : mid + (w / 2) * t, y0, (w / 2) * Math.abs(t), 22, 8, t >= 0 ? COLORS.accent : COLORS.warn);
    p.text('altitude', 18, 210, 20, COLORS.dim, 600);
    p.text(r.altitude, 18, 246, 30, COLORS.text, 600, 'left', p.width - 36);
    if (r.flight) {
      // propellant gauge along the bottom
      p.rect(18, 262, p.width - 36, 10, 5, 'rgba(255,255,255,0.06)');
      p.rect(18, 262, (p.width - 36) * Math.max(0, Math.min(1, r.flight.fuel)), 10, 5, r.flight.fuel < 0.1 ? COLORS.warn : '#9dff8a');
    }
  }

  private paintCentre(p: Panel): void {
    const r = this.readout;
    if (r.flight) {
      // orbit screen: apsides, impact, then the target line and warp state
      const f = r.flight;
      this.frame(p, 'ORBIT');
      f.lines.forEach((l, i) => p.text(l, 18, 72 + i * 34, 26, l.startsWith('IMPACT') ? COLORS.warn : COLORS.text, 600, 'left', p.width - 36));
      p.text(`${r.target}${r.distance ? ` · ${r.distance}` : ''}`, 18, 182, 20, r.target === 'none' ? COLORS.dim : COLORS.sel, 600, 'left', p.width - 36);
      const warp = r.warp === 'warping' ? 'WARP ENGAGED' : f.lock ? 'WARP MASS-LOCKED' : r.warp === 'ready' ? 'WARP READY' : 'SELECT A TARGET';
      p.rect(18, 220, p.width - 36, 48, 12, r.warp === 'warping' ? 'rgba(127,178,255,0.35)' : 'rgba(255,255,255,0.05)', COLORS.border, 2);
      p.text(warp, p.width / 2, 245, 24, f.lock ? COLORS.warn : r.warp === 'warping' ? '#ffffff' : r.warp === 'ready' ? COLORS.accent : COLORS.dim, 700, 'center');
      return;
    }
    this.frame(p, 'NAVIGATION');
    p.text(r.target, 18, 80, 38, r.target === 'none' ? COLORS.dim : COLORS.sel, 700, 'left', p.width - 36);
    p.text(r.targetKind, 18, 112, 20, COLORS.dim, 500, 'left', p.width - 36);
    if (r.distance) {
      p.text(r.distance, 18, 160, 32, COLORS.text, 600, 'left', p.width - 36);
      p.text(r.eta, 18, 196, 22, COLORS.dim, 500, 'left', p.width - 36);
    }
    const warp = r.warp === 'warping' ? 'WARP ENGAGED' : r.warp === 'ready' ? 'WARP READY' : 'SELECT A TARGET';
    p.rect(18, 220, p.width - 36, 48, 12, r.warp === 'warping' ? 'rgba(127,178,255,0.35)' : 'rgba(255,255,255,0.05)', COLORS.border, 2);
    p.text(warp, p.width / 2, 245, 24, r.warp === 'warping' ? '#ffffff' : r.warp === 'ready' ? COLORS.accent : COLORS.dim, 700, 'center');
  }

  private paintRight(p: Panel): void {
    const r = this.readout;
    if (r.flight) {
      const f = r.flight;
      this.frame(p, 'STATUS');
      p.text(r.reference, 18, 64, 22, COLORS.text, 600, 'left', p.width - 36);
      p.text(`${f.g} · SAS ${f.sas}`, 18, 100, 22, COLORS.text, 600, 'left', p.width - 36);
      p.text(f.clocks, 18, 136, 18, COLORS.dim, 500, 'left', p.width - 36);
      p.text(r.time, 18, 168, 18, COLORS.dim, 500, 'left', p.width - 36);
      if (f.warning) p.text(f.warning, 18, 214, 24, COLORS.warn, 700, 'left', p.width - 36);
      p.text(r.hint, 18, 270, 16, COLORS.dim, 400, 'left', p.width - 36);
      return;
    }
    this.frame(p, 'STATUS');
    p.text('near', 18, 66, 20, COLORS.dim, 600);
    p.text(r.reference, 18, 98, 28, COLORS.text, 600, 'left', p.width - 36);
    p.text('time', 18, 136, 20, COLORS.dim, 600);
    p.text(r.time, 18, 166, 24, COLORS.text, 500, 'left', p.width - 36);
    p.text('missions', 18, 204, 20, COLORS.dim, 600);
    p.text(r.missions, 18, 234, 24, COLORS.warn, 600, 'left', p.width - 36);
    p.text(r.hint, 18, 270, 16, COLORS.dim, 400, 'left', p.width - 36);
  }
}
