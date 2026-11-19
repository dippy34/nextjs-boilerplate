/// <reference lib="webworker" />
// God mode's N-body simulation off the main thread (src/god/runner.ts, src/god/NBody.ts).
import { SimRunner, type SimRequest } from './runner';

const runner = new SimRunner();
let scheduled = false;

function loop(): void {
  scheduled = false;
  // a bounded slice of work, then yield so new goals and edits are read promptly
  const snaps = runner.pump(24);
  for (const s of snaps) (self as DedicatedWorkerGlobalScope).postMessage(s, [s.ids.buffer, s.gm.buffer, s.r.buffer, s.xv.buffer, s.tids.buffer, s.txv.buffer]);
  if (!runner.done) schedule();
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  setTimeout(loop, 0);
}

self.onmessage = (e: MessageEvent<SimRequest>) => {
  runner.handle(e.data);
  if (e.data.type === 'state') {
    // the edited state itself, so the display continues from it at once
    const s = runner.snapshot();
    (self as DedicatedWorkerGlobalScope).postMessage(s);
  }
  schedule();
};
