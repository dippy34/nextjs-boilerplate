import { App } from './app/App';
import { StartMenu } from './app/StartMenu';
import { installPerfTools } from './perf/tools';

declare global {
  interface Window { app?: App; appError?: string; startMenu?: StartMenu }
}

async function main(): Promise<void> {
  const canvas = document.getElementById('view') as HTMLCanvasElement;
  const hud = document.getElementById('hud')!;
  const labels = document.getElementById('labels')!;
  const boot = document.getElementById('boot');
  // the title screen (src/app/StartMenu.ts) shows while loading; deep links (the tests) skip it
  const menu = StartMenu.wanted() ? new StartMenu() : null;
  if (menu) { boot?.remove(); window.startMenu = menu; }
  try {
    if (!document.createElement('canvas').getContext('webgl2')) throw new Error('WebGL 2 is not available in this browser.');
    const app = await App.create(canvas, hud, labels);
    window.app = app;
    app.start();
    menu?.attach(app);
    installPerfTools(app, () => menu?.start());
    boot?.classList.add('done');
    setTimeout(() => boot?.remove(), 1000);
  } catch (err) {
    boot?.remove();
    menu?.fail();
    console.error(err);
    window.appError = String(err instanceof Error ? err.stack ?? err.message : err);
    const div = document.createElement('div');
    div.className = 'fatal';
    div.textContent = `Failed to start: ${window.appError}`;
    document.body.appendChild(div);
  }
}

main();
