"""Sharper elevation patches around the landmarks: public/data/terrain/patches/*.png (+ terrain.json)

The global height maps (build_terrain.py) are 5-10 km per sample. Around each landmark of
src/universe/Landmarks.ts a patch is cut at (or near) the full resolution of the source model, read
row by row with HTTP range requests (no full download):

  Moon  LRO LOLA LDEM_128 (128 pixels/degree, ~237 m), PDS Geosciences Node,
        lro-l-lola-3-rdr-v1 / lola_gdr / cylindrical  (16-bit LSB, 0.5 m per unit, vs 1737.4 km)
  Mars  MGS MOLA global DEM 463 m (the same source as the global map), via USGS Astrogeology
  Earth NOAA NCEI ETOPO 2022 15 arc-second surface elevation (~460 m), 15-degree GeoTIFF tiles
        (downloaded whole); water (height <= 0) stored as -200 m like the global Earth map

All are public domain (U.S. Government work). Same encoding as the global maps: RGB PNG,
height = (R * 256 + G) * scale + offset; bounds in degrees (planetocentric, east longitude).
"""
from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor

import math

import numpy as np
import rasterio
from PIL import Image

from common import OUT
from fetch_hires import HI, USGS, StripTiff, download, range_get

DIR = OUT / "terrain"
LOLA = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_128.img"
MOLA = USGS + "Mars_MGS_MOLA_DEM_mosaic_global_463m.tif"

# (name, body, lat, lon, size in output pixels, decimation step)
PATCHES = [
    ("apollo11", "moon", 0.674, 23.473, 512, 1),
    ("tycho", "moon", -43.31, -11.36, 768, 1),
    ("copernicus", "moon", 9.62, -20.08, 768, 1),
    ("olympus", "mars", 18.65, -133.8, 1024, 2),
    ("valles", "mars", -13.9, -59.2, 1024, 2),
    ("gale", "mars", -4.589, 137.441, 512, 1),
    ("jezero", "mars", 18.445, 77.451, 512, 1),
]

# (name, lat, lon, size in output pixels): Earth, from ETOPO 2022 15" tiles (240 samples per degree)
EARTH_PATCHES = [
    ("everest", 27.988, 86.925, 768),
    ("grandcanyon", 36.10, -112.11, 768),
    ("kilimanjaro", -3.0674, 37.3556, 512),
    ("matterhorn", 45.976, 7.658, 768),
    ("maunakea", 19.82, -155.47, 768),
]
ETOPO15 = "https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO2022/data/15s/15s_surface_elev_gtif/"

PPD = 128  # both sources: 128 samples per degree


class LolaImg:
    """Rows of the PDS LDEM_128 image (46080 x 23040 int16 LSB, column 0 at 0 deg E, row 0 at +90)."""
    width, height = 46080, 23040
    lon0 = 0.0

    def row(self, r: int) -> np.ndarray:
        off = r * self.width * 2
        return np.frombuffer(range_get(LOLA, off, off + self.width * 2 - 1), "<i2").astype(np.float32) * 0.5


class MolaTif:
    """Rows of the MOLA 463 m mosaic (46080 x 23040 int16, column 0 at -180 deg, row 0 at +90)."""
    lon0 = -180.0

    def __init__(self) -> None:
        self.t = StripTiff(MOLA)
        self.width, self.height = self.t.width, self.t.height

    def row(self, r: int) -> np.ndarray:
        return self.t.row(r)


def cut(src, lat: float, lon: float, size: int, step: int) -> tuple[np.ndarray, dict]:
    n = size * step                                   # source pixels across
    rc = int(round((90.0 - lat) * PPD - 0.5))         # centre row
    cc = int(round(((lon - src.lon0) % 360.0) * PPD - 0.5))
    r0 = max(0, min(src.height - n, rc - n // 2))
    c0 = cc - n // 2
    cols = np.arange(c0, c0 + n) % src.width

    def get(r: int) -> np.ndarray:
        return src.row(r)[cols]

    with ThreadPoolExecutor(16) as ex:
        rows = list(ex.map(get, range(r0, r0 + n)))
    a = np.stack(rows)
    if step > 1:
        a = a.reshape(size, step, size, step).mean(axis=(1, 3))
    bounds = {
        "lat1": 90.0 - r0 / PPD, "lat0": 90.0 - (r0 + n) / PPD,
        "lon0": src.lon0 + c0 / PPD, "lon1": src.lon0 + (c0 + n) / PPD,
    }
    return a, bounds


def save(name: str, h: np.ndarray) -> dict:
    lo, hi = float(h.min()), float(h.max())
    scale = max(0.5, (hi - lo) / 65535.0)
    v = np.clip(np.round((h - lo) / scale), 0, 65535).astype(np.uint32)
    rgb = np.zeros(h.shape + (3,), np.uint8)
    rgb[..., 0] = v >> 8
    rgb[..., 1] = v & 255
    (DIR / "patches").mkdir(parents=True, exist_ok=True)
    path = DIR / "patches" / f"{name}.png"
    Image.fromarray(rgb, "RGB").save(path, optimize=True)
    print(f"  {name}: {h.shape[1]}x{h.shape[0]} {lo:.0f}..{hi:.0f} m, {path.stat().st_size / 1e6:.1f} MB")
    return {"file": f"patches/{name}.png", "width": int(h.shape[1]), "height": int(h.shape[0]), "offset": lo, "scale": scale}


def etopo_tile(lat_top: int, lon_left: int):
    name = f"ETOPO_2022_v1_15s_{'N' if lat_top >= 0 else 'S'}{abs(lat_top):02d}{'E' if lon_left >= 0 else 'W'}{abs(lon_left):03d}_surface.tif"
    return download(ETOPO15 + name, HI / "etopo15" / name, min_size=1_000_000)


def cut_earth(lat: float, lon: float, size: int) -> tuple[np.ndarray, dict]:
    ppd = 240
    half = size / 2 / ppd
    lat0, lon0 = round((lat - half) * ppd) / ppd, round((lon - half) * ppd) / ppd
    lat1, lon1 = lat0 + size / ppd, lon0 + size / ppd
    # mosaic of the 15-degree tiles (named by their north-west corner) on the common 1/240 degree grid
    h = np.zeros((size, size), np.float32)
    for top in range(math.ceil((lat0 + 1e-9) / 15) * 15, math.ceil((lat1 - 1e-9) / 15) * 15 + 1, 15):
        for left in range(math.floor(lon0 / 15) * 15, math.floor((lon1 - 1e-9) / 15) * 15 + 1, 15):
            r0 = round((top - lat1) * ppd)          # output row 0 in tile rows
            c0 = round((lon0 - left) * ppd)
            ra, rb = max(0, -r0), min(size, 15 * ppd - r0)
            ca, cb = max(0, -c0), min(size, 15 * ppd - c0)
            if ra >= rb or ca >= cb:
                continue
            with rasterio.open(etopo_tile(top, left)) as ds:
                h[ra:rb, ca:cb] = ds.read(1, window=((r0 + ra, r0 + rb), (c0 + ca, c0 + cb)))
    h[h < -20000] = 0
    h[h <= 0] = -200.0
    return h, {"lat0": lat0, "lat1": lat1, "lon0": lon0, "lon1": lon1}


def main() -> None:
    import sys
    if sys.argv[1:] == ["earth"]:
        # add (or redo) only the Earth patches, keeping the others
        manifest_path = DIR / "terrain.json"
        manifest = json.loads(manifest_path.read_text())
        patches = [p for p in manifest.get("patches", []) if p["body"] != "earth"] + earth_patches()
        manifest["patches"] = patches
        manifest_path.write_text(json.dumps(manifest, indent=1))
        print(f"wrote {len(patches)} patches into terrain.json")
        return
    _all()


def earth_patches() -> list[dict]:
    out = []
    for name, lat, lon, size in EARTH_PATCHES:
        h, b = cut_earth(lat, lon, size)
        out.append(save(name, h) | b | {"name": name, "body": "earth",
                                         "credit": "NOAA NCEI ETOPO 2022 15 arc-second (surface)"})
    return out


def _all() -> None:
    sources = {"moon": LolaImg(), "mars": MolaTif()}
    manifest_path = DIR / "terrain.json"
    manifest = json.loads(manifest_path.read_text())
    patches = []
    for name, body, lat, lon, size, step in PATCHES:
        h, b = cut(sources[body], lat, lon, size, step)
        entry = save(name, h) | b | {"name": name, "body": body,
                                     "credit": "LRO LOLA LDEM_128 (PDS Geosciences)" if body == "moon" else "MGS MOLA DEM 463 m (USGS)"}
        patches.append(entry)
    patches += earth_patches()
    manifest["patches"] = patches
    manifest_path.write_text(json.dumps(manifest, indent=1))
    print(f"wrote {len(patches)} patches into terrain.json")


if __name__ == "__main__":
    main()
