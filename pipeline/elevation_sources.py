"""Sources of the global elevation pyramids (build_elevation.py) and a resumable downloader.

Raw files land in data-raw/elevation/ (git-ignored). `python3 elevation_sources.py [body ...]`
downloads them (resuming partial .part files with HTTP Range requests).
"""
from __future__ import annotations

import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests

from common import RAW, UA

DIR = RAW / "elevation"

LOLA128 = "https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_128.img"
MOLA463 = "https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif"
MESS665 = "https://planetarymaps.usgs.gov/mosaic/Mercury_Messenger_USGS_DEM_Global_665m_v2.tif"
CERES60 = "https://planetarymaps.usgs.gov/mosaic/Ceres_Dawn_FC_HAMO_DTM_DLR_Global_60ppd_Oct2016.tif"
VESTA48 = "https://planetarymaps.usgs.gov/mosaic/Vesta_Dawn_HAMO_DTM_DLR_Global_48ppd.tif"
ETOPO15 = "https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO2022/data/15s/15s_surface_elev_gtif/"


def etopo_name(lat_top: int, lon_left: int) -> str:
    """ETOPO 2022 15" tiles are 15 x 15 degrees, named by their north-west corner."""
    return (f"ETOPO_2022_v1_15s_{'N' if lat_top >= 0 else 'S'}{abs(lat_top):02d}"
            f"{'E' if lon_left >= 0 else 'W'}{abs(lon_left):03d}_surface.tif")


def etopo_tiles() -> list[tuple[int, int]]:
    return [(top, left) for top in range(90, -90, -15) for left in range(-180, 180, 15)]


FILES = {
    "moon": [(LOLA128, "ldem_128.img")],
    "mars": [(MOLA463, "Mars_MGS_MOLA_DEM_mosaic_global_463m.tif")],
    "mercury": [(MESS665, "Mercury_Messenger_USGS_DEM_Global_665m_v2.tif")],
    "ceres": [(CERES60, "Ceres_Dawn_FC_HAMO_DTM_DLR_Global_60ppd_Oct2016.tif")],
    "vesta": [(VESTA48, "Vesta_Dawn_HAMO_DTM_DLR_Global_48ppd.tif")],
    "earth": [(ETOPO15 + etopo_name(t, l), "etopo15/" + etopo_name(t, l)) for t, l in etopo_tiles()],
}


def fetch(url: str, dest: Path, retries: int = 8) -> Path:
    """Download url to dest, resuming a partial download; skips files already complete."""
    if dest.exists():
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    part = dest.with_suffix(dest.suffix + ".part")
    delay = 2.0
    for attempt in range(retries + 1):
        try:
            have = part.stat().st_size if part.exists() else 0
            hdr = dict(UA)
            if have:
                hdr["Range"] = f"bytes={have}-"
            with requests.get(url, headers=hdr, stream=True, timeout=120) as r:
                if r.status_code == 416:          # already complete
                    os.replace(part, dest)
                    return dest
                r.raise_for_status()
                if have and r.status_code != 206:
                    have = 0                        # server ignored the range: start over
                total = have + int(r.headers.get("content-length", 0))
                with open(part, "ab" if have else "wb") as f:
                    for chunk in r.iter_content(1 << 20):
                        f.write(chunk)
            if total and part.stat().st_size < total:
                raise RuntimeError(f"short read {part.stat().st_size} < {total}")
            os.replace(part, dest)
            print(f"  downloaded {dest.name} ({dest.stat().st_size / 1e6:.0f} MB)", flush=True)
            return dest
        except Exception as e:  # noqa: BLE001
            if attempt == retries:
                raise
            print(f"  retry {attempt + 1} for {url}: {e}", flush=True)
            time.sleep(delay)
            delay = min(delay * 2, 60)
    return dest


def fetch_body(body: str) -> list[Path]:
    files = FILES[body]
    with ThreadPoolExecutor(4) as ex:
        return list(ex.map(lambda f: fetch(f[0], DIR / f[1]), files))


if __name__ == "__main__":
    for b in sys.argv[1:] or list(FILES):
        fetch_body(b)
