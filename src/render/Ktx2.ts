import type { Texture, WebGLRenderer } from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

/**
 * GPU-compressed maps (KTX2 / Basis ETC1S, pipeline/build_ktx2.mjs) for the big planet maps and
 * the Milky Way background. Transcoded in a worker to the GPU's block format (ASTC or ETC2 on a
 * headset), a 4k map takes an eighth of the memory and bandwidth of RGBA8 and uploads without
 * decoding a JPG on the main thread. The JPG/PNG stays the fallback: when this is off, when the
 * GPU has no supported format, or when a KTX2 file fails to load.
 *
 * On by default where a headset can be used (the renderer is XR-capable); ?ktx2=1 turns it on
 * elsewhere (to compare), ?ktx2=0 off.
 */
export function ktx2Wanted(search: string, xrCapable: boolean): boolean {
  const q = new URLSearchParams(search).get('ktx2');
  if (q === '1') return true;
  if (q === '0') return false;
  return xrCapable;
}

let loader: KTX2Loader | null = null;

/** Set up the loader for `gl` (once, before any map loads) when `on`. */
export function initKtx2(gl: WebGLRenderer, on: boolean, base: string): void {
  if (!on || loader) return;
  try {
    loader = new KTX2Loader().setTranscoderPath(`${base}basis/`).detectSupport(gl);
    console.info('KTX2 maps on');
  } catch (e) {
    console.warn('KTX2 unavailable, using JPG maps', e);
    loader = null;
  }
}

export function ktx2On(): boolean {
  return loader !== null;
}

/** The KTX2 texture at `url`, or null (off, or failed: the caller loads its fallback). */
export async function loadKtx2(url: string): Promise<Texture | null> {
  if (!loader) return null;
  try {
    return await loader.loadAsync(url);
  } catch (e) {
    console.warn('KTX2 map failed, using the fallback', url, e);
    return null;
  }
}
