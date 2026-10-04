"""Tile pyramids of the planet and moon maps, for close-up detail: public/data/tiles/

The engine's base maps are 4096 x 2048 (level 2 of a pyramid of 512-pixel tiles: level L is
2^(L+1) x 2^L tiles, i.e. 1024 * 2^L pixels around). This script cuts levels 3 and up from the
full-resolution sources, as deep as each source supports (up to level 4 = 16384 x 8192), into
public/data/tiles/<body>/<level>/<row>_<col>.jpg, with an index in public/data/tiles/tiles.json.
When the explorer is close to a body, the engine composes the tiles around the view into a detail
texture (src/render/TileDetail.ts).

Sources are the ones the base maps were made from (all public domain; see CREDITS.md):
  Earth    NASA Blue Marble NG 21600 x 10800 (Oct 2004)
  Moon     NASA SVS CGI Moon Kit, LROC WAC colour 16k
  Mars     USGS Viking MDIM 2.1 colour mosaic (232 m)
  Mercury  USGS MESSENGER MDIS BDR mosaic (166 m)
  moons, dwarf planets, Vesta and Ceres: the USGS mosaics in fetch_moons_hires.py
Each map is aligned to the engine's base map by correlation (same longitude origin and direction).
"""
from __future__ import annotations

import json
import shutil
import sys

import numpy as np
import rasterio
from PIL import Image

from common import OUT, write_json
from fetch_hires import EO, HI, SVS, USGS, StripTiff, download, fill_nan_zonal
from fetch_moons_hires import B as MOON_BASE, MOONS

Image.MAX_IMAGE_PIXELS = None
TEX = OUT / "textures"
TILES = OUT / "tiles"
T = 512
MAX_LEVEL = 4


def level_for(source_width: int) -> int:
    """Deepest level the source supports (allowing ~15 % upsampling), capped at MAX_LEVEL."""
    lv = 2
    while lv < MAX_LEVEL and 1024 * 2 ** (lv + 1) <= source_width * 1.15:
        lv += 1
    return lv


def align(img: np.ndarray, base_path) -> np.ndarray:
    """Flip/roll `img` (H, W[, C]) to match the base map's longitude convention (by correlation)."""
    base = np.asarray(Image.open(base_path).convert("L").resize((512, 256), Image.BILINEAR)).astype(np.float32)
    g = img if img.ndim == 2 else img.mean(axis=-1)
    small = np.asarray(Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).resize((512, 256), Image.BILINEAR)).astype(np.float32)
    best = None
    for flip in (False, True):
        s = small[:, ::-1] if flip else small
        for shift in range(0, 512, 2):
            c = np.corrcoef(np.roll(s, shift, axis=1).ravel(), base.ravel())[0, 1]
            if best is None or c > best[0]:
                best = (c, flip, shift)
    c, flip, shift = best
    print(f"  aligned: corr {c:.3f} flip={flip} shift={shift * 360 / 512:.1f} deg")
    if c < 0.5:
        raise RuntimeError(f"alignment failed (corr {c:.2f})")
    out = img[:, ::-1] if flip else img
    return np.roll(out, shift * img.shape[1] // 512, axis=1)


def cut(key: str, img: np.ndarray, top: int, mode: str) -> None:
    """Write levels 3..top of `img` (the level-`top` image) as 512-px JPEG tiles."""
    d = TILES / key
    if d.exists():
        shutil.rmtree(d)
    im = Image.fromarray(img.astype(np.uint8), mode)
    for lv in range(top, 2, -1):
        w, h = 1024 * 2 ** lv, 512 * 2 ** lv
        if im.size != (w, h):
            im = im.resize((w, h), Image.LANCZOS)
        (d / str(lv)).mkdir(parents=True, exist_ok=True)
        for r in range(h // T):
            for c in range(w // T):
                im.crop((c * T, r * T, (c + 1) * T, (r + 1) * T)).save(d / str(lv) / f"{r}_{c}.jpg", quality=84, optimize=True)
        print(f"  level {lv}: {(w // T) * (h // T)} tiles")


def from_strip_tiff(url: str, bands: int, nodata=None) -> tuple[np.ndarray, int]:
    t = StripTiff(url)
    lv = level_for(t.width)
    if lv <= 2:
        return np.zeros(0), lv
    w, h = 1024 * 2 ** lv, 512 * 2 ** lv
    arr = t.decimated(w, h, bands=tuple(range(bands)), rows_per_out=1, nodata=nodata)
    arr = fill_nan_zonal(arr) if nodata is not None else np.nan_to_num(arr, nan=0.0)
    return np.clip(arr + 0.5, 0, 255).squeeze(), lv


def earth() -> tuple[np.ndarray, int, str, str]:
    src = download(EO + "74000/74167/world.200410.3x21600x10800.jpg", HI / "bmng_200410_21600.jpg", min_size=10_000_000)
    img = np.asarray(Image.open(src).convert("RGB").resize((16384, 8192), Image.LANCZOS))
    return img, 4, "RGB", EO + "74000/74167/world.200410.3x21600x10800.jpg"


def moon() -> tuple[np.ndarray, int, str, str]:
    url = SVS + "lroc_color_poles_16k.tif"
    p = download(url, HI / "lroc_color_poles_16k.tif", min_size=100_000_000)
    with rasterio.open(p) as ds:
        rgb = np.moveaxis(ds.read(), 0, -1)
    if rgb.shape[:2] != (8192, 16384):
        rgb = np.asarray(Image.fromarray(rgb).resize((16384, 8192), Image.LANCZOS))
    return rgb, 4, "RGB", url


def main() -> None:
    only = set(sys.argv[1:])
    TILES.mkdir(parents=True, exist_ok=True)
    idx_path = TILES / "tiles.json"
    index = json.loads(idx_path.read_text()) if idx_path.exists() else {"tileSize": T, "bodies": {}}
    man = json.loads((TEX / "manifest.json").read_text())["maps"]
    jobs: list[tuple[str, str]] = [("earth_day", "earth"), ("moon", "moon"), ("mars", "mars"), ("mercury", "mercury")]
    jobs += [(k, k) for k in MOONS]
    for map_key, body in jobs:
        if only and body not in only:
            continue
        print(f"[{body}]")
        try:
            if body == "earth":
                img, lv, mode, src = earth()
            elif body == "moon":
                img, lv, mode, src = moon()
            elif body == "mars":
                url = USGS + "Mars_Viking_MDIM21_ClrMosaic_global_232m.tif"
                img, lv = from_strip_tiff(url, 3, nodata=0)
                mode, src = "RGB", url
            elif body == "mercury":
                url = USGS + "Mercury_MESSENGER_MDIS_Basemap_BDR_Mosaic_Global_166m.tif"
                img, lv = from_strip_tiff(url, 1, nodata=0)
                mode, src = "L", url
            else:
                file, bands, _credit = MOONS[body]
                img, lv = from_strip_tiff(MOON_BASE + file, bands)
                mode, src = ("RGB" if bands == 3 else "L"), MOON_BASE + file
            if lv <= 2:
                print("  source is no sharper than the base map: skipped")
                continue
            base = TEX / man[map_key]["file"]
            img = align(img, base)
            cut(body, img, lv, mode)
            index["bodies"][map_key] = {"maxLevel": lv, "channels": "RGB" if mode == "RGB" else "L", "source": src}
            write_json(idx_path, index, compact=False)
        except Exception as e:  # noqa: BLE001
            print(f"  FAILED: {e}")
    print("done")


if __name__ == "__main__":
    main()
