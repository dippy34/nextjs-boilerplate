/** HTML labels with greedy overlap rejection. */
export interface LabelCandidate {
  key: string;
  text: string;
  x: number; // CSS px
  y: number;
  /** pixel radius of the object, labels are offset beyond it */
  radius: number;
  priority: number;
  cls: string;
}

export class Labels {
  enabled = true;
  private nodes = new Map<string, HTMLDivElement>();
  private used = new Set<string>();

  constructor(private container: HTMLElement) {}

  update(cands: LabelCandidate[], width: number, height: number): void {
    this.used.clear();
    if (this.enabled) {
      cands.sort((a, b) => b.priority - a.priority);
      const boxes: [number, number, number, number][] = [];
      let shown = 0;
      for (const c of cands) {
        if (shown >= 80) break;
        const w = 7 * c.text.length + 6, h = 14;
        const x = c.x + Math.min(c.radius, 40) * 0.72 + 4;
        const y = c.y - Math.min(c.radius, 40) * 0.72 - h + 2;
        if (x > width || y > height || x + w < 0 || y + h < 0) continue;
        let overlap = false;
        for (const b of boxes) {
          if (x < b[0] + b[2] && x + w > b[0] && y < b[1] + b[3] && y + h > b[1]) { overlap = true; break; }
        }
        if (overlap) continue;
        boxes.push([x, y, w, h]);
        let el = this.nodes.get(c.key);
        if (!el) {
          el = document.createElement('div');
          this.container.appendChild(el);
          this.nodes.set(c.key, el);
        }
        if (el.textContent !== c.text) el.textContent = c.text;
        const cls = `label ${c.cls}`;
        if (el.className !== cls) el.className = cls;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        el.style.display = '';
        this.used.add(c.key);
        shown++;
      }
    }
    for (const [k, el] of this.nodes) {
      if (!this.used.has(k)) {
        if (this.nodes.size > 400) {
          el.remove();
          this.nodes.delete(k);
        } else {
          el.style.display = 'none';
        }
      }
    }
  }
}
