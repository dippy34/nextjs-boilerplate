import { App } from './app/App';

declare global {
  interface Window { app?: App; appError?: string }
}

async function main(): Promise<void> {
  const canvas = document.getElementById('view') as HTMLCanvasElement;
  const hud = document.getElementById('hud')!;
  const labels = document.getElementById('labels')!;
  try {
    const app = await App.create(canvas, hud, labels);
    window.app = app;
    app.start();
  } catch (err) {
    console.error(err);
    window.appError = String(err instanceof Error ? err.stack ?? err.message : err);
    const div = document.createElement('div');
    div.className = 'fatal';
    div.textContent = `Failed to start: ${window.appError}`;
    document.body.appendChild(div);
  }
}

main();
