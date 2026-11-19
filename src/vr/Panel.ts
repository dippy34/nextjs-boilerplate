import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, Vector2 } from 'three';

/**
 * A flat, canvas-drawn UI surface in 3D. Drawing code registers rectangular hit
 * regions while it paints; the VR pointer turns a ray hit (uv) into the region
 * under it for hover and click.
 */
export interface HitRegion {
  id: string;
  x: number; y: number; w: number; h: number;
  onClick?: () => void;
}

export const FONT = 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif';
export const COLORS = {
  bg: 'rgba(9, 13, 24, 0.90)',
  bgSolid: '#0a0f1c',
  card: 'rgba(255, 255, 255, 0.05)',
  cardHover: 'rgba(127, 178, 255, 0.22)',
  active: 'rgba(127, 178, 255, 0.35)',
  border: 'rgba(127, 178, 255, 0.35)',
  accent: '#7fb2ff',
  text: '#e8eef8',
  dim: '#8c98ad',
  warn: '#ffcc66',
  sel: '#fff27a',
};

export class Panel {
  readonly mesh: Mesh;
  readonly canvas = document.createElement('canvas');
  readonly ctx: CanvasRenderingContext2D;
  readonly tex: CanvasTexture;
  private regions: HitRegion[] = [];
  hover: string | null = null;
  dirty = true;
  visible = true;

  constructor(readonly width: number, readonly height: number, widthMeters: number, private paint: (p: Panel) => void) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    this.tex = new CanvasTexture(this.canvas);
    this.tex.colorSpace = SRGBColorSpace;
    this.tex.minFilter = LinearMipmapLinearFilter;
    this.tex.magFilter = LinearFilter;
    this.tex.anisotropy = 4;
    const mat = new MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    this.mesh = new Mesh(new PlaneGeometry(widthMeters, (widthMeters * height) / width), mat);
    this.mesh.renderOrder = 1000;
    this.mesh.frustumCulled = false;
    this.mesh.userData.panel = this;
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.mesh.visible = v;
  }

  /** Repaint if something changed. */
  update(): void {
    if (!this.dirty || !this.visible) return;
    this.dirty = false;
    this.regions = [];
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.paint(this);
    this.tex.needsUpdate = true;
  }

  regionAt(uv: Vector2): HitRegion | null {
    const x = uv.x * this.width;
    const y = (1 - uv.y) * this.height;
    for (let i = this.regions.length - 1; i >= 0; i--) {
      const r = this.regions[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r;
    }
    return null;
  }

  /** Is there a button with this id (tests)? */
  has(id: string): boolean {
    this.update();
    return this.regions.some((x) => x.id === id);
  }

  /** Press a button by id (tests); false when it isn't on the panel. */
  click(id: string): boolean {
    this.update();
    const r = this.regions.find((x) => x.id === id);
    r?.onClick?.();
    this.dirty = true;
    return !!r;
  }

  setHover(id: string | null): void {
    if (id === this.hover) return;
    this.hover = id;
    this.dirty = true;
  }

  // ---------------------------------------------------------------- drawing helpers
  region(r: HitRegion): void {
    this.regions.push(r);
  }

  rect(x: number, y: number, w: number, h: number, r: number, fill?: string, stroke?: string, lw = 3): void {
    const c = this.ctx;
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
  }

  text(t: string, x: number, y: number, size: number, color = COLORS.text, weight = 400, align: CanvasTextAlign = 'left', maxW?: number): void {
    const c = this.ctx;
    c.font = `${weight} ${size}px ${FONT}`;
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = 'middle';
    if (maxW && c.measureText(t).width > maxW) {
      while (t.length > 1 && c.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
      t = `${t}…`;
    }
    c.fillText(t, x, y);
  }

  /** A button with hover / active states; registers its hit region. */
  button(id: string, x: number, y: number, w: number, h: number, label: string, onClick: () => void,
    opts: { active?: boolean; size?: number; color?: string; sub?: string; align?: CanvasTextAlign; disabled?: boolean } = {}): void {
    const hov = this.hover === id && !opts.disabled;
    this.rect(x, y, w, h, Math.min(18, h / 3), opts.active ? COLORS.active : hov ? COLORS.cardHover : COLORS.card,
      hov || opts.active ? COLORS.accent : 'rgba(255,255,255,0.08)', hov ? 4 : 2);
    const size = opts.size ?? Math.min(34, h * 0.42);
    const align = opts.align ?? 'center';
    const tx = align === 'center' ? x + w / 2 : x + 22;
    if (opts.sub) {
      this.text(label, tx, y + h * 0.38, size, opts.disabled ? COLORS.dim : opts.color ?? COLORS.text, 600, align, w - 30);
      this.text(opts.sub, tx, y + h * 0.7, size * 0.62, COLORS.dim, 400, align, w - 30);
    } else {
      this.text(label, tx, y + h / 2 + 1, size, opts.disabled ? COLORS.dim : opts.color ?? COLORS.text, 600, align, w - 30);
    }
    if (!opts.disabled) this.region({ id, x, y, w, h, onClick });
  }
}
