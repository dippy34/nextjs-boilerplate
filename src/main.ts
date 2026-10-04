import { App } from './app/App';

declare global {
  interface Window { app?: App; appError?: string }
}

async function main(): Promise<void> {
  const canvas = document.getElementById('view') as HTMLCanvasElement;
  const hud = document.getElementById('hud')!;
  const labels = document.getElementById('labels')!;
  const boot = document.getElementById('boot');
  try {
    if (!document.createElement('canvas').getContext('webgl2')) throw new Error('WebGL 2 is not available in this browser.');
    const app = await App.create(canvas, hud, labels);
    window.app = app;
    app.start();
    boot?.classList.add('done');
    setTimeout(() => boot?.remove(), 1000);
  } catch (err) {
    boot?.remove();
    console.error(err);
    window.appError = String(err instanceof Error ? err.stack ?? err.message : err);
    const div = document.createElement('div');
    div.className = 'fatal';
    div.textContent = `Failed to start: ${window.appError}`;
    document.body.appendChild(div);
  }
}

main();
