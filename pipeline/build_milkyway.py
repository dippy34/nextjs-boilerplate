"""Milky Way background from NASA SVS "Deep Star Maps 2020" (ID 4851).

The `milkyway_2020` layer is the star map of 1.7 billion stars (Hipparcos-2,
Tycho-2, Gaia DR2) with the bright Hipparcos/Tycho stars left out, i.e. the
unresolved Milky Way behind the stars the engine draws itself from AT-HYG.
It is a plate carree map in ICRF/J2000 equatorial coordinates, centred on
RA 0h with RA increasing to the left -- the engine's world frame, so no
rotation is needed.

The EXR is display-referred: values are clipped at 1.0 and, measured against
AT-HYG V magnitudes on the companion `hiptyc_2020` layer, pixel sums grow
roughly as flux^1.5 rather than linearly (see `measure_response`). The map is
therefore used for the structure and colour of the Milky Way; its overall
brightness is an artistic gain in the engine, documented there.

Output: public/data/sky/milkyway_4k.jpg (sRGB-encoded) + manifest.json.
NASA SVS content is public domain; credit NASA/GSFC SVS, Gaia DR2: ESA/Gaia/DPAC.
"""
from __future__ import annotations

import csv
import gzip

import numpy as np
import OpenEXR
from PIL import Image

from common import OUT, RAW, download, write_json

SVS = "https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/"
SKY = OUT / "sky"


def read_exr(path) -> np.ndarray:
    return OpenEXR.File(str(path)).channels()["RGB"].pixels.astype(np.float32)


def srgb_encode(lin: np.ndarray) -> np.ndarray:
    lin = np.clip(lin, 0.0, 1.0)
    return np.where(lin <= 0.0031308, lin * 12.92, 1.055 * np.power(lin, 1 / 2.4) - 0.055)


def measure_response(hiptyc: np.ndarray) -> float:
    """Log-log slope of (pixel sum around a star) vs (catalogue flux) for isolated
    AT-HYG stars, V 6-8.5. 1.0 would mean the map is linear in flux."""
    athyg = RAW / "athyg_40.csv.gz"
    if not athyg.exists():
        return float("nan")
    H, W, _ = hiptyc.shape
    L = 0.2126 * hiptyc[..., 0] + 0.7152 * hiptyc[..., 1] + 0.0722 * hiptyc[..., 2]
    ra, dec, mag = [], [], []
    with gzip.open(athyg, "rt") as f:
        r = csv.reader(f)
        hdr = next(r)
        iR, iD, iM = hdr.index("ra"), hdr.index("dec"), hdr.index("mag")
        for row in r:
            try:
                m = float(row[iM])
            except ValueError:
                continue
            if m <= 12.5:
                ra.append(float(row[iR])); dec.append(float(row[iD])); mag.append(m)
    ra, dec, mag = np.array(ra), np.array(dec), np.array(mag)
    xi = (((0.5 - ra / 24.0) * W) % W).astype(int)
    yi = np.clip(((0.5 - dec / 180.0) * H).astype(int), 0, H - 1)
    flux = np.zeros((H, W), np.float32)
    np.add.at(flux, (yi, xi), 10 ** (-0.4 * mag))
    pad = 3
    Lp, Fp = np.pad(L, pad, mode="wrap"), np.pad(flux, pad, mode="wrap")
    sel = (np.abs(dec) < 50) & (mag > 6) & (mag < 8.5)
    y, x = yi[sel], xi[sel]
    s = np.zeros(len(y), np.float32)
    o = np.zeros(len(y), np.float32)
    for dy in range(-pad, pad + 1):
        for dx in range(-pad, pad + 1):
            s += Lp[y + pad + dy, x + pad + dx]
            o += Fp[y + pad + dy, x + pad + dx]
    f = 10 ** (-0.4 * mag[sel])
    iso = (f / o > 0.9) & (s > 0)
    slope = np.polyfit(np.log10(f[iso]), np.log10(s[iso]), 1)[0]
    print(f"  hiptyc response: pixel sum ~ flux^{slope:.2f} ({iso.sum()} isolated stars, V 6-8.5)")
    return float(slope)


def main() -> None:
    raw = RAW / "sky"
    mw_path = download(SVS + "milkyway_2020_4k.exr", raw / "milkyway_2020_4k.exr", min_size=10_000_000)
    hip_path = download(SVS + "hiptyc_2020_4k.exr", raw / "hiptyc_2020_4k.exr", min_size=5_000_000)
    slope = measure_response(read_exr(hip_path))
    mw = read_exr(mw_path)
    H, W, _ = mw.shape
    lum = 0.2126 * mw[..., 0] + 0.7152 * mw[..., 1] + 0.0722 * mw[..., 2]
    SKY.mkdir(parents=True, exist_ok=True)
    img = (srgb_encode(mw) * 255.0 + 0.5).astype(np.uint8)
    Image.fromarray(img, "RGB").save(SKY / "milkyway_4k.jpg", quality=92, subsampling=0)
    print(f"  wrote sky/milkyway_4k.jpg {W}x{H}; luminance median {np.median(lum):.4g}, p99 {np.percentile(lum, 99):.4g}")
    write_json(SKY / "manifest.json", {
        "milkyway": {
            "file": "milkyway_4k.jpg", "width": W, "height": H,
            "frame": "ICRF/J2000 equatorial, plate carree, RA 0h at centre, RA increasing to the left",
            "encoding": "sRGB of the source's display-referred linear values (clipped at 1)",
            "medianLinear": float(np.median(lum)),
            "responseSlope": slope,
            "credit": "NASA/Goddard Space Flight Center Scientific Visualization Studio, Deep Star Maps 2020 "
                      "(milkyway_2020 layer, E. Wright). Gaia DR2: ESA/Gaia/DPAC.",
            "source": SVS + "milkyway_2020_4k.exr",
            "license": "Public domain (NASA SVS); underlying Gaia DR2 data ESA/Gaia/DPAC",
        }
    })


if __name__ == "__main__":
    main()
