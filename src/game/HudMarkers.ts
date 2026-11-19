import { CanvasTexture, Group, LinearFilter, Mesh, MeshBasicMaterial, PlaneGeometry, Quaternion, SRGBColorSpace, Vector3 } from 'three';

/** A small canvas-drawn sprite floating in the cockpit (rig-local), always facing the eye. */
class Marker {
  readonly mesh: Mesh;
  private canvas = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D;
  private tex: CanvasTexture;
  private last = '';

  constructor(px: number, sizeM: number, private draw: (c: CanvasRenderingContext2D, s: number, text: string) => void) {
    this.canvas.width = this.canvas.height = px;
    this.ctx = this.canvas.getContext('2d')!;
    this.tex = new CanvasTexture(this.canvas);
    this.tex.colorSpace = SRGBColorSpace;
    this.tex.minFilter = LinearFilter;
    this.mesh = new Mesh(new PlaneGeometry(sizeM, sizeM), new MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    this.mesh.renderOrder = 999;
    this.mesh.frustumCulled = false;
  }

  set(text: string): void {
    if (text === this.last) return;
    this.last = text;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.draw(this.ctx, this.canvas.width, text);
    this.tex.needsUpdate = true;
  }
}

const CYAN = 'rgba(120, 220, 255, 0.95)';

/**
 * Head-up display projected on the canopy: a bracket around the target with its name and
 * distance (or an arrow at the edge when it is behind you), the flight-path marker (where the ship
 * is going) and a boresight cross (where the nose points). Lives in the rig's frame, 4 m out.
 */
export class HudMarkers {
  readonly group = new Group();
  private target: Marker;
  private flight: Marker;
  private bore: Marker;
  private readonly R = 4;

  constructor() {
    this.target = new Marker(256, 0.55, (c, s, text) => {
      const [name, dist] = text.split('|');
      c.strokeStyle = CYAN;
      c.lineWidth = 6;
      const m = s * 0.18, k = s * 0.14;
      for (const [x, y, dx, dy] of [[m, m, 1, 1], [s - m, m, -1, 1], [m, s - m, 1, -1], [s - m, s - m, -1, -1]]) {
        c.beginPath();
        c.moveTo(x + dx * k, y); c.lineTo(x, y); c.lineTo(x, y + dy * k);
        c.stroke();
      }
      c.fillStyle = CYAN;
      c.font = '600 22px Inter, system-ui, sans-serif';
      c.textAlign = 'center';
      c.fillText(name ?? '', s / 2, s * 0.13, s * 0.96);
      c.font = '500 20px Inter, system-ui, sans-serif';
      c.fillText(dist ?? '', s / 2, s * 0.95, s * 0.96);
    });
    this.flight = new Marker(128, 0.16, (c, s) => {
      c.strokeStyle = 'rgba(160, 255, 170, 0.9)';
      c.lineWidth = 5;
      c.beginPath(); c.arc(s / 2, s / 2, s * 0.18, 0, Math.PI * 2); c.stroke();
      for (const [x0, y0, x1, y1] of [[s * 0.18, s / 2, s * 0.32, s / 2], [s * 0.68, s / 2, s * 0.82, s / 2], [s / 2, s * 0.32, s / 2, s * 0.18]]) {
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      }
    });
    this.bore = new Marker(64, 0.08, (c, s) => {
      c.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      c.lineWidth = 3;
      c.beginPath(); c.moveTo(s * 0.2, s / 2); c.lineTo(s * 0.8, s / 2); c.moveTo(s / 2, s * 0.2); c.lineTo(s / 2, s * 0.8); c.stroke();
    });
    this.bore.set('+');
    this.flight.set('o');
    this.group.add(this.target.mesh, this.flight.mesh, this.bore.mesh);
    this.group.name = 'hud-markers';
    this.group.visible = false;
  }

  /**
   * `targetDirRig`: unit direction to the target in rig-local axes (null = none); `velDirRig`:
   * direction of motion (null when still). Text: "name|distance".
   */
  update(targetDirRig: Vector3 | null, text: string, velDirRig: Vector3 | null): void {
    const face = (m: Mesh, dir: Vector3) => {
      m.position.copy(dir).multiplyScalar(this.R);
      m.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), dir.clone().negate()));
    };
    this.bore.mesh.position.set(0, 0, -this.R);
    this.target.mesh.visible = !!targetDirRig;
    if (targetDirRig) {
      // behind or far off to the side: pin to the edge of the view, pointing the way
      const d = targetDirRig.clone();
      if (d.z > -0.35) {
        const side = new Vector3(d.x, d.y, 0);
        if (side.lengthSq() < 1e-6) side.set(0, -1, 0);
        side.normalize();
        d.set(side.x * 0.55, side.y * 0.4, -0.75).normalize();
      }
      face(this.target.mesh, d);
      this.target.set(text);
    }
    this.flight.mesh.visible = !!velDirRig && velDirRig.z < -0.2;
    if (velDirRig && this.flight.mesh.visible) face(this.flight.mesh, velDirRig);
  }
}
