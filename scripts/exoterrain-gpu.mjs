// Checks that the CPU copy of the generated planets' height field (universe/ExoTerrain.ts `exoTerrain`)
// matches EXO_FRAG's `terrain()` on the GPU, desktop and headset variants: renders terrain() for a
// few thousand directions into a float target and compares. Needs the Vite dev server (it imports
// the TypeScript sources directly):
//   npx vite --port 4175 --strictPort &   node scripts/exoterrain-gpu.mjs http://127.0.0.1:4175/
import { chromium } from '@playwright/test';
const base = process.argv[2] ?? 'http://127.0.0.1:4175/';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.goto(`${base}src/universe/ExoTerrain.ts`);
const res = await page.evaluate(async () => {
  const { exoTerrain } = await import('/src/universe/ExoTerrain.ts');
  const { EXO_FRAG } = await import('/src/render/shaders/planet.ts');
  const a = EXO_FRAG.indexOf('float ph(vec3 p)');
  const b = EXO_FRAG.indexOf('\n', EXO_FRAG.indexOf('float terrain(vec3 n)'));
  const lib = EXO_FRAG.slice(a, b);
  const W = 64, H = 64, N = W * H;
  const dir = (i) => {
    const z = 1 - (2 * (i + 0.5)) / N, r = Math.sqrt(1 - z * z), th = Math.PI * (3 - Math.sqrt(5)) * i;
    return [r * Math.cos(th), r * Math.sin(th), z];
  };
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const gl = cv.getContext('webgl2');
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return { error: 'no float render targets' };
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, `#version 300 es
  precision highp float; precision highp int;
  uniform float uLite; uniform float uSeed; uniform sampler2D uDir;
  out vec4 o;
  ${lib}
  void main() { vec3 n = texelFetch(uDir, ivec2(gl_FragCoord.xy), 0).xyz; o = vec4(terrain(n), 0.0, 0.0, 1.0); }`));
  gl.bindAttribLocation(prog, 0, 'p');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return { error: gl.getProgramInfoLog(prog) };
  gl.useProgram(prog);
  const dirs = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) dirs.set([...dir(i), 0], i * 4);
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, W, H, 0, gl.RGBA, gl.FLOAT, dirs);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const out = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, out);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, W, H, 0, gl.RGBA, gl.FLOAT, null);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, out, 0);
  const vb = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(gl.getUniformLocation(prog, 'uDir'), 0);
  gl.viewport(0, 0, W, H);
  const results = [];
  for (const seed of [3, 41, 96]) {
    for (const lite of [false, true]) {
      gl.uniform1f(gl.getUniformLocation(prog, 'uSeed'), seed);
      gl.uniform1f(gl.getUniformLocation(prog, 'uLite'), lite ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      const px = new Float32Array(N * 4);
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.FLOAT, px);
      let maxErr = 0, sum = 0;
      for (let i = 0; i < N; i++) {
        const [x, y, z] = dir(i);
        const e = Math.abs(px[i * 4] - exoTerrain({ x, y, z }, seed, lite));
        maxErr = Math.max(maxErr, e);
        sum += e;
      }
      results.push({ seed, lite, maxErr, meanErr: sum / N });
    }
  }
  return { results };
});
console.log(JSON.stringify(res, null, 1));
const bad = !res.results || res.results.some((r) => r.maxErr > 2e-3);
console.log(bad ? 'MISMATCH' : 'ok: GPU terrain() matches exoTerrain()');
await browser.close();
process.exit(bad ? 1 : 0);
