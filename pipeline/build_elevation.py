"""Global elevation tile pyramids on a cube: public/data/elevation/<body>/ + manifest.json

Real topography for the whole-planet terrain, from orbit down to the ground, read at runtime by
src/universe/Elevation.ts.

Sources (all public domain, U.S. Government works / NASA mission data; see CREDITS.md):
  Moon     LRO LOLA LDEM_128 (128 px/deg, ~237 m), PDS Geosciences Node        (0.5 m units vs 1737.4 km)
  Mars     MGS MOLA global DEM 463 m (128 px/deg), USGS Astrogeology            (m vs the MOLA areoid)
  Mercury  MESSENGER USGS global DEM 665 m v2 (64 px/deg), USGS Astrogeology   (0.5 m units vs 2439.4 km)
  Earth    NOAA NCEI ETOPO 2022 15 arc-second surface elevation (~460 m)       (m vs the EGM2008 geoid)
  Ceres    Dawn FC HAMO DTM (DLR) 60 px/deg, USGS Astrogeology                 (m vs a 470 km sphere)
  Vesta    Dawn FC HAMO DTM (DLR) 48 px/deg, USGS Astrogeology                 (radius, m)

Heights are stored in metres above the reference surface the engine measures from: the IAU
ellipsoid of the body (public/data/solar/system.json radii) for Mercury, Ceres and Vesta (their
models are converted from a sphere / radii), the areoid for Mars and the geoid for Earth (as the
existing terrain maps), the 1737.4 km sphere for the Moon.

CUBE FACE CONVENTION (shared with src/universe/Elevation.ts; body-fixed frame: +X towards
0 deg E on the equator, +Y towards 90 deg E, +Z the north pole):

    face  normal N   image right U   image down V
     0      +X          +Y              -Z
     1      -X          -Y              -Z
     2      +Y          -X              -Z
     3      -Y          +X              -Z
     4      +Z          +Y              +X
     5      -Z          +Y              -X

  (U x V = -N on every face: all faces seen from outside with the same handedness; on the four
  equatorial faces north is up.) A point (u, v) in [0, 1]^2 of a face (u right, v down) is the
  direction normalize(N + a U + b V) with a = tan((2u - 1) pi/4), b = tan((2v - 1) pi/4)
  (an equi-angular cube: samples are evenly spaced in angle along the face axes, within 1.4x in
  area over the face).

TILES: level L has 2^L x 2^L tiles per face; tile (x, y) covers u in [x, x+1] / 2^L, v in
[y, y+1] / 2^L. A tile holds T + 1 = 257 x 257 vertex-registered samples (sample i at
u = (x + i/T) / 2^L, so neighbouring tiles share their edge samples) plus a one-sample apron on
every side (i = -1 and i = T + 1, taken from the neighbouring tile or face) for seamless bicubic:
images are 259 x 259, pixel (i + 1, j + 1) = sample (i, j). Metres per sample at level L
~ R * (pi/2) / (T * 2^L).

ENCODING: 16-bit greyscale PNG (lossless), height (m) = offset + step * value, with one offset and
step per body (manifest). Coarse levels are complete; deeper levels hold only the tiles that add
the most detail (greedy by RMS difference from the parent, under a byte budget per body) plus the
tiles around the landmarks; the manifest lists them as a bitmap per level. Earth levels deeper
than `seaFloorMaxLevel` store ocean (height <= 0) as -200 m, like the old terrain map; the
shallower ones keep the real sea floor.

Usage: python3 build_elevation.py [body ...]   (downloads via elevation_sources.py, resumable)
"""
from __future__ import annotations

import base64
import heapq
import json
import math
import re
import struct
import sys
import time
import zlib
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import numpy as np

from common import OUT, RAW, ROOT
from elevation_sources import DIR as SRC_DIR, FILES, etopo_name, etopo_tiles, fetch_body

T = 256                       # sample intervals per tile edge
N = T + 3                     # image size with the apron
DEST = OUT / "elevation"
WORK = RAW / "elevation" / "work"

FACES = np.array([
    [[1, 0, 0], [0, 1, 0], [0, 0, -1]],
    [[-1, 0, 0], [0, -1, 0], [0, 0, -1]],
    [[0, 1, 0], [-1, 0, 0], [0, 0, -1]],
    [[0, -1, 0], [1, 0, 0], [0, 0, -1]],
    [[0, 0, 1], [0, 1, 0], [1, 0, 0]],
    [[0, 0, -1], [0, 1, 0], [-1, 0, 0]],
], np.float64)

# body: source, engine radii (km), storage unit of the work grids (m), budget (MB), complete levels,
# deepest level, step (m), credit
BODIES = {
    "moon": dict(radii=(1737.4, 1737.4, 1737.4), unit=0.5, budget=115, full=2, max=5, step=1.0,
                 credit="NASA/GSFC/MIT LRO LOLA gridded elevation LDEM_128 (128 px/deg), PDS Geosciences Node",
                 reference="1737.4 km sphere"),
    "mars": dict(radii=(3396.19, 3396.19, 3376.2), unit=1.0, budget=105, full=2, max=6, step=1.0,
                 credit="NASA/JPL/GSFC MGS MOLA global DEM 463 m, via USGS Astrogeology",
                 reference="MOLA areoid (heights as published)"),
    "earth": dict(radii=(6378.1366, 6378.1366, 6356.7519), unit=0.5, budget=80, full=2, max=7, step=1.0,
                  credit="NOAA NCEI ETOPO 2022 15 arc-second Global Relief Model (surface), DOI 10.25921/fd45-gt74",
                  reference="EGM2008 geoid (sea level)", seaFloorMaxLevel=2, sea=0.0, oceanFill=-200.0),
    "mercury": dict(radii=(2440.53, 2440.53, 2438.26), unit=0.5, budget=25, full=2, max=5, step=1.0,
                    credit="NASA/JHUAPL/CIW MESSENGER, USGS global DEM 665 m v2, via USGS Astrogeology",
                    reference="IAU ellipsoid 2440.53 x 2438.26 km (converted from the 2439.4 km sphere)"),
    "ceres": dict(radii=(482.2, 482.1, 445.9), unit=1.0, budget=5, full=2, max=4, step=1.0,
                  credit="NASA/JPL-Caltech/UCLA/MPS/DLR/IDA Dawn FC HAMO DTM (DLR) 60 px/deg, via USGS Astrogeology",
                  reference="IAU ellipsoid 482.2 x 482.1 x 445.9 km (converted from the 470 km sphere)"),
    "vesta": dict(radii=(284.62, 277.24, 226.33), unit=1.0, budget=5, full=2, max=3, step=1.0,
                  credit="NASA/JPL-Caltech/UCLA/MPS/DLR/IDA Dawn FC HAMO DTM (DLR) 48 px/deg, via USGS Astrogeology",
                  reference="IAU ellipsoid 284.62 x 277.24 x 226.33 km (converted from radii)"),
}


# ---------------------------------------------------------------- cube geometry
def face_dirs(face: int, level: int, x: int, y: int) -> np.ndarray:
    """Unit directions (N, N, 3) of a tile's samples, apron included (row = v, column = u)."""
    i = np.arange(-1, T + 2, dtype=np.float64)
    u = (x + i / T) / (1 << level)
    v = (y + i / T) / (1 << level)
    a = np.tan((2 * u - 1) * math.pi / 4)[None, :, None]
    b = np.tan((2 * v - 1) * math.pi / 4)[:, None, None]
    n, U, V = FACES[face]
    d = n[None, None, :] + a * U[None, None, :] + b * V[None, None, :]
    return d / np.linalg.norm(d, axis=-1, keepdims=True)


def dir_to_face(d: np.ndarray) -> tuple[int, float, float]:
    ax = int(np.argmax(np.abs(d)))
    face = [0, 2, 4][ax] + (0 if d[ax] > 0 else 1)
    n, U, V = FACES[face]
    a, b = d @ U / (d @ n), d @ V / (d @ n)
    return face, (math.atan(a) * 4 / math.pi + 1) / 2, (math.atan(b) * 4 / math.pi + 1) / 2


def latlon_dir(lat: float, lon: float) -> np.ndarray:
    la, lo = math.radians(lat), math.radians(lon)
    return np.array([math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)])


def ellipsoid_radius(radii, lat: np.ndarray, lon: np.ndarray) -> np.ndarray:
    """Radius (m) of the ellipsoid along planetocentric (lat, lon) in radians."""
    a, b, c = (r * 1e3 for r in radii)
    nx, ny, nz = np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat)
    return 1.0 / np.sqrt((nx / a) ** 2 + (ny / b) ** 2 + (nz / c) ** 2)


# ---------------------------------------------------------------- work grids (equirectangular pyramids)
def work_path(body: str, k: int) -> Path:
    return WORK / f"{body}_{k}.npy"


def prepare(body: str) -> None:
    """Convert the source to int16 grids (heights above the engine reference, in `unit` m), level 0
    at full resolution and 2x2 averages down to 1024 columns. Row 0 at +90, column 0 at -180."""
    if work_path(body, 0).exists() and (WORK / f"{body}.json").exists():
        return
    fetch_body(body)
    WORK.mkdir(parents=True, exist_ok=True)
    cfg = BODIES[body]
    q = cfg["unit"]
    if body == "earth":
        W, H = 86400, 43200
        out = np.lib.format.open_memmap(work_path(body, 0), "w+", np.int16, (H, W))
        tiles = etopo_tiles()
        with ProcessPoolExecutor(4) as ex:
            for (top, left), a in zip(tiles, ex.map(_read_etopo, tiles)):
                r0, c0 = (90 - top) * 240, (left + 180) * 240
                out[r0:r0 + 3600, c0:c0 + 3600] = a
                print(f"    etopo {top} {left}", flush=True)
        out.flush()
        del out
    else:
        import rasterio
        path = SRC_DIR / FILES[body][0][1]
        if body == "moon":
            src = np.memmap(path, "<i2", "r", shape=(23040, 46080))
            H, W, lon0 = 23040, 46080, 0.0
            read = lambda r0, r1: src[r0:r1].astype(np.float64) * 0.5  # noqa: E731
        else:
            ds = rasterio.open(path)
            H, W = ds.height, ds.width
            lon0 = 0.0 if body == "ceres" else -180.0
            scale, offset, nod = ds.scales[0], ds.offsets[0], ds.nodata
            from rasterio.windows import Window

            def read(r0, r1):
                a = ds.read(1, window=Window(0, r0, W, r1 - r0)).astype(np.float64)
                bad = (a == nod) | (a < -1e30) | ~np.isfinite(a)
                a = a * scale + offset
                a[bad] = np.nan
                return a
        shift = int(round((lon0 + 180.0) / 360.0 * W))          # roll so column 0 is at -180
        out = np.lib.format.open_memmap(work_path(body, 0), "w+", np.int16, (H, W))
        lon = np.radians(-180.0 + (np.arange(W) + 0.5) * 360.0 / W)
        nbad = 0
        for r0 in range(0, H, 512):
            r1 = min(H, r0 + 512)
            a = np.roll(read(r0, r1), shift, axis=1)
            lat = np.radians(90.0 - (np.arange(r0, r1) + 0.5) * 180.0 / H)[:, None]
            if body == "mercury":
                a = a + 2439.4e3 - ellipsoid_radius(cfg["radii"], lat, lon[None, :])
            elif body == "ceres":       # values are already + 470 km (the file's offset)
                a = a - ellipsoid_radius(cfg["radii"], lat, lon[None, :])
            elif body == "vesta":       # radii
                a = a - ellipsoid_radius(cfg["radii"], lat, lon[None, :])
            bad = ~np.isfinite(a)
            nbad += int(bad.sum())
            # holes (rare): the row's mean; the coarser levels then smooth them over
            if bad.any():
                rm = np.nanmean(np.where(bad, np.nan, a), axis=1, keepdims=True)
                a = np.where(bad, np.nan_to_num(rm), a)
            out[r0:r1] = np.clip(np.round(a / q), -32767, 32767).astype(np.int16)
        print(f"  {body}: {W}x{H}, {nbad} missing samples filled", flush=True)
        out.flush()
        del out
    # pyramid
    k = 0
    a = np.load(work_path(body, 0), mmap_mode="r")
    while a.shape[1] > 1024:
        h2, w2 = a.shape[0] // 2, a.shape[1] // 2
        b = np.lib.format.open_memmap(work_path(body, k + 1), "w+", np.int16, (h2, w2))
        for r0 in range(0, h2, 1024):
            r1 = min(h2, r0 + 1024)
            blk = a[2 * r0:2 * r1].astype(np.float32)
            blk = blk.reshape(r1 - r0, 2, w2, 2).mean(axis=(1, 3))
            b[r0:r1] = np.round(blk).astype(np.int16)
        b.flush()
        del b
        k += 1
        a = np.load(work_path(body, k), mmap_mode="r")
    lo, hi = _minmax(body)
    (WORK / f"{body}.json").write_text(json.dumps({"levels": k + 1, "min": lo, "max": hi}))
    print(f"  {body}: work pyramid {k + 1} levels, {lo:.0f}..{hi:.0f} m", flush=True)


def _minmax(body: str) -> tuple[float, float]:
    a = np.load(work_path(body, 0), mmap_mode="r")
    lo, hi = 1e9, -1e9
    for r0 in range(0, a.shape[0], 2048):
        blk = a[r0:r0 + 2048]
        lo, hi = min(lo, float(blk.min())), max(hi, float(blk.max()))
    q = BODIES[body]["unit"]
    return lo * q, hi * q


def _read_etopo(tile: tuple[int, int]) -> np.ndarray:
    import rasterio
    with rasterio.open(SRC_DIR / "etopo15" / etopo_name(*tile)) as ds:
        a = ds.read(1)
    a[(a < -20000) | ~np.isfinite(a)] = 0
    return np.clip(np.round(a / 0.5), -32767, 32767).astype(np.int16)


# ---------------------------------------------------------------- sampling
def catmull(t: np.ndarray) -> list[np.ndarray]:
    return [((-t + 2) * t - 1) * t * 0.5, ((3 * t - 5) * t * t + 2) * 0.5,
            ((-3 * t + 4) * t + 1) * t * 0.5, (t - 1) * t * t * 0.5]


class Grids:
    """The work pyramid of one body, sampled bicubically (Catmull-Rom) at (lat, lon)."""

    def __init__(self, body: str):
        self.body = body
        info = json.loads((WORK / f"{body}.json").read_text())
        self.q = BODIES[body]["unit"]
        self.levels = [np.load(work_path(body, k), mmap_mode="r") for k in range(info["levels"])]
        self.min, self.max = info["min"], info["max"]
        r = BODIES[body]["radii"]
        self.R = (r[0] * r[1] * r[2]) ** (1 / 3) * 1e3

    def spacing(self, k: int) -> float:
        return 2 * math.pi * self.R / self.levels[k].shape[1]

    def sample(self, d: np.ndarray, spacing: float) -> np.ndarray:
        # the coarsest grid at least as sharp as the target spacing (prefiltered by the 2x2 averages)
        k = 0
        while k + 1 < len(self.levels) and self.spacing(k + 1) <= spacing * 1.001:
            k += 1
        g = self.levels[k]
        H, W = g.shape
        lat = np.degrees(np.arcsin(np.clip(d[..., 2], -1, 1)))
        lon = np.degrees(np.arctan2(d[..., 1], d[..., 0]))
        # unwrapped column coordinate around the tile's centre longitude
        c = d[N // 2, N // 2]
        lonc = math.degrees(math.atan2(c[1], c[0]))
        dl = (lon - lonc + 180.0) % 360.0 - 180.0
        px = ((lonc + 180.0) / 360.0 * W) + dl / 360.0 * W - 0.5
        py = (90.0 - lat) / 180.0 * H - 0.5
        x0, y0 = np.floor(px).astype(np.int64), np.floor(py).astype(np.int64)
        wx, wy = catmull(px - x0), catmull(py - y0)
        ca, cb = int(x0.min()) - 1, int(x0.max()) + 3
        ra, rb = max(0, int(y0.min()) - 1), min(H, int(y0.max()) + 3)
        cols = np.arange(ca, cb) % W
        if cb - ca >= W:
            blk = np.asarray(g[ra:rb])[:, cols]
        elif cols[0] <= cols[-1]:
            blk = np.asarray(g[ra:rb, cols[0]:cols[-1] + 1])
        else:
            blk = np.concatenate([g[ra:rb, cols[0]:], g[ra:rb, :cols[-1] + 1]], axis=1)
        blk = blk.astype(np.float32)
        h = np.zeros(px.shape, np.float64)
        for j in range(4):
            yy = np.clip(y0 - 1 + j, 0, H - 1) - ra
            row = np.zeros(px.shape, np.float64)
            for i in range(4):
                row += wx[i] * blk[yy, x0 - 1 + i - ca]
            h += wy[j] * row
        return h * self.q


# ---------------------------------------------------------------- tiles
def png16(v: np.ndarray) -> bytes:
    """16-bit greyscale PNG with the Paeth filter on every row."""
    h, w = v.shape
    b = v.astype(">u2").view(np.uint8).reshape(h, w * 2).astype(np.int16)
    a = np.zeros_like(b)
    a[:, 2:] = b[:, :-2]
    up = np.zeros_like(b)
    up[1:] = b[:-1]
    c = np.zeros_like(b)
    c[1:, 2:] = b[:-1, :-2]
    p = a + up - c
    pa, pb, pc = np.abs(p - a), np.abs(p - up), np.abs(p - c)
    pred = np.where((pa <= pb) & (pa <= pc), a, np.where(pb <= pc, up, c))
    rows = np.concatenate([np.full((h, 1), 4, np.uint8), ((b - pred) & 255).astype(np.uint8)], axis=1)

    def chunk(t: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + t + data + struct.pack(">I", zlib.crc32(t + data) & 0xFFFFFFFF)

    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 16, 0, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(rows.tobytes(), 9)) + chunk(b"IEND", b""))


_G: Grids | None = None


def _init(body: str) -> None:
    global _G
    _G = Grids(body)


def tile_heights(level: int, face: int, x: int, y: int) -> np.ndarray:
    cfg = BODIES[_G.body]
    spacing = _G.R * (math.pi / 2) / (T << level)
    h = _G.sample(face_dirs(face, level, x, y), spacing)
    if "oceanFill" in cfg and level > cfg["seaFloorMaxLevel"]:
        h = np.where(h <= cfg["sea"], cfg["oceanFill"], h)
    return h


def upsample_parent(parent: np.ndarray, x: int, y: int) -> np.ndarray:
    """The parent tile's bicubic heights at the child's sample positions."""
    i = np.arange(-1, T + 2, dtype=np.float64)
    px = (x & 1) * (T / 2) + i / 2 + 1
    py = (y & 1) * (T / 2) + i / 2 + 1
    x0, y0 = np.clip(np.floor(px).astype(int), 1, N - 3), np.clip(np.floor(py).astype(int), 1, N - 3)
    wx, wy = catmull(px - x0), catmull(py - y0)
    out = np.zeros((N, N))
    for j in range(4):
        for k in range(4):
            out += wy[j][:, None] * wx[k][None, :] * parent[np.ix_(y0 - 1 + j, x0 - 1 + k)]
    return out


def encode(h: np.ndarray, offset: float, step: float) -> bytes:
    return png16(np.clip(np.round((h - offset) / step), 0, 65535).astype(np.uint16))


def _job(args):
    level, face, x, y, parent, offset, step = args
    h = tile_heights(level, face, x, y)
    score = 0.0
    if parent is not None:
        cfg = BODIES[_G.body]
        ref = upsample_parent(parent, x, y)
        hh = h
        if "oceanFill" in cfg:      # rank by land detail only
            hh, ref = np.maximum(h, cfg["sea"]), np.maximum(ref, cfg["sea"])
        score = float(np.sqrt(np.mean((hh[1:-1, 1:-1] - ref[1:-1, 1:-1]) ** 2)))
    return (level, face, x, y), h.astype(np.float32), encode(h, offset, step), score


def landmarks(body: str) -> list[tuple[float, float]]:
    """(lat, lon) of the landmarks of src/universe/Landmarks.ts on this body."""
    text = (ROOT / "src" / "universe" / "Landmarks.ts").read_text()
    out = []
    for m in re.finditer(r"body: '(\w+)', lat: (-?[\d.]+), lon: (-?[\d.]+)", text):
        if m.group(1).lower() == body:
            out.append((float(m.group(2)), float(m.group(3))))
    return out


def forced_tiles(body: str, level: int) -> set[tuple[int, int, int, int]]:
    """Tiles within ~1 tile of each landmark at this level."""
    out = set()
    n = 1 << level
    for lat, lon in landmarks(body):
        d0 = latlon_dir(lat, lon)
        f0, u0, v0 = dir_to_face(d0)
        for du in (-0.6, 0, 0.6):
            for dv in (-0.6, 0, 0.6):
                u, v = u0 + du / n, v0 + dv / n
                n_, U, V = FACES[f0]
                d = n_ + math.tan((2 * u - 1) * math.pi / 4) * U + math.tan((2 * v - 1) * math.pi / 4) * V
                f, uu, vv = dir_to_face(d / np.linalg.norm(d))
                out.add((level, f, min(n - 1, int(uu * n)), min(n - 1, int(vv * n))))
    return out


def build(body: str) -> dict:
    prepare(body)
    cfg = BODIES[body]
    g = Grids(body)
    step = cfg["step"]
    lo = min(g.min, cfg.get("oceanFill", g.min))
    offset = math.floor(lo / step) * step - step
    assert (g.max - offset) / step < 65535, f"{body}: range too large for the step"
    out_dir = DEST / body
    if out_dir.exists():
        for p in sorted(out_dir.rglob("*.png")):
            p.unlink()
    out_dir.mkdir(parents=True, exist_ok=True)
    budget = cfg["budget"] * 1e6
    chosen: dict[tuple, np.ndarray] = {}
    used = 0
    t0 = time.time()

    def save(key, png):
        nonlocal used
        level, face, x, y = key
        p = out_dir / str(level) / f"{face}-{x}-{y}.png"
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(png)
        used += len(png)

    with ProcessPoolExecutor(4, initializer=_init, initargs=(body,)) as ex:
        # complete levels
        for level in range(cfg["full"] + 1):
            n = 1 << level
            jobs = [(level, f, x, y, None, offset, step) for f in range(6) for y in range(n) for x in range(n)]
            for key, h, png, _ in ex.map(_job, jobs, chunksize=4):
                chosen[key] = h
                save(key, png)
            print(f"  {body} L{level}: {len(jobs)} tiles, total {used / 1e6:.1f} MB ({time.time() - t0:.0f} s)", flush=True)
        # deeper levels: greedy by detail added, landmarks first
        forced = set()
        for level in range(cfg["full"] + 1, cfg["max"] + 1):
            forced |= forced_tiles(body, level)
        heap: list = []

        def children(keys):
            jobs = []
            for (level, f, x, y) in keys:
                if level >= cfg["max"]:
                    continue
                for cy in (2 * y, 2 * y + 1):
                    for cx in (2 * x, 2 * x + 1):
                        jobs.append((level + 1, f, cx, cy, chosen[(level, f, x, y)], offset, step))
            for key, h, png, score in ex.map(_job, jobs, chunksize=2):
                pri = -1e12 if key in forced else -score
                heapq.heappush(heap, (pri, key, h, png))

        children([k for k in chosen if k[0] == cfg["full"]])
        while heap:
            batch = []
            while heap and len(batch) < 32:
                pri, key, h, png = heapq.heappop(heap)
                if pri > -1e12 and used + len(png) > budget:
                    continue
                chosen[key] = h
                save(key, png)
                batch.append(key)
            if not batch:
                break
            children(batch)
            if len(chosen) % 256 < 32:
                print(f"  {body}: {len(chosen)} tiles, {used / 1e6:.1f} MB, heap {len(heap)}, "
                      f"last score {-pri:.1f} m, level {key[0]} ({time.time() - t0:.0f} s)", flush=True)
    # manifest
    levels = []
    for level in range(cfg["max"] + 1):
        n = 1 << level
        keys = [k for k in chosen if k[0] == level]
        entry = {"level": level, "tiles": len(keys),
                 "metresPerSample": round(g.R * (math.pi / 2) / (T << level), 2)}
        if len(keys) < 6 * n * n:
            bits = np.zeros(6 * n * n, np.uint8)
            for (_, f, x, y) in keys:
                bits[(f * n + y) * n + x] = 1
            entry["bitmap"] = base64.b64encode(np.packbits(bits, bitorder="little").tobytes()).decode()
        if keys:
            levels.append(entry)
    man = {
        "body": body, "tileSize": T, "border": 1, "format": "png16",
        "path": "{level}/{face}-{x}-{y}.png",
        "faces": "equi-angular cube; face 0..5 = +X,-X,+Y,-Y,+Z,-Z; (u right, v down) -> "
                 "normalize(N + tan((2u-1)pi/4) U + tan((2v-1)pi/4) V); U,V per face: "
                 "+X:(+Y,-Z) -X:(-Y,-Z) +Y:(-X,-Z) -Y:(+X,-Z) +Z:(+Y,+X) -Z:(+Y,-X)",
        "offset": offset, "step": step, "unit": "m",
        "referenceRadius": round(g.R, 1), "radii": [r * 1e3 for r in cfg["radii"]],
        "reference": cfg["reference"],
        "min": round(g.min, 1), "max": round(g.max, 1),
        "levels": levels, "bytes": used, "credit": cfg["credit"],
        "license": "Public domain (U.S. Government work / NASA mission data)",
    }
    if "sea" in cfg:
        man |= {"sea": cfg["sea"], "seaFloorMaxLevel": cfg["seaFloorMaxLevel"], "oceanFill": cfg["oceanFill"]}
    (out_dir / "manifest.json").write_text(json.dumps(man, indent=1))
    print(f"  {body}: {len(chosen)} tiles, {used / 1e6:.1f} MB, levels "
          + ", ".join(f"L{e['level']}:{e['tiles']}" for e in levels), flush=True)
    return man


def write_fixture(body: str, man: dict, count: int = 24) -> None:
    """Reference heights for tests/elevation.test.ts: the source model sampled (bicubic, at the
    level's spacing) at tile sample positions (exact up to quantisation) and between them."""
    g = Grids(body)
    rng = np.random.default_rng(len(body))
    path = ROOT / "tests" / "fixtures" / "elevation_points.json"
    pts = json.loads(path.read_text()) if path.exists() else {}
    out = []
    _init(body)
    levels = man["levels"]
    while len(out) < count:
        e = levels[int(rng.integers(len(levels)))]
        level, n = e["level"], 1 << e["level"]
        f, x, y = int(rng.integers(6)), int(rng.integers(n)), int(rng.integers(n))
        if "bitmap" in e:
            bits = np.unpackbits(np.frombuffer(base64.b64decode(e["bitmap"]), np.uint8), bitorder="little")
            if not bits[(f * n + y) * n + x]:
                continue
        between = len(out) % 2 == 1
        i, j = (rng.uniform(1, T - 1, 2) if between else rng.integers(0, T + 1, 2).astype(float))
        u, v = (x + i / T) / n, (y + j / T) / n
        n_, U, V = FACES[f]
        d = n_ + math.tan((2 * u - 1) * math.pi / 4) * U + math.tan((2 * v - 1) * math.pi / 4) * V
        d /= np.linalg.norm(d)
        h = float(tile_heights(level, f, x, y)[int(j) + 1, int(i) + 1]) if not between else float(
            _G.sample(np.tile(d, (N, N, 1)), g.R * (math.pi / 2) / (T << level))[0, 0])
        if "oceanFill" in BODIES[body] and level > BODIES[body]["seaFloorMaxLevel"] and h <= 0:
            h = BODIES[body]["oceanFill"]
        out.append({"level": level, "dir": [float(c) for c in d], "h": round(h, 2), "exact": not between})
    pts[body] = out
    path.write_text(json.dumps(pts, indent=1))


def write_index() -> None:
    bodies = {}
    for d in sorted(DEST.iterdir()):
        m = d / "manifest.json"
        if m.exists():
            j = json.loads(m.read_text())
            bodies[d.name] = {"maxLevel": j["levels"][-1]["level"], "bytes": j["bytes"], "credit": j["credit"]}
    (DEST / "index.json").write_text(json.dumps({"tileSize": T, "bodies": bodies}, indent=1))


def main() -> None:
    names = sys.argv[1:] or list(BODIES)
    for b in names:
        write_fixture(b, build(b))
    write_index()


if __name__ == "__main__":
    main()
