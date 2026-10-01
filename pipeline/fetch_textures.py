"""Download public-domain NASA / USGS planetary maps and convert them to
engine-ready equirectangular JPEGs (power-of-two sizes) in public/data/textures.

Every source here is a U.S. Government work (NASA, USGS) and therefore in the
public domain; we still credit each one in CREDITS.md and in
public/data/textures/manifest.json (shown in the in-app info panel).

For gas giants without a usable global map (Saturn, Uranus, Neptune) we
download a real full-disk image and measure its mean disk colour; the engine
uses that measured colour for its procedural banded atmosphere.
"""
from __future__ import annotations

import sys

import numpy as np
from PIL import Image

from common import OUT, RAW, download, write_json

Image.MAX_IMAGE_PIXELS = None
TEX = OUT / "textures"
SRC = RAW / "textures"

USGS = "https://astrogeology.usgs.gov/ckan/dataset/"
PJ = "https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/"
EO = "https://eoimages.gsfc.nasa.gov/images/imagerecords/"
SVS = "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/"

# key: (url, output size (w, h), credit, mode)
MAPS: dict[str, tuple[str, tuple[int, int], str, str]] = {
    "earth_day": (EO + "74000/74167/world.200410.3x5400x2700.jpg", (4096, 2048),
                  "NASA Earth Observatory, Blue Marble: Next Generation (Oct 2004), R. Stöckli", "RGB"),
    "earth_night": (EO + "144000/144898/BlackMarble_2016_3km.jpg", (4096, 2048),
                    "NASA Earth Observatory, Black Marble 2016 (Suomi NPP VIIRS)", "L"),
    "earth_clouds": (EO + "57000/57747/cloud_combined_2048.jpg", (2048, 1024),
                     "NASA Earth Observatory / Blue Marble cloud composite (MODIS)", "L"),
    "moon": (SVS + "lroc_color_poles_4k.tif", (4096, 2048),
             "NASA Scientific Visualization Studio, CGI Moon Kit (LRO LROC WAC colour)", "RGB"),
    "mercury": (USGS + "279e5d50-ff2f-4250-bde3-bb510096079e/resource/2b5865c2-bd0d-4962-bdb0-c12f0502def1/download/mercury_messenger_mosaic_global_1024.jpg",
                (1024, 512), "NASA/JHUAPL/CIW, MESSENGER MDIS global mosaic, via USGS Astrogeology", "L"),
    "mars": (USGS + "dfdc2242-52dc-4126-bc89-03af8253ae79/resource/0d7b31dc-0b2e-4ca6-89dc-e3c1404c0232/download/mars_viking_clrmosaic_global_1024.jpg",
             (1024, 512), "NASA/JPL, Viking global colour mosaic, via USGS Astrogeology", "RGB"),
    "jupiter": (PJ + "pia07/pia07782/PIA07782.jpg", (2048, 1024),
                "NASA/JPL/Space Science Institute, Cassini cylindrical map of Jupiter (PIA07782)", "RGB"),
    "io": (USGS + "f6924861-ce9c-490d-8a4b-7812a20f2de5/resource/a9fab679-8081-4144-9f58-45848836c8f5/download/full.jpg",
           (2048, 1024), "NASA/JPL/USGS, Io Galileo SSI / Voyager colour merged global mosaic", "RGB"),
    "europa": (USGS + "4080036f-afc5-422e-abe9-1c0c8e4f98ea/resource/3647e7b3-425e-4dcf-951b-cc4a22fb0129/download/europa_voyager_galileossi_global_mosaic_500m_1024.jpg",
               (1024, 512), "NASA/JPL/USGS, Europa Voyager–Galileo SSI global mosaic", "L"),
    "ganymede": (USGS + "e1422336-3291-4b65-b903-c942d53de073/resource/eb32abd7-fee2-47d1-9f96-9d7d8824cc3a/download/ganymede_voyager_galileossi_global_clrmosaic_1024.jpg",
                 (1024, 512), "NASA/JPL/USGS, Ganymede Voyager–Galileo SSI colour global mosaic", "RGB"),
    "callisto": (USGS + "a80abd68-7ed9-440e-829a-76376779164f/resource/ac628525-cb1c-4742-928b-5a0a60f372cd/download/callisto_voyager_galileossi_global_mosaic_1024.jpg",
                 (1024, 512), "NASA/JPL/USGS, Callisto Voyager–Galileo SSI global mosaic", "L"),
    "titan": (USGS + "8ee17e4e-26c6-4e22-9c23-bc9a4c7ed35e/resource/c3f3006c-3174-4716-920f-44f5dc749a4a/download/titan_iss_p19658_mosaic_global_1024.jpg",
              (1024, 512), "NASA/JPL/Space Science Institute, Titan Cassini ISS global mosaic, via USGS", "L"),
    "enceladus": (USGS + "30bff65e-56bb-4fd1-bd04-edd9bc2e77d0/resource/19ba2e14-9ceb-45e6-8cc8-e784e36ed4f0/download/full.jpg",
                  (1024, 512), "NASA/JPL/Space Science Institute, Enceladus Cassini global mosaic, via USGS", "L"),
    "tethys": (USGS + "e40296c1-b4bf-46d8-86af-4b6cf0301b0c/resource/36d40203-d9b3-447e-9004-c3dc100bde04/download/full.jpg",
               (1024, 512), "NASA/JPL/Space Science Institute, Tethys Cassini global mosaic, via USGS", "L"),
    "dione": (USGS + "acb98ae6-ec50-42df-9a74-142d177bbe6d/resource/8a6a8ada-42e1-4b92-b13e-c63493133efc/download/full.jpg",
              (1024, 512), "NASA/JPL/Space Science Institute, Dione Cassini–Voyager global mosaic, via USGS", "L"),
    "rhea": (USGS + "22bc1015-d9c9-4212-86c3-e42061b204d4/resource/77fa77f8-6d6b-4072-9360-17138caa6e7d/download/full.jpg",
             (1024, 512), "NASA/JPL/Space Science Institute, Rhea Cassini–Voyager global mosaic, via USGS", "L"),
    "iapetus": (USGS + "6ac8ecfb-36e7-4113-8d16-c92ba857c3d7/resource/141c2d1e-aa01-4e2f-969a-e46a581db4b9/download/full.jpg",
                (1024, 512), "NASA/JPL/Space Science Institute, Iapetus Cassini–Voyager global mosaic, via USGS", "L"),
    "triton": (USGS + "445b4c39-e87a-4e4d-88a8-e48d8e755c5c/resource/de0ba9f1-303e-4e5f-a99a-3201fba9a764/download/triton_voyager2_clrmosaic_1024.jpg",
               (1024, 512), "NASA/JPL/USGS, Triton Voyager 2 global colour mosaic", "RGB"),
    "pluto": (USGS + "a5f1b7f4-9822-4697-a201-e23ef4bd3e16/resource/96be2aa1-f384-4a9f-9458-a8431a0e7956/download/pluto_newhorizons_global_mosaic_300m_jul2017_1024.jpg",
              (1024, 512), "NASA/JHUAPL/SwRI, New Horizons LORRI–MVIC Pluto global mosaic, via USGS", "L"),
    "charon": (USGS + "93827f6c-8feb-42b6-98e6-b0ce57c7d2c8/resource/1abf318c-3290-4aa0-932e-a34f32d7f6ad/download/charon_newhorizons_global_mosaic_300m_jul2017_1024.jpg",
               (1024, 512), "NASA/JHUAPL/SwRI, New Horizons LORRI–MVIC Charon global mosaic, via USGS", "L"),
    "ceres": (USGS + "6ad84c9a-1fad-4869-b4f6-b52c5c2ace36/resource/9f757a65-8d8a-4349-a72d-8062387574b3/download/ceres_dawn_fc_dlr_global_feb2016_1024.jpg",
              (1024, 512), "NASA/JPL/DLR, Dawn FC Ceres global mosaic, via USGS", "L"),
    "vesta": (USGS + "ec63e420-a8bd-4a90-9341-a5754b551574/resource/9306febf-0c7a-49ee-b7b0-a1f043297bf7/download/vesta_dawn_fc_hamo_mosaic_global_1024.jpg",
              (1024, 512), "NASA/JPL/DLR, Dawn FC HAMO Vesta global mosaic, via USGS", "L"),
}

# Longitude (east, degrees) of each map's left edge. From the USGS product
# metadata: "Longitude Domain 0 to 360" -> 0, "-180 to 180" -> -180. Maps are
# always drawn with east to the right, so this is all the engine needs.
LON_LEFT = {"callisto": 0, "europa": 0, "ganymede": 0, "titan": 0, "pluto": 0, "charon": 0}

# Full-disk images used only to measure a mean disk colour.
DISK_COLOR = {
    "saturn": (PJ + "pia11/pia11141/PIA11141.jpg", "NASA/JPL/Space Science Institute, Cassini (PIA11141)"),
    "uranus": (PJ + "pia18/pia18182/PIA18182.jpg", "NASA/JPL-Caltech, Voyager 2 (PIA18182)"),
    "neptune": (PJ + "pia01/pia01492/PIA01492.jpg", "NASA/JPL, Voyager 2 (PIA01492)"),
    "venus": (PJ + "pia23/pia23791/PIA23791.jpg", "NASA/JPL-Caltech, Mariner 10 (PIA23791, reprocessed true colour)"),
}


def convert(key: str, src_path, size, mode) -> None:
    img = Image.open(src_path)
    if img.mode in ("I;16", "I;16B", "I", "F"):
        arr = np.asarray(img, dtype=np.float32)
        arr = (255 * (arr - arr.min()) / max(1e-6, arr.max() - arr.min())).astype(np.uint8)
        img = Image.fromarray(arr)
    img = img.convert(mode)
    if img.size != size:
        img = img.resize(size, Image.LANCZOS)
    dest = TEX / f"{key}.jpg"
    img.save(dest, quality=88, optimize=True, progressive=True)
    print(f"  {key}: {img.size} {mode} -> {dest.stat().st_size/1e3:.0f} kB")


def disk_color(path) -> list[float]:
    """Mean linear-RGB colour of the lit planet disk (pixels above a brightness threshold)."""
    a = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32) / 255.0
    lin = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
    lum = lin @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    mask = lum > 0.25 * np.percentile(lum, 99)
    c = lin[mask].mean(axis=0)
    return [round(float(x / c.max()), 4) for x in c]


def main() -> None:
    TEX.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:])
    manifest = {"maps": {}, "diskColors": {}}
    for key, (url, size, credit, mode) in MAPS.items():
        ext = url.rsplit(".", 1)[-1].lower()
        src = download(url, SRC / f"{key}.{ext}", min_size=10_000)
        if not only or key in only or not (TEX / f"{key}.jpg").exists():
            convert(key, src, size, mode)
        manifest["maps"][key] = {"file": f"{key}.jpg", "width": size[0], "height": size[1],
                                 "channels": mode, "lonLeft": LON_LEFT.get(key, -180), "credit": credit, "source": url, "license": "Public domain (U.S. Government work)"}
    for key, (url, credit) in DISK_COLOR.items():
        src = download(url, SRC / f"{key}_disk.jpg", min_size=10_000)
        manifest["diskColors"][key] = {"linearRGB": disk_color(src), "credit": credit, "source": url}
        print(f"  {key} disk colour {manifest['diskColors'][key]['linearRGB']}")
    write_json(TEX / "manifest.json", manifest, compact=False)


if __name__ == "__main__":
    main()
