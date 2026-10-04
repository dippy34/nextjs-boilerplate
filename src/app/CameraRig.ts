import { Matrix4, Quaternion, Vector3 } from 'three';
import { UPos } from '../core/upos';
import type { SpaceObject } from '../universe/Body';
import type { Input } from './Input';

/**
 * Camera state in universal coordinates plus the SpaceEngine-style flight
 * model: free fly with speed proportional to altitude, orbit around the
 * selection, and a logarithmic "go to" autopilot.
 */
export class CameraRig {
  readonly upos = new UPos();
  readonly quat = new Quaternion();
  fov = 50;
  /** body the camera co-moves with (so planets do not run away under time acceleration) */
  anchor: SpaceObject | null = null;
  private anchorPrev = new UPos();
  /** user speed multiplier (mouse wheel / +-) */
  speedFactor = 1;
  /** current linear speed (m/s), for the HUD */
  speed = 0;
  /** distance to the nearest surface (m), provided by the app every frame */
  altitude = 1e9;
  target: SpaceObject | null = null;
  /**
   * Ship flight (game mode): the velocity follows the controls over this many seconds and is kept
   * (slowly damped by "flight assist") when they are released. 0 = classic free fly.
   */
  inertia = 0;
  /** brake held (ship flight): stop quickly */
  braking = false;
  /** forward thrust command -1..1 (for the cockpit display) */
  thrust = 0;
  private goto: GotoState | null = null;
  private velocity = new Vector3();
  private tmp = new Vector3();
  private tmp2 = new Vector3();

  get autopilot(): boolean {
    return this.goto !== null;
  }

  /** current velocity (m/s, world axes; free flight only) */
  get vel(): Vector3 {
    return this.velocity;
  }

  /** Kill the current velocity (docking, landing). */
  stop(): void {
    this.velocity.set(0, 0, 0);
    this.speed = 0;
  }

  /** seconds left on the current autopilot flight (0 if none) */
  get gotoRemaining(): number {
    return this.goto ? this.goto.T - this.goto.t : 0;
  }

  /** Re-anchor without moving: the camera keeps its absolute position. */
  setAnchor(a: SpaceObject | null): void {
    if (a === this.anchor) return;
    this.anchor = a;
    if (a) this.anchorPrev.copy(a.upos);
  }

  /** Apply the anchor's motion since the previous frame (call after objects were updated). */
  followAnchor(): void {
    if (!this.anchor) return;
    const d = this.anchor.upos.sub(this.anchorPrev, this.tmp);
    this.upos.addVec(d);
    this.anchorPrev.copy(this.anchor.upos);
  }

  forward(out = new Vector3()): Vector3 {
    return out.set(0, 0, -1).applyQuaternion(this.quat);
  }
  up(out = new Vector3()): Vector3 {
    return out.set(0, 1, 0).applyQuaternion(this.quat);
  }
  right(out = new Vector3()): Vector3 {
    return out.set(1, 0, 0).applyQuaternion(this.quat);
  }

  lookAt(dir: Vector3, upHint?: Vector3): void {
    const up = upHint ?? this.up(new Vector3());
    const m = new Matrix4().lookAt(new Vector3(0, 0, 0), dir, up);
    this.quat.setFromRotationMatrix(m);
  }

  /**
   * Begin the autopilot towards `target`, stopping at `finalDistance` from its centre.
   *
   * The distance follows a curve in log space: the stretch where the target is still a dot
   * (farther than ~300 radii) is crossed quickly, and the time goes into the approach where
   * it visibly grows, easing to a stop. Monotone cubic Hermite, so there is no overshoot and
   * no change of pace between the two stretches.
   *
   * `arriveDir` (unit, from the target): swing round to arrive from that side, during the
   * visible approach, keeping the target in view.
   */
  flyTo(target: SpaceObject, finalDistance: number, duration?: number, rotate = true, arriveDir?: Vector3): void {
    const rel = this.upos.sub(target.upos, new Vector3());
    const d0 = Math.max(rel.length(), 1e-3);
    const d1 = Math.max(finalDistance, 1);
    const dir = rel.clone().divideScalar(d0);
    if (!Number.isFinite(dir.x)) dir.set(0, 0, 1);
    const L0 = Math.log(d0), L1 = Math.log(d1);
    let knots: Knot[];
    if (duration !== undefined) {
      knots = [{ t: 0, L: L0, m: 0 }, { t: Math.max(duration, 1e-3), L: L1, m: 0 }];
    } else {
      const Lv = Math.max(L1, Math.log(Math.max(target.radius, 1) * 300));
      if (L0 > Lv + 0.7) {
        const TA = clamp(1.0 + 0.15 * (L0 - Lv), 1.7, 3.6);
        const TB = clamp(1.4 + 0.5 * Math.abs(Lv - L1), 2.4, 4.6);
        const sA = (Lv - L0) / TA, sB = (L1 - Lv) / TB;
        const mJ = sA * sB > 0 ? (2 * sA * sB) / (sA + sB) : 0;
        knots = [{ t: 0, L: L0, m: 0 }, { t: TA, L: Lv, m: mJ }, { t: TA + TB, L: L1, m: 0 }];
      } else {
        knots = [{ t: 0, L: L0, m: 0 }, { t: clamp(1.8 + 0.5 * Math.abs(L0 - L1), 2.2, 4.6), L: L1, m: 0 }];
      }
    }
    const T = knots[knots.length - 1].t;
    const up = this.up(new Vector3());
    const swing = arriveDir && arriveDir.angleTo(dir) > 1e-4 ? new Quaternion().setFromUnitVectors(dir, arriveDir.clone().normalize()) : null;
    const Ls = Math.min(L0, Math.log(Math.max(target.radius, 1) * 300) + 2);
    this.target = target;
    this.goto = {
      target, dir, knots, t: 0, T, fastUntil: knots.length > 2 ? knots[1].t : 0, q0: this.quat.clone(), rotate, up,
      swing, swingFrom: Ls, swingTo: L1,
    };
    this.setAnchor(target);
  }

  /**
   * External inputs for the current frame (VR controllers). `move` is a world-space
   * direction with length 0..1; orbit/zoom are in "drag pixels" / "wheel ticks" per second.
   * Cleared after every update.
   */
  readonly ext = { move: new Vector3(), boost: 1, orbitX: 0, orbitY: 0, zoom: 0, throttle: -1, rot: new Vector3() };

  private clearExt(): void {
    this.ext.move.set(0, 0, 0);
    this.ext.boost = 1;
    this.ext.orbitX = this.ext.orbitY = this.ext.zoom = 0;
    this.ext.throttle = -1;
    this.ext.rot.set(0, 0, 0);
  }

  /** Physics flight drives the camera itself (src/game/Flight.ts): it only clears the controller inputs. */
  updateExternal(): void {
    this.clearExt();
  }

  /** Rotate the view about its own vertical axis (VR snap turn). */
  turn(angleRad: number): void {
    this.quat.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), angleRad));
  }

  cancelGoto(): void {
    this.goto = null;
  }

  /** Autopilot progress 0..1 (1 when idle). */
  get gotoProgress(): number {
    return this.goto ? this.goto.t / this.goto.T : 1;
  }

  /** true while the autopilot crosses the far stretch where the target is still a dot */
  get gotoCruising(): boolean {
    return !!this.goto && this.goto.t < this.goto.fastUntil;
  }

  update(dt: number, input: Input): void {
    this.step(dt, input);
    this.clearExt();
  }

  private step(dt: number, input: Input): void {
    const consumed = input.consume();
    const { left } = consumed;
    const right = { dx: consumed.right.dx + this.ext.orbitX * 400 * dt, dy: consumed.right.dy + this.ext.orbitY * 400 * dt };
    const wheel = consumed.wheel + this.ext.zoom * 6 * dt;
    const k = input.keys;
    const rotSpeed = (this.fov / 50) * 0.0025;

    // Free look (left drag) and roll (Q/E)
    if (left.dx || left.dy) {
      const qy = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -left.dx * rotSpeed);
      const qx = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -left.dy * rotSpeed);
      this.quat.multiply(qy).multiply(qx);
      if (this.goto) this.goto.rotate = false;
    }
    const roll = (k.has('KeyQ') ? 1 : 0) - (k.has('KeyE') ? 1 : 0);
    if (roll) this.quat.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), roll * dt * 1.2));

    // Orbit around the target (right drag / shift+left drag)
    if ((right.dx || right.dy) && this.target) {
      const rel = this.upos.sub(this.target.upos, this.tmp);
      const yaw = new Quaternion().setFromAxisAngle(this.up(new Vector3()), -right.dx * 0.005);
      const pitch = new Quaternion().setFromAxisAngle(this.right(new Vector3()), -right.dy * 0.005);
      const q = yaw.multiply(pitch);
      const newRel = rel.clone().applyQuaternion(q);
      this.upos.addVec(newRel.sub(rel));
      this.quat.premultiply(q);
    }

    // Wheel: zoom towards the target, or change speed in free flight
    if (wheel) {
      if (this.target && !this.goto) {
        const rel = this.upos.sub(this.target.upos, this.tmp);
        const d = rel.length();
        const minD = Math.max(this.target.radius * 1.002, 1);
        const nd = Math.max(minD, d * Math.pow(1.18, wheel));
        this.upos.addVec(rel, nd / d - 1);
      } else {
        this.speedFactor = Math.min(1e6, Math.max(1e-4, this.speedFactor * Math.pow(1.5, -wheel)));
      }
    }

    // Autopilot
    if (this.goto) {
      const g = this.goto;
      g.t = Math.min(g.T, g.t + dt);
      const s = g.t / g.T;
      const L = hermite(g.knots, g.t);
      const dir = g.dir.clone();
      if (g.swing) {
        // inward or outward: progress from swingFrom to swingTo in log distance
        const span = g.swingTo - g.swingFrom;
        const w = Math.abs(span) < 1e-6 ? 1 : smooth((L - g.swingFrom) / span);
        dir.applyQuaternion(new Quaternion().slerp(g.swing, w));
      }
      const want = g.target.upos.clone().addVec(dir, Math.exp(L));
      this.upos.copy(want);
      if (g.rotate) {
        const look = new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(new Vector3(), dir.negate(), g.up));
        this.quat.copy(g.q0).slerp(look, Math.min(1, smooth(s / 0.35)));
      }
      this.speed = 0;
      if (g.t >= g.T) this.goto = null;
      return;
    }

    // Translation (WASD + R/F), speed proportional to altitude
    const move = this.tmp2.set(
      (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0),
      (k.has('KeyR') ? 1 : 0) - (k.has('KeyF') ? 1 : 0),
      (k.has('KeyS') ? 1 : 0) - (k.has('KeyW') ? 1 : 0),
    );
    let mult = this.speedFactor;
    if (k.has('ShiftLeft') || k.has('ShiftRight')) mult *= 10;
    if (k.has('ControlLeft') || k.has('ControlRight')) mult *= 0.1;
    const base = Math.max(this.altitude, 1) * 0.8 * mult;
    let wantVel = move.lengthSq() > 0 ? move.normalize().applyQuaternion(this.quat).multiplyScalar(base) : new Vector3();
    if (this.ext.move.lengthSq() > 1e-6) wantVel = this.ext.move.clone().multiplyScalar(base * this.ext.boost);
    const fwd = this.forward(new Vector3());
    this.thrust = wantVel.lengthSq() > 0 ? wantVel.dot(fwd) / wantVel.length() : 0;
    if (this.inertia > 0) {
      // ship: momentum carries on; flight assist (or the brake) bleeds it off
      if (wantVel.lengthSq() > 0) this.velocity.lerp(wantVel, 1 - Math.exp(-dt / this.inertia));
      else this.velocity.multiplyScalar(Math.exp(-dt / (this.braking ? 0.25 : 6)));
      if (this.braking && wantVel.lengthSq() > 0) this.velocity.multiplyScalar(Math.exp(-dt / 0.25));
      // never faster than the local speed scale allows (it shrinks near surfaces)
      const vmax = Math.max(this.altitude, 1) * 0.8 * this.speedFactor * 12;
      if (this.velocity.length() > vmax) this.velocity.setLength(vmax);
      if (this.velocity.length() < base * 1e-4) this.velocity.set(0, 0, 0);
    } else {
      // Smooth acceleration
      const a = 1 - Math.exp(-dt * 6);
      this.velocity.lerp(wantVel, a);
      if (move.lengthSq() === 0 && this.velocity.length() < base * 1e-3) this.velocity.set(0, 0, 0);
    }
    // Never fly through a surface: limit the step to 90 % of the altitude
    let step = this.velocity.length() * dt;
    if (step > this.altitude * 0.9 && this.altitude > 0) step = this.altitude * 0.9;
    if (step > 0) this.upos.addVec(this.velocity.clone().normalize(), step);
    this.speed = dt > 0 ? step / dt : 0;
  }
}

interface Knot { t: number; L: number; m: number }

interface GotoState {
  target: SpaceObject;
  dir: Vector3;
  knots: Knot[];
  t: number;
  T: number;
  fastUntil: number;
  q0: Quaternion;
  /** turn to face the target (off once the user looks around) */
  rotate: boolean;
  up: Vector3;
  /** rotation from `dir` to the arrival direction, applied between log-distances swingFrom -> swingTo */
  swing: Quaternion | null;
  swingFrom: number;
  swingTo: number;
}

/** Piecewise cubic Hermite through `knots` (value L, slope m). */
function hermite(k: Knot[], t: number): number {
  let i = 0;
  while (i < k.length - 2 && t > k[i + 1].t) i++;
  const a = k[i], b = k[i + 1];
  const h = b.t - a.t;
  const s = clamp((t - a.t) / h, 0, 1);
  const s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * a.L + (s3 - 2 * s2 + s) * h * a.m + (-2 * s3 + 3 * s2) * b.L + (s3 - s2) * h * b.m;
}

function clamp(x: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, x));
}

function smooth(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}
