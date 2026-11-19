"""High-resolution planet maps, relief (normal) maps from elevation models,
an Earth water mask, Hubble OPAL maps of the giant planets and true colours of
the giant planets from measured albedo spectra.

Run after fetch_textures.py: it extends public/data/textures/manifest.json.

Sources (all downloaded here; see CREDITS.md):
  Earth  NASA Blue Marble NG 21600x10800 (Oct 2004)          public domain
         NOAA NCEI ETOPO 2022 60" surface elevation          public domain (DOI 10.25921/fd45-gt74)
  Moon   NASA SVS CGI Moon Kit: LROC WAC colour 8k, LOLA LDEM 16 ppd  public domain
  Mars   USGS Viking MDIM 2.1 colour mosaic, MGS MOLA DEM 463 m      public domain
  Mercury USGS MESSENGER MDIS BDR mosaic 166 m, USGS DEM 665 m       public domain
  Jupiter NASA/JPL/SSI Cassini map PIA07782 (full 3601x1801)         public domain
  Saturn, Uranus, Neptune  Hubble OPAL global maps 2025 (STScI MAST HLSP, DOI 10.17909/T9G593)  CC BY 4.0
  Colours of Jupiter, Saturn, Uranus, Neptune, Titan: E. Karkoschka (1998, Icarus 133, 134),
         ESO full-disk albedo spectra 300-1050 nm, NASA PDS Atmospheres node volume GBAT_0001.

The USGS mosaics are 2-13 GB uncompressed strip TIFFs; `StripTiff` reads only
the rows it needs with HTTP range requests.
"""
from __future__ import annotations

import json
import struct
import threading
from concurrent.futures import ThreadPoolExecutor

import numpy as np
import rasterio
import requests
from astropy.io import fits
from PIL import Image

from common import OUT, RAW, UA, download, write_json

Image.MAX_IMAGE_PIXELS = None
TEX = OUT / "textures"
HI = RAW / "hires"
EO = "https://eoimages.gsfc.nasa.gov/images/imagerecords/"
SVS = "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/"
USGS = "https://planetarymaps.usgs.gov/mosaic/"
OPAL = "https://archive.stsci.edu/missions/hlsp/opal/"
ETOPO = ("https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO2022/data/60s/60s_surface_elev_gtif/"
         "ETOPO_2022_v1_60s_N90W180_surface.tif")
GBAT = "https://pds-atmospheres.nmsu.edu/PDS/data/gbat_0001/data/"

# Relief exaggeration applied to slopes when building normal maps (1 = true slopes at map resolution).
# Planet-scale maps average slopes over kilometres, so true relief is barely visible; these
# factors make terrain read at the terminator. Artistic, stated in the manifest and CREDITS.
RELIEF_K = {"earth": 4.0, "moon": 2.0, "mars": 2.0, "mercury": 2.0}

_local = threading.local()


def _session() -> requests.Session:
    s = getattr(_local, "s", None)
    if s is None:
        s = requests.Session()
        s.headers.update(UA)
        _local.s = s
    return s


def range_get(url: str, start: int, end: int, retries: int = 5) -> bytes:
    for attempt in range(retries):
        try:
            r = _session().get(url, headers={"Range": f"bytes={start}-{end}"}, timeout=120)
            r.raise_for_status()
            if r.status_code != 206 and start > 0:
                raise RuntimeError("server ignored Range")
            return r.content
        except Exception:  # noqa: BLE001
            if attempt == retries - 1:
                raise
    raise RuntimeError("unreachable")


class StripTiff:
    """Minimal reader for uncompressed, one-row-per-strip (Big)TIFFs over HTTP."""

    def __init__(self, url: str):
        self.url = url
        head = range_get(url, 0, 65535)
        self.bo = bo = "<" if head[:2] == b"II" else ">"
        magic = struct.unpack(bo + "H", head[2:4])[0]
        big = magic == 43
        off = struct.unpack(bo + ("Q" if big else "I"), head[8:16] if big else head[4:8])[0]
        ifd = range_get(url, off, off + 8 + 20 * 64)
        n = struct.unpack(bo + ("Q" if big else "H"), ifd[:8] if big else ifd[:2])[0]
        p, esz = (8, 20) if big else (2, 12)
        tags = {}
        sizes = {1: 1, 2: 1, 3: 2, 4: 4, 16: 8, 11: 4, 12: 8}
        fmt = {1: "B", 3: "H", 4: "I", 16: "Q"}
        for i in range(n):
            e = ifd[p + i * esz: p + (i + 1) * esz]
            tag, typ = struct.unpack(bo + "HH", e[:4])
            cnt = struct.unpack(bo + ("Q" if big else "I"), e[4:12] if big else e[4:8])[0]
            val = e[12:20] if big else e[8:12]
            nbytes = sizes.get(typ, 1) * cnt
            if nbytes <= len(val):
                raw = val[:nbytes]
            else:
                ptr = struct.unpack(bo + ("Q" if big else "I"), val)[0]
                raw = range_get(url, ptr, ptr + nbytes - 1)
            if typ in fmt:
                tags[tag] = struct.unpack(bo + fmt[typ] * cnt, raw)
        self.width, self.height = tags[256][0], tags[257][0]
        self.bits = tags[258][0]
        self.bands = tags.get(277, (1,))[0]
        self.planar = tags.get(284, (1,))[0]
        self.rows_per_strip = tags.get(278, (self.height,))[0]
        self.compression = tags.get(259, (1,))[0]
        self.sample_format = tags.get(339, (1,))[0]
        self.offsets = tags[273]
        assert self.compression == 1, "needs uncompressed strips"
        dt = {(8, 1): "u1", (16, 1): "u2", (16, 2): "i2", (32, 3): "f4"}[(self.bits, self.sample_format)]
        self.dtype = np.dtype(bo + dt)
        print(f"  {url.rsplit('/', 1)[-1]}: {self.width}x{self.height}x{self.bands} {self.dtype} planar={self.planar}")

    def row(self, r: int, band: int = 0) -> np.ndarray:
        rps = self.rows_per_strip
        strips_per_band = (self.height + rps - 1) // rps
        if self.planar == 2:
            off = self.offsets[band * strips_per_band + r // rps] + (r % rps) * self.width * self.dtype.itemsize
            data = range_get(self.url, off, off + self.width * self.dtype.itemsize - 1)
            return np.frombuffer(data, self.dtype).astype(np.float32)
        off = self.offsets[r // rps] + (r % rps) * self.width * self.bands * self.dtype.itemsize
        data = range_get(self.url, off, off + self.width * self.bands * self.dtype.itemsize - 1)
        return np.frombuffer(data, self.dtype).astype(np.float32).reshape(self.width, self.bands)[:, band]

    def decimated(self, out_w: int, out_h: int, bands=(0,), rows_per_out: int = 1, nodata=None) -> np.ndarray:
        """Area-average columns, point/2-point sample rows. Returns float32 (out_h, out_w, len(bands))."""
        out = np.zeros((out_h, out_w, len(bands)), np.float32)
        step = self.height / out_h
        jobs = []
        for j in range(out_h):
            for k in range(rows_per_out):
                src = int((j + (k + 0.5) / rows_per_out) * step)
                for bi, b in enumerate(bands):
                    jobs.append((j, bi, b, min(src, self.height - 1)))
        acc = np.zeros((out_h, out_w, len(bands)), np.float32)
        cnt = np.zeros((out_h, out_w, len(bands)), np.float32)

        def work(job):
            j, bi, b, src = job
            v = self.row(src, b)
            valid = np.ones_like(v) if nodata is None else (v != nodata).astype(np.float32)
            return j, bi, area_resample(v * valid, out_w), area_resample(valid, out_w)

        done = 0
        with ThreadPoolExecutor(24) as ex:
            for j, bi, s, c in ex.map(work, jobs):
                acc[j, :, bi] += s
                cnt[j, :, bi] += c
                done += 1
                if done % 2000 == 0:
                    print(f"    {done}/{len(jobs)} rows")
        out = np.where(cnt > 0, acc / np.maximum(cnt, 1e-6), np.nan)
        return out


def area_resample(v: np.ndarray, n: int) -> np.ndarray:
    cs = np.concatenate([[0.0], np.cumsum(v, dtype=np.float64)])
    edges = np.linspace(0, len(v), n + 1)
    c = np.interp(edges, np.arange(len(v) + 1), cs)
    return ((c[1:] - c[:-1]) / (edges[1:] - edges[:-1])).astype(np.float32)


def fill_nan_zonal(a: np.ndarray) -> np.ndarray:
    """Fill NaN with the row (zonal) mean, then rows that are empty from the nearest valid row."""
    a = a.copy()
    H = a.shape[0]
    means = np.nanmean(a, axis=1)  # (H, C)
    valid_rows = ~np.isnan(means).any(axis=-1) if means.ndim > 1 else ~np.isnan(means)
    idx = np.where(valid_rows)[0]
    for y in range(H):
        src = y if valid_rows[y] else idx[np.argmin(np.abs(idx - y))]
        m = means[src]
        row = a[y]
        mask = np.isnan(row)
        if mask.any():
            row[mask] = np.broadcast_to(m, row.shape)[mask]
    return a


def srgb(lin: np.ndarray) -> np.ndarray:
    lin = np.clip(lin, 0, 1)
    return np.where(lin <= 0.0031308, lin * 12.92, 1.055 * np.power(lin, 1 / 2.4) - 0.055)


def lin(s: np.ndarray) -> np.ndarray:
    return np.where(s <= 0.04045, s / 12.92, ((s + 0.055) / 1.055) ** 2.4)


def save_jpg(arr_u8: np.ndarray, name: str, q: int = 90) -> None:
    mode = "L" if arr_u8.ndim == 2 else "RGB"
    Image.fromarray(arr_u8, mode).save(TEX / name, quality=q, subsampling=0, optimize=True)
    print(f"  wrote textures/{name} {arr_u8.shape[1]}x{arr_u8.shape[0]} ({(TEX / name).stat().st_size / 1e6:.1f} MB)")


def resize(img: Image.Image, w: int, h: int) -> Image.Image:
    return img.resize((w, h), Image.Resampling.LANCZOS)


def relief_map(h: np.ndarray, radius_m: float, k: float, water: np.ndarray | None = None) -> np.ndarray:
    """Equirectangular heights (m) -> tangent-space normal (R=east, G=north) [+ B=water mask]."""
    H, W = h.shape
    lat = (0.5 - (np.arange(H) + 0.5) / H) * np.pi
    dlon, dlat = 2 * np.pi / W, np.pi / H
    dhdx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) / (2 * dlon * radius_m * np.maximum(np.cos(lat), 0.02)[:, None])
    hp = np.vstack([h[:1], h, h[-1:]])
    dhdy = (hp[:-2] - hp[2:]) / (2 * dlat * radius_m)
    nx, ny = -k * dhdx, -k * dhdy
    norm = np.sqrt(nx * nx + ny * ny + 1)
    out = np.zeros((H, W, 3), np.uint8)
    out[..., 0] = np.clip((0.5 + 0.5 * nx / norm) * 255 + 0.5, 0, 255)
    out[..., 1] = np.clip((0.5 + 0.5 * ny / norm) * 255 + 0.5, 0, 255)
    out[..., 2] = 0 if water is None else (water * 255).astype(np.uint8)
    slope = np.degrees(np.arctan(np.hypot(dhdx, dhdy)))
    print(f"    slopes at map scale: median {np.median(slope):.2f} deg, p99 {np.percentile(slope, 99):.1f} deg (x{k} in the map)")
    return out


# ---------------------------------------------------------------------------- bodies
def earth(man: dict) -> None:
    src = download(EO + "74000/74167/world.200410.3x21600x10800.jpg", HI / "bmng_200410_21600.jpg", min_size=10_000_000)
    img = Image.open(src).convert("RGB")
    save_jpg(np.asarray(resize(img, 8192, 4096)), "earth_day_8k.jpg", 90)
    man["maps"]["earth_day"]["hi"] = {"file": "earth_day_8k.jpg", "width": 8192, "height": 4096,
                                      "source": EO + "74000/74167/world.200410.3x21600x10800.jpg"}
    et = download(ETOPO, HI / "etopo2022_60s_surface.tif", min_size=100_000_000)
    with rasterio.open(et) as ds:
        h = ds.read(1, out_shape=(2048, 4096), resampling=rasterio.enums.Resampling.average).astype(np.float32)
    h[h < -20000] = 0
    water = (h <= 0).astype(np.float32)
    print("  Earth relief + water mask (ETOPO 2022):")
    save_jpg(relief_map(np.maximum(h, 0), 6371008.8, RELIEF_K["earth"], water), "earth_relief_4k.jpg", 92)
    man["maps"]["earth_relief"] = {
        "file": "earth_relief_4k.jpg", "width": 4096, "height": 2048, "channels": "relief+water", "lonLeft": -180,
        "exaggeration": RELIEF_K["earth"],
        "credit": "NOAA NCEI, ETOPO 2022 60 arc-second Global Relief Model (surface), DOI 10.25921/fd45-gt74",
        "source": ETOPO, "license": "Public domain (U.S. Government work)"}


def moon(man: dict) -> None:
    c = download(SVS + "lroc_color_poles_8k.tif", HI / "lroc_color_poles_8k.tif", min_size=10_000_000)
    with rasterio.open(c) as ds:
        rgb = np.moveaxis(ds.read(), 0, -1)
    save_jpg(rgb, "moon_8k.jpg", 90)
    man["maps"]["moon"]["hi"] = {"file": "moon_8k.jpg", "width": 8192, "height": 4096, "source": SVS + "lroc_color_poles_8k.tif"}
    d = download(SVS + "ldem_16_uint.tif", HI / "ldem_16_uint.tif", min_size=10_000_000)
    with rasterio.open(d) as ds:
        h = ds.read(1, out_shape=(2048, 4096), resampling=rasterio.enums.Resampling.average).astype(np.float32)
    h = (h - 20000.0) * 0.5  # half-metres, offset +20000, relative to 1737.4 km (SVS 4720)
    print("  Moon relief (LOLA LDEM 16 ppd):")
    save_jpg(relief_map(h, 1737400.0, RELIEF_K["moon"]), "moon_relief_4k.jpg", 92)
    man["maps"]["moon_relief"] = {
        "file": "moon_relief_4k.jpg", "width": 4096, "height": 2048, "channels": "relief", "lonLeft": -180,
        "exaggeration": RELIEF_K["moon"],
        "credit": "NASA SVS CGI Moon Kit, LRO LOLA gridded elevation (LDEM 16 ppd)",
        "source": SVS + "ldem_16_uint.tif", "license": "Public domain (U.S. Government work)"}


def mars(man: dict) -> None:
    url = USGS + "Mars_Viking_MDIM21_ClrMosaic_global_232m.tif"
    t = StripTiff(url)
    rgb = t.decimated(8192, 4096, bands=(0, 1, 2), nodata=0)
    rgb = fill_nan_zonal(rgb)
    u8 = np.clip(rgb + 0.5, 0, 255).astype(np.uint8)
    save_jpg(u8, "mars_8k.jpg", 90)
    save_jpg(np.asarray(resize(Image.fromarray(u8), 2048, 1024)), "mars.jpg", 92)
    man["maps"]["mars"].update({"file": "mars.jpg", "width": 2048, "height": 1024, "source": url,
                                "credit": "NASA/JPL/USGS, Viking MDIM 2.1 global colour mosaic (232 m), via USGS Astrogeology",
                                "hi": {"file": "mars_8k.jpg", "width": 8192, "height": 4096, "source": url}})
    dem = StripTiff(USGS + "Mars_MGS_MOLA_DEM_mosaic_global_463m.tif")
    h = fill_nan_zonal(dem.decimated(4096, 2048, rows_per_out=2, nodata=-32768)[..., :1])[..., 0]
    print("  Mars relief (MGS MOLA 463 m):")
    save_jpg(relief_map(h, 3396190.0, RELIEF_K["mars"]), "mars_relief_4k.jpg", 92)
    man["maps"]["mars_relief"] = {
        "file": "mars_relief_4k.jpg", "width": 4096, "height": 2048, "channels": "relief", "lonLeft": -180,
        "exaggeration": RELIEF_K["mars"], "credit": "NASA/JPL/GSFC MGS MOLA, global DEM 463 m, via USGS Astrogeology",
        "source": USGS + "Mars_MGS_MOLA_DEM_mosaic_global_463m.tif", "license": "Public domain (U.S. Government work)"}


def mercury(man: dict) -> None:
    url = USGS + "Mercury_MESSENGER_MDIS_Basemap_BDR_Mosaic_Global_166m.tif"
    t = StripTiff(url)
    g = fill_nan_zonal(t.decimated(8192, 4096, bands=(0,), nodata=0))[..., 0]
    u8 = np.clip(g + 0.5, 0, 255).astype(np.uint8)
    save_jpg(u8, "mercury_8k.jpg", 90)
    save_jpg(np.asarray(resize(Image.fromarray(u8), 2048, 1024)), "mercury.jpg", 92)
    man["maps"]["mercury"].update({"file": "mercury.jpg", "width": 2048, "height": 1024, "source": url,
                                   "credit": "NASA/JHUAPL/CIW, MESSENGER MDIS BDR global mosaic (166 m), via USGS Astrogeology",
                                   "hi": {"file": "mercury_8k.jpg", "width": 8192, "height": 4096, "source": url}})
    dem = StripTiff(USGS + "Mercury_Messenger_USGS_DEM_Global_665m_v2.tif")
    h = fill_nan_zonal(dem.decimated(4096, 2048, rows_per_out=2, nodata=-32768)[..., :1])[..., 0]
    print("  Mercury relief (MESSENGER USGS DEM 665 m):")
    save_jpg(relief_map(h, 2439400.0, RELIEF_K["mercury"]), "mercury_relief_4k.jpg", 92)
    man["maps"]["mercury_relief"] = {
        "file": "mercury_relief_4k.jpg", "width": 4096, "height": 2048, "channels": "relief", "lonLeft": -180,
        "exaggeration": RELIEF_K["mercury"], "credit": "NASA/JHUAPL/CIW MESSENGER, USGS global DEM 665 m v2",
        "source": USGS + "Mercury_Messenger_USGS_DEM_Global_665m_v2.tif", "license": "Public domain (U.S. Government work)"}


def jupiter(man: dict) -> None:
    url = "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia07/pia07782/PIA07782.jpg"
    src = download(url, HI / "PIA07782.jpg")
    img = Image.open(src).convert("RGB")
    save_jpg(np.asarray(resize(img, 4096, 2048)), "jupiter.jpg", 92)
    man["maps"]["jupiter"].update({"file": "jupiter.jpg", "width": 4096, "height": 2048})


# ---------------------------------------------------------------------------- giant-planet colours
def cie(l):
    def g(x, mu, s1, s2):
        t = (x - mu) * np.where(x < mu, s1, s2)
        return np.exp(-0.5 * t * t)
    X = 0.362 * g(l, 442.0, 0.0624, 0.0374) + 1.056 * g(l, 599.8, 0.0264, 0.0323) - 0.065 * g(l, 501.1, 0.049, 0.0382)
    Y = 0.821 * g(l, 568.8, 0.0213, 0.0247) + 0.286 * g(l, 530.9, 0.0613, 0.0322)
    Z = 1.217 * g(l, 437.0, 0.0845, 0.0278) + 0.681 * g(l, 459.0, 0.0385, 0.0725)
    return X, Y, Z


def xyz_to_rgb(X, Y, Z):
    return np.array([3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z,
                     -0.9692660 * X + 1.8760108 * Y + 0.0415560 * Z,
                     0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z])


def spectral_colours() -> dict:
    """Reflectance colour (linear sRGB, relative to sunlight) from Karkoschka's albedo spectra."""
    lbl = download(GBAT + "1995low.lbl", RAW / "gbat" / "1995low.lbl")
    tab = download(GBAT + "1995low.tab", RAW / "gbat" / "1995low.tab")
    del lbl
    d = np.loadtxt(tab)
    lam = d[:, 0]  # vacuum wavelength, nm
    keep = (lam >= 380) & (lam <= 780)
    lam = lam[keep]
    h, c, k = 6.62607015e-34, 2.99792458e8, 1.380649e-23
    lm = lam * 1e-9
    sun = 1 / (lm ** 5 * (np.exp(h * c / (lm * k * 5772.0)) - 1))  # same 5772 K Sun as the engine
    X, Y, Z = cie(lam)
    ref = xyz_to_rgb((sun * X).sum(), (sun * Y).sum(), (sun * Z).sum())
    out = {}
    for name, col in [("jupiter", 3), ("saturn", 4), ("uranus", 5), ("neptune", 6), ("titan", 7)]:
        A = d[keep, col]
        rgb = xyz_to_rgb((A * sun * X).sum(), (A * sun * Y).sum(), (A * sun * Z).sum()) / ref
        visual = float((A * sun * Y).sum() / (sun * Y).sum())
        out[name] = {"linearRGB": [round(float(v), 4) for v in rgb], "visualAlbedo": round(visual, 4)}
        print(f"  {name}: reflectance RGB {out[name]['linearRGB']} (photopic albedo {visual:.3f})")
    return out


OPAL_SETS = {
    # body: (cycle, rotation, (red, green, blue) filters)
    "saturn": ("cycle32", "saturn-2025a", ("f631n", "f502n", "f395n")),
    "uranus": ("cycle33", "uranus-2025a", ("f657n", "f547m", "f467m")),
    "neptune": ("cycle32", "neptune-2025b", ("f657n", "f547m", "f467m")),
}


OPAL_RADII = {"saturn": (60268.0, 54364.0), "uranus": (25559.0, 24973.0), "neptune": (24764.0, 24341.0)}


def opal_clean(rgb: np.ndarray) -> np.ndarray:
    """Mask unobserved / limb-corrupted pixels: outliers per filter, colour ratios far from the
    planet's typical ratio (misregistered limb), and rows with less than 85 % good coverage."""
    rgb = rgb.copy()
    med = np.nanmedian(rgb.reshape(-1, 3), axis=0)
    ok = np.all((rgb > 0.3 * med) & (rgb < 2.5 * med), axis=-1)
    with np.errstate(invalid="ignore", divide="ignore"):
        r1, r2 = np.log(rgb[..., 0] / rgb[..., 1]), np.log(rgb[..., 2] / rgb[..., 1])
    m1, m2 = np.nanmedian(r1[ok]), np.nanmedian(r2[ok])
    ok &= (np.abs(r1 - m1) < 0.25) & (np.abs(r2 - m2) < 0.25)
    rows = ok.mean(axis=1) >= 0.85
    ok &= rows[:, None]
    print(f"    valid pixels {ok.mean() * 100:.0f} %, observed latitude rows {rows.mean() * 100:.0f} %")
    rgb[~ok] = np.nan
    return rgb


def planetographic_to_parametric(a: np.ndarray, req: float, rpol: float) -> np.ndarray:
    """Resample rows from planetographic latitude to the parametric latitude of the engine's
    ellipsoid mesh (tan(graphic) = (a/b) tan(parametric))."""
    H = a.shape[0]
    beta = (0.5 - (np.arange(H) + 0.5) / H) * np.pi
    graphic = np.arctan((req / rpol) * np.tan(beta))
    src = np.clip((0.5 - graphic / np.pi) * H - 0.5, 0, H - 1)
    lo = np.floor(src).astype(int)
    hi = np.minimum(lo + 1, H - 1)
    t = (src - lo)[:, None, None]
    return a[lo] * (1 - t) + a[hi] * t


def opal(man: dict, colours: dict) -> None:
    """Hubble OPAL global maps: per-filter structure, white-balanced to the spectral colour."""
    for body, (cycle, rot, filters) in OPAL_SETS.items():
        chans = []
        for f in filters:
            name = f"hlsp_opal_hst_wfc3-uvis_{rot}_{f}_v1_globalmap.fits"
            url = f"{OPAL}{cycle}/{body}/{name}"
            p = download(url, RAW / "opal" / name, min_size=100_000)
            with fits.open(p) as hd:
                a = next(h.data for h in hd if h.data is not None).astype(np.float32)
            a[a <= 0] = np.nan
            chans.append(a)
        rgb = opal_clean(np.stack(chans, -1))
        rgb = fill_nan_zonal(rgb)
        rgb = planetographic_to_parametric(rgb, *OPAL_RADII[body])
        # Spatial variations relative to each filter's (area-weighted) mean, times the measured colour.
        H = rgb.shape[0]
        w = np.cos((0.5 - (np.arange(H) + 0.5) / H) * np.pi)[:, None, None]
        mean = (rgb * w).sum((0, 1)) / (w.sum() * rgb.shape[1])
        target = np.array(colours[body]["linearRGB"])
        lin_rgb = rgb / mean * target
        lin_rgb /= lin_rgb.max() * 1.02
        img = Image.fromarray((srgb(lin_rgb) * 255 + 0.5).astype(np.uint8), "RGB")
        save_jpg(np.asarray(resize(img, 2048, 1024)), f"{body}.jpg", 92)
        man["maps"][body] = {
            "file": f"{body}.jpg", "width": 2048, "height": 1024, "channels": "RGB",
            # left edge = 360 deg System III W longitude, decreasing to the right = east longitude 0 increasing
            "lonLeft": 0, "latitude": "planetographic",
            "credit": f"NASA/ESA Hubble OPAL program (PI A. Simon), {rot} {'/'.join(filters).upper()} maps "
                      f"(STScI MAST HLSP, DOI 10.17909/T9G593); colour from Karkoschka (1998) albedo spectra",
            "source": f"{OPAL}{cycle}/{body}/", "license": "CC BY 4.0"}


def fill_unimaged(man: dict) -> None:
    """Pluto and Charon: New Horizons never saw the southern hemispheres (black in the mosaics).
    Fill them with the mean colour of the imaged surface, feathered at the boundary."""
    from PIL import ImageFilter
    for key in ("pluto", "charon"):
        info = man["maps"].get(key)
        if not info:
            continue
        img = Image.open(TEX / info["file"]).convert("RGB")
        a = np.asarray(img).astype(np.float32) / 255.0
        valid = a.max(axis=-1) > 3 / 255
        if valid.all():
            continue
        mean = lin(a[valid]).mean(axis=0)
        soft = np.asarray(Image.fromarray((valid * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255.0
        out = lin(a) * soft[..., None] + mean * (1 - soft[..., None])
        out = np.where(valid[..., None] & (soft[..., None] > 0.98), lin(a), out)
        Image.fromarray((srgb(out) * 255 + 0.5).astype(np.uint8)).save(TEX / info["file"], quality=92)
        info["note"] = "unimaged areas filled with the mean colour of the imaged surface"
        print(f"  {key}: filled {(~valid).mean() * 100:.0f} % unimaged area with the mean colour")


def main() -> None:
    man_path = TEX / "manifest.json"
    man = json.loads(man_path.read_text())
    print("Giant-planet colours (Karkoschka 1998, PDS GBAT_0001):")
    colours = spectral_colours()
    man["spectralColors"] = {k: {**v, "credit": "E. Karkoschka (1998), Icarus 133, 134; ESO 1995 full-disk albedo spectra, "
                                                "NASA PDS Atmospheres GBAT_0001 (1995LOW.TAB)", "source": GBAT + "1995low.tab"}
                             for k, v in colours.items()}
    import sys
    only = set(sys.argv[1:])
    for step in (opal, earth, moon, jupiter, mars, mercury, fill_unimaged):
        if only and step.__name__ not in only:
            continue
        print(f"[{step.__name__}]")
        if step is opal:
            step(man, colours)
        else:
            step(man)
        write_json(man_path, man, compact=False)
    print("done")


if __name__ == "__main__":
    main()
