"""4096 x 2048 maps of the moons, dwarf planets and asteroids, from the full-resolution USGS mosaics.

The first texture pass (fetch_textures.py) used USGS's 1024-pixel previews. This pass reads the full
mosaics (uncompressed GeoTIFFs, read row by row with HTTP range requests, area-averaged to 4096
columns) and replaces those maps. Each new map is aligned to the old one by correlation (longitude
origin and direction), so the engine's existing longitude conventions stay valid. Phobos is new.

Source: USGS Astrogeology Science Center map-a-planet mosaics (public domain, U.S. Government work);
the individual missions are credited in the manifest.
"""
from __future__ import annotations

import json

import numpy as np
from PIL import Image

from common import OUT, write_json
from fetch_hires import StripTiff

TEX = OUT / "textures"
B = "https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/"
W, H = 4096, 2048

# key: (file, bands, credit)
MOONS = {
    "europa": ("Europa_Voyager_GalileoSSI_global_mosaic_500m.tif", 1, "NASA/JPL/USGS, Europa Voyager–Galileo SSI global mosaic (500 m)"),
    "ganymede": ("Ganymede_Voyager_GalileoSSI_Global_ClrMosaic_1435m.tif", 3, "NASA/JPL/USGS, Ganymede Voyager–Galileo SSI colour global mosaic (1.4 km)"),
    "callisto": ("Callisto_Voyager_GalileoSSI_global_mosaic_1km.tif", 1, "NASA/JPL/USGS, Callisto Voyager–Galileo SSI global mosaic (1 km)"),
    "io": ("Io_GalileoSSI-Voyager_Global_Mosaic_ClrMerge_1km.tif", 3, "NASA/JPL/USGS, Io Galileo SSI / Voyager colour merged global mosaic (1 km)"),
    "titan": ("Titan_ISS_P19658_Mosaic_Global_4km.tif", 1, "NASA/JPL/Space Science Institute, Titan Cassini ISS global mosaic (4 km), via USGS"),
    "enceladus": ("Enceladus_Cassini_mosaic_global_110m.tif", 1, "NASA/JPL/Space Science Institute, Enceladus Cassini global mosaic (110 m), via USGS"),
    "tethys": ("Tethys_Cassini_mosaic_global_293m.tif", 1, "NASA/JPL/Space Science Institute, Tethys Cassini global mosaic (293 m), via USGS"),
    "dione": ("Dione_Cassini_Voyager_mosaic_global_154m.tif", 1, "NASA/JPL/Space Science Institute, Dione Cassini–Voyager global mosaic (154 m), via USGS"),
    "rhea": ("Rhea_Cassini_Voyager_mosaic_global_417m.tif", 1, "NASA/JPL/Space Science Institute, Rhea Cassini–Voyager global mosaic (417 m), via USGS"),
    "iapetus": ("Iapetus_Cassini_Voyager_mosaic_global_783m.tif", 1, "NASA/JPL/Space Science Institute, Iapetus Cassini–Voyager global mosaic (783 m), via USGS"),
    "triton": ("Triton_Voyager2_ClrMosaic_GlobalFill_600m.tif", 3, "NASA/JPL/USGS, Triton Voyager 2 global colour mosaic (600 m)"),
    "pluto": ("Pluto_NewHorizons_Global_Mosaic_300m_Jul2017_8bit.tif", 1, "NASA/JHUAPL/SwRI, New Horizons LORRI–MVIC Pluto global mosaic (300 m), via USGS"),
    "charon": ("Charon_NewHorizons_Global_Mosaic_300m_Jul2017_8bit.tif", 1, "NASA/JHUAPL/SwRI, New Horizons LORRI–MVIC Charon global mosaic (300 m), via USGS"),
    "ceres": ("Ceres_Dawn_FC_DLR_global_20ppd_Oct2015.tif", 1, "NASA/JPL/DLR, Dawn FC Ceres global mosaic (20 px/deg), via USGS"),
    "vesta": ("Vesta_Dawn_FC_HAMO_Mosaic_Global_74ppd.tif", 1, "NASA/JPL/DLR, Dawn FC HAMO Vesta global mosaic (74 px/deg), via USGS"),
    "phobos": ("Phobos_ME_SRC_Mosaic_Global_16ppd.tif", 1, "ESA/DLR/FU Berlin, Mars Express HRSC SRC Phobos global mosaic (16 px/deg), via USGS"),
}


def align(new: np.ndarray, old_path) -> tuple[np.ndarray, str]:
    """Roll/flip `new` (H, W, C) so it matches the old map's longitude convention."""
    if not old_path.exists():
        return new, "no reference"
    old = np.asarray(Image.open(old_path).convert("L").resize((512, 256), Image.BILINEAR)).astype(np.float32)
    small = np.asarray(Image.fromarray(np.clip(new.mean(axis=-1), 0, 255).astype(np.uint8)).resize((512, 256), Image.BILINEAR)).astype(np.float32)
    best = None
    for flip in (False, True):
        s = small[:, ::-1] if flip else small
        for shift in range(0, 512, 8):
            c = np.corrcoef(np.roll(s, shift, axis=1).ravel(), old.ravel())[0, 1]
            if best is None or c > best[0]:
                best = (c, flip, shift)
    c, flip, shift = best
    out = new[:, ::-1] if flip else new
    out = np.roll(out, shift * W // 512, axis=1)
    return out, f"corr {c:.2f}, flip={flip}, shift={shift * 360 / 512:.0f}°"


def main() -> None:
    import sys
    only = set(sys.argv[1:])
    man_path = TEX / "manifest.json"
    man = json.loads(man_path.read_text())
    for key, (file, bands, credit) in MOONS.items():
        if only and key not in only:
            continue
        print(f"[{key}]")
        t = StripTiff(B + file)
        arr = t.decimated(W, H, bands=tuple(range(bands)), rows_per_out=1 if bands == 3 else 2)
        arr = np.nan_to_num(arr, nan=0.0)
        old = TEX / f"{key}.jpg"
        arr, how = align(arr, old)
        print(f"  aligned to the previous map: {how}")
        img = Image.fromarray(np.clip(arr + 0.5, 0, 255).astype(np.uint8).squeeze(), "RGB" if bands == 3 else "L")
        img.save(old, quality=90)
        prev = man["maps"].get(key, {})
        man["maps"][key] = {
            "file": f"{key}.jpg", "width": W, "height": H, "channels": "RGB" if bands == 3 else "L",
            "lonLeft": prev.get("lonLeft", 0 if key == "phobos" else -180), "credit": credit, "source": B + file,
            "license": "Public domain (U.S. Government work)" if key != "phobos" else "ESA/DLR/FU Berlin, CC BY-SA 3.0 IGO",
        }
        write_json(man_path, man, compact=False)
    print("done")


if __name__ == "__main__":
    main()
