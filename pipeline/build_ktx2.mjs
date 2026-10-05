/**
 * GPU-compressed copies (KTX2, Basis ETC1S with mipmaps) of the colour maps and the Milky Way
 * background, for headsets: a 4k map is 8x smaller in GPU memory and bandwidth than RGBA8 and
 * uploads without a decode stall. The JPGs stay as the fallback.
 *
 *   node pipeline/build_ktx2.mjs /path/to/basisu
 *
 * basisu is Binomial's encoder (github.com/BinomialLLC/basis_universal, Apache-2.0), built from
 * source. Planet maps are encoded with -linear (raw sRGB values: the body shader decodes them
 * itself) and their mean linear luminance (BodiesLayer's albedo calibration, which a compressed
 * texture cannot be read back for) is computed here with the same code in a browser and written
 * to the texture manifest as `ktx2: { file, meanLum }`. Images are flipped (-y_flip) to match
 * TextureLoader's flipY.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const basisu = process.argv[2];
if (!basisu) { console.error('usage: node pipeline/build_ktx2.mjs /path/to/basisu'); process.exit(1); }
const TEX = 'public/data/textures';
const SKY = 'public/data/sky';
const manifestPath = `${TEX}/manifest.json`;
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

const encode = (src, dir, linear) => {
  const args = ['-ktx2', '-etc1s', '-mipmap', '-y_flip', '-q', '190', '-comp_level', '2', '-output_path', dir];
  if (linear) args.push('-linear');
  execFileSync(basisu, [...args, src], { stdio: ['ignore', 'ignore', 'inherit'] });
};

const browser = await chromium.launch();
const page = await browser.newPage();
// (identical to meanLinearLuminance in src/render/Bodies.ts)
const meanLum = (path) => page.evaluate(async (b64) => {
  const img = await createImageBitmap(await (await fetch(`data:image/jpeg;base64,${b64}`)).blob());
  const c = document.createElement('canvas');
  c.width = 64; c.height = 32;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, 64, 32);
  const d = ctx.getImageData(0, 0, 64, 32).data;
  let sum = 0, wsum = 0;
  for (let y = 0; y < 32; y++) {
    const w = Math.cos(((y + 0.5) / 32 - 0.5) * Math.PI);
    for (let x = 0; x < 64; x++) {
      const i = (y * 64 + x) * 4;
      const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const l = 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
      if (l < 0.002) continue;
      sum += w * l; wsum += w;
    }
  }
  return wsum > 0 ? sum / wsum : 0.3;
}, readFileSync(path).toString('base64'));

for (const [key, info] of Object.entries(manifest.maps)) {
  // (relief maps are data: block compression would put steps into the heights)
  if (key.endsWith('_relief') || !info.file.endsWith('.jpg')) continue;
  const file = info.file.replace(/\.jpg$/, '.ktx2');
  encode(`${TEX}/${info.file}`, TEX, true);
  info.ktx2 = { file, meanLum: Number((await meanLum(`${TEX}/${info.file}`)).toFixed(5)) };
  console.log(key, info.ktx2);
}
encode(`${SKY}/milkyway_4k.jpg`, SKY, false);
await browser.close();
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 1)}\n`);
