// Stereo measurement in the emulated headset (IWER composites the two eye images side by side into
// the page canvas): where does a point appear in each eye, and so with what disparity?
//
// `measureDisparity(page, relExpr)` takes a JS expression (evaluated in the page with `a` = window.app)
// for a scene point relative to the explorer (metres). It projects that point analytically into
// both eyes twice: where true stereo puts it (the point seen from each eye), and where it would be at
// infinity (its direction from the eyes' midpoint, the same from both eyes). Then it finds the same
// image patch in both eye images (block matching on luminance, sub-pixel) and reports the measured
// disparity next to the two predictions, in pixels of one eye image:
//   { measured, truth, infinity, left: [x, y], right: [x, y], score }
// A far body must match `infinity` (and `truth`, which is the same for it); a rock a few metres away
// must match `truth`, which differs from `infinity` by f * IPD / distance.

export async function measureDisparity(page, relExpr, { half = 40, search = 24 } = {}) {
  return page.evaluate(([expr, half, search]) => {
    const a = window.app;
    const T = new Function('a', `return ${expr};`)(a);
    const canvas = document.querySelector('canvas');
    const W = canvas.width, H = canvas.height, eyeW = W / 2;
    const xc = a.renderer.gl.xr.getCamera();
    const cams = xc.cameras;
    // (not getWorldPosition: the eye cameras have no parent, and three sets their world matrices itself)
    const eyes = cams.map((c) => T.clone().setFromMatrixPosition(c.matrixWorld));
    const mid = eyes[0].clone().add(eyes[1]).multiplyScalar(0.5);
    const proj = (p, c, i) => {
      const v = p.clone().project(c);
      return [(v.x * 0.5 + 0.5) * eyeW + i * eyeW, (0.5 - v.y * 0.5) * H];
    };
    const truth = cams.map((c, i) => proj(T, c, i));
    // at infinity: the direction from the midpoint, pushed far out from each eye
    const dir = T.clone().sub(mid).normalize().multiplyScalar(1e9);
    const inf = cams.map((c, i) => proj(eyes[i].clone().add(dir), c, i));
    // luminance of the canvas
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'); ctx.drawImage(canvas, 0, 0);
    const d = ctx.getImageData(0, 0, W, H).data;
    const L = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) L[i] = 0.299 * d[4 * i] + 0.587 * d[4 * i + 1] + 0.114 * d[4 * i + 2];
    const at = (x, y) => L[Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))];
    // patch in the left eye around the true position; search the right eye along x (and +-2 rows)
    const lx = Math.round(truth[0][0]), ly = Math.round(truth[0][1]);
    const cx = Math.round((truth[1][0] + inf[1][0]) / 2);
    let mean = 0, n = 0;
    for (let y = -half; y <= half; y++) for (let x = -half; x <= half; x++) { mean += at(lx + x, ly + y); n++; }
    mean /= n;
    let contrast = 0;
    for (let y = -half; y <= half; y++) for (let x = -half; x <= half; x++) contrast += (at(lx + x, ly + y) - mean) ** 2;
    const ssd = (ox, oy) => {
      let s = 0;
      for (let y = -half; y <= half; y++) for (let x = -half; x <= half; x++) {
        const e = at(lx + x, ly + y) - at(ox + x, oy + y);
        s += e * e;
      }
      return s;
    };
    let best = { s: Infinity, x: cx, y: ly };
    const costs = new Map();
    for (let dy = -2; dy <= 2; dy++) for (let dx = -search; dx <= search; dx++) {
      const s = ssd(cx + dx, ly + dy);
      costs.set(`${cx + dx},${ly + dy}`, s);
      if (s < best.s) best = { s, x: cx + dx, y: ly + dy };
    }
    const sm = costs.get(`${best.x - 1},${best.y}`) ?? ssd(best.x - 1, best.y), sp = costs.get(`${best.x + 1},${best.y}`) ?? ssd(best.x + 1, best.y);
    const den = sm - 2 * best.s + sp;
    const sub = den > 0 ? (0.5 * (sm - sp)) / den : 0;
    const rx = best.x + sub;
    const r2 = (v) => Math.round(v * 100) / 100;
    return {
      measured: r2(rx - eyeW - lx),
      truth: r2(truth[1][0] - eyeW - truth[0][0]),
      infinity: r2(inf[1][0] - eyeW - inf[0][0]),
      left: truth[0].map(r2), right: [r2(rx), best.y], dist: r2(T.distanceTo(mid)),
      // how well the patch matched (0 perfect, 1 no better than a flat patch), and whether it had any detail
      score: r2(best.s / Math.max(contrast, 1e-6)), contrast: r2(Math.sqrt(contrast / n)),
    };
  }, [relExpr, half, search]);
}

/**
 * Give the emulated headset the real Quest 3's asymmetric eye frusta (IWER's are symmetric): each
 * eye sees further to its own side than towards the nose, so the two projection centres differ.
 * Content that draws both eyes alike in screen space (or with one eye's projection) then lands at a
 * false depth, which symmetric frusta would hide. Call as an init script after IWER's runtime is
 * installed. Angles (degrees): outer, inner, up, down.
 */
export function asymmetricFrusta([outer, inner, up, down] = [52, 41, 46, 50]) {
  const d = Math.PI / 180;
  const desc = Object.getOwnPropertyDescriptor(window.XRView.prototype, 'projectionMatrix');
  const cache = new WeakMap();
  Object.defineProperty(window.XRView.prototype, 'projectionMatrix', {
    configurable: true,
    get() {
      const base = desc.get.call(this);
      let m = cache.get(base);
      if (!m) {
        const left = this.eye === 'left';
        const l = -Math.tan((left ? outer : inner) * d), r = Math.tan((left ? inner : outer) * d);
        const t = Math.tan(up * d), b = -Math.tan(down * d);
        m = new Float32Array(base);
        m[0] = 2 / (r - l); m[8] = (r + l) / (r - l);
        m[5] = 2 / (t - b); m[9] = (t + b) / (t - b);
        cache.set(base, m);
      }
      return m;
    },
  });
}
