import { Vector3 } from 'three';

/**
 * Universal position: each axis is a double-double (hi + lo) number of metres,
 * giving ~32 significant digits. That is enough to place a camera millimetres
 * above a planet's surface in a galaxy 100 Mpc away. Only differences between
 * two UPos values (camera-relative vectors) are ever converted to plain doubles
 * and then to float32 for the GPU — this is the "floating origin".
 */
export class UPos {
  xh = 0; xl = 0;
  yh = 0; yl = 0;
  zh = 0; zl = 0;

  static from(x: number, y: number, z: number): UPos {
    const p = new UPos();
    p.xh = x; p.yh = y; p.zh = z;
    return p;
  }

  set(x: number, y: number, z: number): this {
    this.xh = x; this.xl = 0; this.yh = y; this.yl = 0; this.zh = z; this.zl = 0;
    return this;
  }

  copy(o: UPos): this {
    this.xh = o.xh; this.xl = o.xl; this.yh = o.yh; this.yl = o.yl; this.zh = o.zh; this.zl = o.zl;
    return this;
  }

  clone(): UPos {
    return new UPos().copy(this);
  }

  /** this += (x, y, z) with error-free transformation. */
  addXYZ(x: number, y: number, z: number): this {
    [this.xh, this.xl] = ddAdd(this.xh, this.xl, x);
    [this.yh, this.yl] = ddAdd(this.yh, this.yl, y);
    [this.zh, this.zl] = ddAdd(this.zh, this.zl, z);
    return this;
  }

  addVec(v: Vector3, scale = 1): this {
    return this.addXYZ(v.x * scale, v.y * scale, v.z * scale);
  }

  /** this += o (both double-double). */
  addUPos(o: UPos): this {
    [this.xh, this.xl] = ddAddDD(this.xh, this.xl, o.xh, o.xl);
    [this.yh, this.yl] = ddAddDD(this.yh, this.yl, o.yh, o.yl);
    [this.zh, this.zl] = ddAddDD(this.zh, this.zl, o.zh, o.zl);
    return this;
  }

  /** out = this - o, as a plain double vector (exact up to the result's own precision). */
  sub(o: UPos, out = new Vector3()): Vector3 {
    out.x = ddSubToDouble(this.xh, this.xl, o.xh, o.xl);
    out.y = ddSubToDouble(this.yh, this.yl, o.yh, o.yl);
    out.z = ddSubToDouble(this.zh, this.zl, o.zh, o.zl);
    return out;
  }

  /** Lossy conversion to a plain double vector (for display / coarse maths only). */
  toVector3(out = new Vector3()): Vector3 {
    return out.set(this.xh + this.xl, this.yh + this.yl, this.zh + this.zl);
  }

  /** Linear interpolation between a and b (t in [0, 1]) computed on the difference vector. */
  static lerp(a: UPos, b: UPos, t: number, out = new UPos()): UPos {
    const d = b.sub(a, _tmp);
    return out.copy(a).addXYZ(d.x * t, d.y * t, d.z * t);
  }
}

const _tmp = new Vector3();

function twoSum(a: number, b: number): [number, number] {
  const s = a + b;
  const bb = s - a;
  const err = a - (s - bb) + (b - bb);
  return [s, err];
}

function ddAdd(hi: number, lo: number, b: number): [number, number] {
  const [s, e] = twoSum(hi, b);
  const e2 = e + lo;
  const h = s + e2;
  return [h, e2 - (h - s)];
}

function ddAddDD(ah: number, al: number, bh: number, bl: number): [number, number] {
  const [s, e] = twoSum(ah, bh);
  const e2 = e + al + bl;
  const h = s + e2;
  return [h, e2 - (h - s)];
}

function ddSubToDouble(ah: number, al: number, bh: number, bl: number): number {
  const [s, e] = twoSum(ah, -bh);
  return s + (e + al - bl);
}
