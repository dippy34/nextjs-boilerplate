"""Sharper regional levels on top of the global pyramids (build_elevation.py).

  Earth  Copernicus DEM GLO-90 (3 arc-seconds, ~90 m; heights vs EGM2008 like ETOPO), AWS open data
         bucket copernicus-dem-90m, 1 x 1 degree COG tiles -> levels 8 (153 m) and 9 (76 m) over
         the Alps, the Everest Himalaya, the Aconcagua Andes, the Grand Canyon and the other
         landmark mountains.
         Licence: free, worldwide, any purpose, with this credit: "produced using Copernicus
         WorldDEM-90 (c) DLR e.V. 2010-2014 and (c) Airbus Defence and Space GmbH 2014-2018 provided
         under COPERNICUS by the European Union and ESA; all rights reserved".
  Moon   LRO LOLA + SELENE TC SLDEM2015 (512 px/deg, ~59 m, within +-60 deg), PDS Geosciences Node,
         read row by row with HTTP range requests -> levels 6 (167 m) and 7 (83 m) around the
         Apollo 11/15/17 sites, Chang'e 4, Tycho and Copernicus. Public domain (NASA).

Within each region, tiles of both levels are ranked by the detail they add over their parent
(RMS x 2^(-level/2), the parent built from the coarser source when it is not stored) and kept
until the body's regional budget is spent. Only tiles whose samples (apron included) all lie in
a region are made.
"""
from __future__ import annotations

import heapq
import json
import math
import time
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from pathlib import Path

import numpy as np
import requests

from common import UA
from elevation_sources import DIR as SRC_DIR, fetch

import build_elevation as be

COP = "https://copernicus-dem-90m.s3.amazonaws.com/"
SLDEM = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/sldem2015/tiles/float_img/"

# name, lat0, lat1, lon0, lon1 (degrees; lon may run past +-180 / 0..360 as needed)
REGIONS = {
    "earth": [
        ("alps", 43.7, 48.3, 5.0, 16.0),
        ("himalaya", 27.0, 29.0, 84.4, 88.6),
        ("aconcagua", -33.4, -31.9, -70.8, -69.3),
        ("grandcanyon", 35.8, 36.6, -113.6, -111.6),
        ("kilimanjaro", -3.5, -2.6, 36.9, 37.8),
        ("maunakea", 18.85, 20.35, -156.15, -154.75),
        ("fuji", 34.95, 35.75, 138.3, 139.15),
        ("denali", 62.7, 63.45, -152.1, -150.0),
    ],
    "moon": [
        ("apollo11", -4.3, 5.7, 18.5, 28.5),
        ("apollo15", 21.1, 31.1, -1.4, 8.6),
        ("apollo17", 15.2, 25.2, 25.8, 35.8),
        ("change4", -50.4, -40.4, 172.6, 182.6),
        ("tycho", -48.3, -38.3, -16.4, -6.4),
        ("copernicus", 4.6, 14.6, -25.1, -15.1),
    ],
}
HI = {
    "earth": dict(levels=(8, 9), ppd=1200, budget=90,
                  credit="Copernicus DEM GLO-90 (c) DLR e.V. 2010-2014 and (c) Airbus Defence and Space GmbH 2014-2018, "
                         "provided under COPERNICUS by the European Union and ESA"),
    "moon": dict(levels=(6, 7), ppd=512, budget=45,
                 credit="NASA LRO LOLA / JAXA SELENE TC, SLDEM2015 (512 px/deg), PDS Geosciences Node"),
}
WORK = be.WORK


# ---------------------------------------------------------------- regional grids
def region_path(body: str, name: str) -> Path:
    return WORK / f"{body}_hi_{name}.npy"


def _cop_tile(lat: int, lon: int) -> Path | None:
    name = (f"Copernicus_DSM_COG_30_{'N' if lat >= 0 else 'S'}{abs(lat):02d}_00_"
            f"{'E' if lon >= 0 else 'W'}{abs(lon):03d}_00_DEM")
    dest = SRC_DIR / "cop90" / f"{name}.tif"
    if dest.exists():
        return dest
    if (SRC_DIR / "cop90" / f"{name}.none").exists():
        return None
    r = requests.head(f"{COP}{name}/{name}.tif", headers=UA, timeout=60)
    if r.status_code in (403, 404):                 # open ocean: no tile
        (SRC_DIR / "cop90").mkdir(parents=True, exist_ok=True)
        (SRC_DIR / "cop90" / f"{name}.none").write_text("")
        return None
    return fetch(f"{COP}{name}/{name}.tif", dest)


def earth_region(name: str, lat0: float, lat1: float, lon0: float, lon1: float) -> None:
    import rasterio
    from rasterio.transform import from_origin
    from rasterio.warp import Resampling, reproject
    p = region_path("earth", name)
    if p.exists():
        return
    ppd = HI["earth"]["ppd"]
    H, W = round((lat1 - lat0) * ppd), round((lon1 - lon0) * ppd)
    dst = np.full((H, W), np.nan, np.float32)
    tr = from_origin(lon0, lat1, 1 / ppd, 1 / ppd)
    cells = [(la, lo) for la in range(math.floor(lat0), math.ceil(lat1)) for lo in range(math.floor(lon0), math.ceil(lon1))]
    with ThreadPoolExecutor(6) as ex:
        paths = list(ex.map(lambda c: _cop_tile(*c), cells))
    for path in paths:
        if path is None:
            continue
        with rasterio.open(path) as ds:
            src = ds.read(1).astype(np.float32)
            tmp = np.full((H, W), np.nan, np.float32)
            reproject(src, tmp, src_transform=ds.transform, src_crs=ds.crs, src_nodata=ds.nodata,
                      dst_transform=tr, dst_crs="EPSG:4326", dst_nodata=np.nan, resampling=Resampling.bilinear)
            ok = np.isfinite(tmp)
            dst[ok] = tmp[ok]
    dst[~np.isfinite(dst)] = 0.0                       # ocean
    np.save(p, dst)
    print(f"  earth/{name}: {W}x{H} from {sum(x is not None for x in paths)} tiles, max {dst.max():.0f} m", flush=True)


def _sldem_file(lat: float, lon: float) -> tuple[str, float, float]:
    """(url, top latitude, west longitude) of the SLDEM2015 512 ppd tile holding (lat, lon 0..360)."""
    bands = [(30, 60, "30n_60n"), (0, 30, "00n_30n"), (-30, 0, "30s_00s"), (-60, -30, "60s_30s")]
    for lo, hi, tag in bands:
        if lo <= lat < hi or (lat == 60 and hi == 60):
            break
    w = int(lon // 45) * 45
    return f"{SLDEM}sldem2015_512_{tag}_{w:03d}_{w + 45:03d}_float.img", hi, w


def moon_region(name: str, lat0: float, lat1: float, lon0: float, lon1: float) -> None:
    from fetch_hires import range_get
    p = region_path("moon", name)
    if p.exists():
        return
    ppd = HI["moon"]["ppd"]
    H, W = round((lat1 - lat0) * ppd), round((lon1 - lon0) * ppd)
    out = np.zeros((H, W), np.float32)
    lons = lon0 + (np.arange(W) + 0.5) / ppd                       # pixel centres
    lon360 = lons % 360.0
    TW = 45 * ppd

    def row(i: int):
        lat = lat1 - (i + 0.5) / ppd
        vals = np.empty(W, np.float32)
        # split the row by source tile (45 degrees of longitude each)
        w = (lon360 // 45).astype(int)
        for k in np.unique(w):
            sel = np.nonzero(w == k)[0]
            url, top, west = _sldem_file(lat, k * 45 + 1)
            r = int((top - lat) * ppd)
            c = np.floor((lon360[sel] - west) * ppd).astype(int)
            a, b = int(c.min()), int(c.max())
            off = (r * TW + a) * 4
            seg = np.frombuffer(range_get(url, off, off + (b - a + 1) * 4 - 1), "<f4")
            vals[sel] = seg[c - a]
        return i, vals

    t0 = time.time()
    with ThreadPoolExecutor(24) as ex:
        for i, v in ex.map(row, range(H)):
            out[i] = v * 1000.0                                      # km -> m vs 1737.4 km
    np.save(p, out)
    print(f"  moon/{name}: {W}x{H}, {out.min():.0f}..{out.max():.0f} m ({time.time() - t0:.0f} s)", flush=True)


class Region:
    """A regional grid (row 0 at lat1, column 0 at lon0, cell-centred), with 2x2-average levels."""

    def __init__(self, body: str, name: str, lat0, lat1, lon0, lon1):
        self.name, self.lat0, self.lat1, self.lon0, self.lon1 = name, lat0, lat1, lon0, lon1
        self.ppd = HI[body]["ppd"]
        a = np.load(region_path(body, name), mmap_mode="r")
        self.levels = [np.asarray(a, np.float32)]
        while min(self.levels[-1].shape) > 64:
            g = self.levels[-1]
            h2, w2 = g.shape[0] // 2, g.shape[1] // 2
            self.levels.append(g[:2 * h2, :2 * w2].reshape(h2, 2, w2, 2).mean(axis=(1, 3)))
        self.R = None

    def contains(self, lat: np.ndarray, lon: np.ndarray, margin: float) -> bool:
        lonc = (self.lon0 + self.lon1) / 2
        dl = (lon - lonc + 180.0) % 360.0 - 180.0 + lonc
        return bool((lat.min() > self.lat0 + margin) and (lat.max() < self.lat1 - margin)
                    and (dl.min() > self.lon0 + margin) and (dl.max() < self.lon1 - margin))

    def sample(self, lat: np.ndarray, lon: np.ndarray, spacing_deg: float) -> np.ndarray:
        k = 0
        while k + 1 < len(self.levels) and (2 ** (k + 1)) / self.ppd <= spacing_deg * 1.001:
            k += 1
        g = self.levels[k]
        ppd = self.ppd / 2 ** k
        lonc = (self.lon0 + self.lon1) / 2
        dl = (lon - lonc + 180.0) % 360.0 - 180.0 + lonc
        px = (dl - self.lon0) * ppd - 0.5
        py = (self.lat1 - lat) * ppd - 0.5
        x0, y0 = np.floor(px).astype(np.int64), np.floor(py).astype(np.int64)
        wx, wy = be.catmull(px - x0), be.catmull(py - y0)
        H, W = g.shape
        h = np.zeros(px.shape, np.float64)
        for j in range(4):
            yy = np.clip(y0 - 1 + j, 0, H - 1)
            r = np.zeros(px.shape, np.float64)
            for i in range(4):
                r += wx[i] * g[yy, np.clip(x0 - 1 + i, 0, W - 1)]
            h += wy[j] * r
        return h


_R: list[Region] = []
_BODY = ""


def _init(body: str) -> None:
    global _R, _BODY
    _BODY = body
    be._init(body)
    _R = [Region(body, *r) for r in REGIONS[body]]


def _heights(level: int, face: int, x: int, y: int) -> np.ndarray | None:
    """Tile heights from a regional grid, or None if no region holds the whole tile."""
    d = be.face_dirs(face, level, x, y)
    lat = np.degrees(np.arcsin(np.clip(d[..., 2], -1, 1)))
    lon = np.degrees(np.arctan2(d[..., 1], d[..., 0]))
    spacing_m = be._G.R * (math.pi / 2) / (be.T << level)
    for r in _R:
        if r.contains(lat, lon, 3.0 / r.ppd):
            h = r.sample(lat, lon, math.degrees(spacing_m / be._G.R))
            cfg = be.BODIES[_BODY]
            if "oceanFill" in cfg:
                h = np.where(h <= cfg["sea"], cfg["oceanFill"], h)
            return h
    return None


def _job(args):
    level, face, x, y, parent, offset, step = args
    h = _heights(level, face, x, y)
    if h is None:
        return (level, face, x, y), None, None, 0.0
    if parent is None:      # the parent from the global source (it may not be stored)
        parent = be.tile_heights(level - 1, face, x >> 1, y >> 1)
    ref = be.upsample_parent(parent, x, y)
    hh = h
    cfg = be.BODIES[_BODY]
    if "oceanFill" in cfg:
        hh, ref = np.maximum(h, cfg["sea"]), np.maximum(ref, cfg["sea"])
    score = float(np.sqrt(np.mean((hh[1:-1, 1:-1] - ref[1:-1, 1:-1]) ** 2))) * 2.0 ** (-level / 2)
    return (level, face, x, y), h.astype(np.float32), be.encode(h, offset, step), score


def candidates(body: str, level: int) -> list[tuple[int, int, int]]:
    out = set()
    for name, lat0, lat1, lon0, lon1 in REGIONS[body]:
        n = 1 << level
        step = 0.25 * 90.0 / n                         # a quarter tile (degrees)
        for lat in np.arange(lat0, lat1 + step, step):
            for lon in np.arange(lon0, lon1 + step, step):
                f, u, v = be.dir_to_face(be.latlon_dir(min(lat, lat1), min(lon, lon1)))
                out.add((f, min(n - 1, int(u * n)), min(n - 1, int(v * n))))
    return sorted(out)


def build(body: str) -> dict:
    cfg, hcfg = be.BODIES[body], HI[body]
    for r in REGIONS[body]:
        (earth_region if body == "earth" else moon_region)(*r)
    out_dir = be.DEST / body
    man = json.loads((out_dir / "manifest.json").read_text())
    offset, step = man["offset"], man["step"]
    lo_level, hi_level = hcfg["levels"]
    for lv in (lo_level, hi_level):
        d = out_dir / str(lv)
        if d.exists():
            for p in d.glob("*.png"):
                p.unlink()
    man["levels"] = [e for e in man["levels"] if e["level"] < lo_level]
    budget = hcfg["budget"] * 1e6
    used = 0
    chosen: dict[tuple, np.ndarray] = {}
    heap: list = []
    t0 = time.time()
    with ProcessPoolExecutor(4, initializer=_init, initargs=(body,)) as ex:
        jobs = [(lo_level, f, x, y, None, offset, step) for f, x, y in candidates(body, lo_level)]
        for key, h, png, score in ex.map(_job, jobs, chunksize=2):
            if h is not None:
                heapq.heappush(heap, (-score, key, h, png))
        print(f"  {body} hires: {len(heap)} L{lo_level} candidates ({time.time() - t0:.0f} s)", flush=True)
        while heap:
            batch = []
            while heap and len(batch) < 32:
                pri, key, h, png = heapq.heappop(heap)
                if used + len(png) > budget:
                    continue
                chosen[key] = h
                p = out_dir / str(key[0]) / f"{key[1]}-{key[2]}-{key[3]}.png"
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_bytes(png)
                used += len(png)
                batch.append(key)
            if not batch:
                break
            jobs = [(lv + 1, f, 2 * x + dx, 2 * y + dy, chosen[(lv, f, x, y)], offset, step)
                    for (lv, f, x, y) in batch if lv < hi_level for dy in (0, 1) for dx in (0, 1)]
            for key, h, png, score in ex.map(_job, jobs, chunksize=2):
                if h is not None:
                    heapq.heappush(heap, (-score, key, h, png))
        print(f"  {body} hires: {len(chosen)} tiles, {used / 1e6:.1f} MB ({time.time() - t0:.0f} s)", flush=True)
    R = man["referenceRadius"]
    for lv in (lo_level, hi_level):
        keys = sorted(k for k in chosen if k[0] == lv)
        if keys:
            man["levels"].append({"level": lv, "tiles": len(keys),
                                  "metresPerSample": round(R * (math.pi / 2) / (be.T << lv), 2),
                                  "list": [c for (_, f, x, y) in keys for c in (f, x, y)],
                                  "regions": [r[0] for r in REGIONS[body]]})
    man["bytes"] = sum(p.stat().st_size for p in out_dir.rglob("*.png"))
    man["regionalCredit"] = hcfg["credit"]
    man["regions"] = [{"name": r[0], "lat0": r[1], "lat1": r[2], "lon0": r[3], "lon1": r[4]} for r in REGIONS[body]]
    if body == "earth":
        man["license"] = ("Public domain (ETOPO 2022, NOAA); Copernicus DEM GLO-90 levels: free use with the credit in "
                          "regionalCredit (Copernicus DEM licence)")
    (out_dir / "manifest.json").write_text(json.dumps(man, indent=1))
    return man
