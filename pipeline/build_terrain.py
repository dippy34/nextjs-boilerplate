"""Height maps for landing: public/data/terrain/*.png + terrain.json

The engine builds real 3D ground under the explorer near a solid world (src/render/TerrainPatch.ts).
For the Moon, Mars and Mercury the large-scale shape comes from these global elevation models; finer
relief (and all relief on other bodies) is generated.

  Moon     NASA SVS CGI Moon Kit, LRO LOLA LDEM 16 ppd (half-metres, offset 20000, vs 1737.4 km)  public domain
  Mars     NASA/JPL/GSFC MGS MOLA global DEM 463 m, via USGS Astrogeology (m vs the areoid)        public domain
  Mercury  MESSENGER USGS global DEM 665 m v2, via USGS Astrogeology (m vs 2439.4 km)              public domain
  Ceres    NASA/JPL/DLR Dawn FC HAMO DTM 60 ppd, via USGS Astrogeology (m vs a 470 km sphere,
           converted here to the IAU ellipsoid 482.2 x 482.1 x 445.9 km the engine measures from)  public domain
  Earth    NOAA NCEI ETOPO 2022 60" surface elevation (m vs the EGM2008 geoid)                     public domain
           Water (height <= 0) is stored as -200 m: the engine draws it flat at sea level ("sea": 0),
           and the shallow fill keeps the coastline near the right place after resampling.

Format: 8-bit RGB PNG, height = (R * 256 + G) * scale + offset (metres), so a browser canvas reads it
back exactly; equirectangular, row 0 at +90 deg latitude, column 0 at longitude `lonLeft`.
"""
from __future__ import annotations

import numpy as np
import rasterio
from PIL import Image

from common import OUT, write_json
from fetch_hires import ETOPO, HI, SVS, USGS, StripTiff, download, fill_nan_zonal

W, H = 2048, 1024
DIR = OUT / "terrain"


def save(name: str, h: np.ndarray) -> dict:
    lo, hi = float(np.nanmin(h)), float(np.nanmax(h))
    scale = max(1.0, (hi - lo) / 65535.0)
    v = np.clip(np.round((h - lo) / scale), 0, 65535).astype(np.uint32)
    rgb = np.zeros(h.shape + (3,), np.uint8)
    rgb[..., 0] = v >> 8
    rgb[..., 1] = v & 255
    DIR.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgb, "RGB").save(DIR / f"{name}.png", optimize=True)
    size = (DIR / f"{name}.png").stat().st_size / 1e6
    print(f"  {name}: {h.shape[1]}x{h.shape[0]} {lo:.0f}..{hi:.0f} m, step {scale:.2f} m, {size:.1f} MB")
    return {"file": f"{name}.png", "width": int(h.shape[1]), "height": int(h.shape[0]), "lonLeft": -180,
            "offset": lo, "scale": scale}


def earth() -> dict:
    et = download(ETOPO, HI / "etopo2022_60s_surface.tif", min_size=100_000_000)
    with rasterio.open(et) as ds:
        h = ds.read(1).astype(np.float32)
    h[h < -20000] = 0
    h[h <= 0] = -200.0
    h = np.asarray(Image.fromarray(h, "F").resize((W, H), Image.BOX))     # area average
    return save("earth", h) | {"sea": 0,
        "credit": "NOAA NCEI, ETOPO 2022 60 arc-second Global Relief Model (surface), DOI 10.25921/fd45-gt74", "source": ETOPO}


CERES = USGS + "Ceres_Dawn_FC_HAMO_DTM_DLR_Global_60ppd_Oct2016.tif"


def ceres() -> dict:
    h = fill_nan_zonal(StripTiff(CERES).decimated(W, H, rows_per_out=2, nodata=-32768)[..., :1])[..., 0].astype(np.float64)
    # heights above a 470 km sphere -> above the ellipsoid (a, b, c) of the body's rotation model
    a, b, c = 482.2e3, 482.1e3, 445.9e3
    lat = np.radians(90.0 - (np.arange(H) + 0.5) * 180.0 / H)[:, None]
    lon = np.radians((np.arange(W) + 0.5) * 360.0 / W)[None, :]            # this map starts at 0 deg E
    nx, ny, nz = np.cos(lat) * np.cos(lon), np.cos(lat) * np.sin(lon), np.sin(lat) * np.ones_like(lon)
    ell = 1.0 / np.sqrt((nx / a) ** 2 + (ny / b) ** 2 + (nz / c) ** 2)
    return save("ceres", (470e3 + h - ell).astype(np.float32)) | {"lonLeft": 0,
        "credit": "NASA/JPL-Caltech/UCLA/MPS/DLR/IDA, Dawn FC HAMO DTM (DLR) 60 ppd, via USGS Astrogeology", "source": CERES}


def main() -> None:
    import json
    import sys
    if sys.argv[1:] and sys.argv[1] in ("earth", "ceres"):
        # rebuild only one map, keeping the rest of terrain.json (and its patches)
        man = json.loads((DIR / "terrain.json").read_text())
        man["maps"][sys.argv[1]] = earth() if sys.argv[1] == "earth" else ceres()
        (DIR / "terrain.json").write_text(json.dumps(man, indent=1))
        return
    out: dict[str, dict] = {}
    d = download(SVS + "ldem_16_uint.tif", HI / "ldem_16_uint.tif", min_size=10_000_000)
    with rasterio.open(d) as ds:
        h = ds.read(1, out_shape=(H, W), resampling=rasterio.enums.Resampling.average).astype(np.float32)
    out["moon"] = save("moon", (h - 20000.0) * 0.5) | {
        "credit": "NASA SVS CGI Moon Kit, LRO LOLA gridded elevation (LDEM 16 ppd)", "source": SVS + "ldem_16_uint.tif"}

    url = USGS + "Mars_MGS_MOLA_DEM_mosaic_global_463m.tif"
    h = fill_nan_zonal(StripTiff(url).decimated(W, H, rows_per_out=2, nodata=-32768)[..., :1])[..., 0]
    out["mars"] = save("mars", h) | {"credit": "NASA/JPL/GSFC MGS MOLA, global DEM 463 m, via USGS Astrogeology", "source": url}

    url = USGS + "Mercury_Messenger_USGS_DEM_Global_665m_v2.tif"
    h = fill_nan_zonal(StripTiff(url).decimated(W, H, rows_per_out=2, nodata=-32768)[..., :1])[..., 0]
    # the GeoTIFF stores heights in 0.5 m units (its scale tag); the published terrain.json applies
    # it as scale 0.5 over the earlier PNG, a rebuild bakes it into the samples
    out["mercury"] = save("mercury", h * 0.5) | {"credit": "NASA/JHUAPL/CIW, MESSENGER USGS global DEM 665 m v2, via USGS Astrogeology", "source": url}

    out["earth"] = earth()
    out["ceres"] = ceres()

    write_json(DIR / "terrain.json", {"license": "Public domain (U.S. Government work)", "maps": out}, compact=False)


if __name__ == "__main__":
    main()
