"""Height maps for landing: public/data/terrain/*.png + terrain.json

The engine builds real 3D ground under the explorer near a solid world (src/render/TerrainPatch.ts).
For the Moon, Mars and Mercury the large-scale shape comes from these global elevation models; finer
relief (and all relief on other bodies) is generated.

  Moon     NASA SVS CGI Moon Kit, LRO LOLA LDEM 16 ppd (half-metres, offset 20000, vs 1737.4 km)  public domain
  Mars     NASA/JPL/GSFC MGS MOLA global DEM 463 m, via USGS Astrogeology (m vs the areoid)        public domain
  Mercury  MESSENGER USGS global DEM 665 m v2, via USGS Astrogeology (m vs 2439.4 km)              public domain

Format: 8-bit RGB PNG, height = (R * 256 + G) * scale + offset (metres), so a browser canvas reads it
back exactly; equirectangular, row 0 at +90 deg latitude, column 0 at longitude `lonLeft`.
"""
from __future__ import annotations

import numpy as np
import rasterio
from PIL import Image

from common import OUT, write_json
from fetch_hires import HI, SVS, USGS, StripTiff, download, fill_nan_zonal

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


def main() -> None:
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
    out["mercury"] = save("mercury", h) | {"credit": "NASA/JHUAPL/CIW, MESSENGER USGS global DEM 665 m v2, via USGS Astrogeology", "source": url}

    write_json(DIR / "terrain.json", {"license": "Public domain (U.S. Government work)", "maps": out}, compact=False)


if __name__ == "__main__":
    main()
