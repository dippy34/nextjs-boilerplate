/** Keyboard / mouse state collected between frames. */
export class Input {
  readonly keys = new Set<string>();
  dragLeft = { dx: 0, dy: 0 };
  dragRight = { dx: 0, dy: 0 };
  wheel = 0;
  private down: { button: number; x: number; y: number; moved: boolean } | null = null;
  onClick: ((x: number, y: number, ev: MouseEvent) => void) | null = null;
  onDoubleClick: ((x: number, y: number) => void) | null = null;
  onKey: ((ev: KeyboardEvent) => void) | null = null;
  mouse = { x: 0, y: 0 };

  constructor(private el: HTMLElement) {
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      this.down = { button: e.button, x: e.clientX, y: e.clientY, moved: false };
    });
    el.addEventListener('pointermove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (!this.down) return;
      const dx = e.movementX, dy = e.movementY;
      if (Math.abs(e.clientX - this.down.x) + Math.abs(e.clientY - this.down.y) > 4) this.down.moved = true;
      if (this.down.button === 0 && !e.shiftKey) { this.dragLeft.dx += dx; this.dragLeft.dy += dy; }
      else { this.dragRight.dx += dx; this.dragRight.dy += dy; }
    });
    el.addEventListener('pointerup', (e) => {
      if (this.down && !this.down.moved && this.down.button === 0) this.onClick?.(e.clientX, e.clientY, e);
      this.down = null;
    });
    el.addEventListener('dblclick', (e) => this.onDoubleClick?.(e.clientX, e.clientY));
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.wheel += Math.sign(e.deltaY) * Math.min(3, Math.abs(e.deltaY) / 100 + 0.5);
    }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      this.keys.add(e.code);
      this.onKey?.(e);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  consume(): { left: { dx: number; dy: number }; right: { dx: number; dy: number }; wheel: number } {
    const r = { left: this.dragLeft, right: this.dragRight, wheel: this.wheel };
    this.dragLeft = { dx: 0, dy: 0 };
    this.dragRight = { dx: 0, dy: 0 };
    this.wheel = 0;
    return r;
  }

  get element(): HTMLElement {
    return this.el;
  }
}
