"""Download ground materials for close-up surfaces from Poly Haven (CC0, public domain dedication):
regolith from its Moon collection, rock, sand, dry soil, snow and forest ground.

For each material we keep 1024-px JPEGs of the colour (diffuse), the OpenGL-convention normal map
and the displacement (height) map in public/data/materials/, and write a manifest with each
material's mean colour (the engine uses the colour only as detail around that mean, tinted by the
world's own map or palette). The engine packs them into one texture array at load
(render/Materials.ts).
"""
from __future__ import annotations

import json
import sys

import numpy as np
from PIL import Image

from common import OUT, RAW, download, write_json

MAT = OUT / "materials"
SRC = RAW / "materials"
API = "https://api.polyhaven.com/files/"

# layer name -> Poly Haven asset
MATERIALS: list[tuple[str, str]] = [
    ("regolith", "moon_01"),
    ("regolith_pocked", "moon_meteor_01"),
    ("rock_ground", "rocks_ground_02"),
    ("cliff", "rock_face_03"),
    ("sand", "sand_01"),
    ("dry_soil", "dry_ground_rocks"),
    ("snow", "snow_02"),
    ("forest_ground", "forest_ground_04"),
]
MAPS = {"diff": "Diffuse", "nor": "nor_gl", "disp": "Displacement"}
SIZE = 1024


def fetch_json(url: str) -> dict:
    path = SRC / (url.rsplit("/", 1)[-1] + ".json")
    download(url, path)
    return json.loads(path.read_text())


def main() -> None:
    MAT.mkdir(parents=True, exist_ok=True)
    SRC.mkdir(parents=True, exist_ok=True)
    manifest = {"size": SIZE, "credit": "Poly Haven (polyhaven.com), CC0", "layers": []}
    for name, asset in MATERIALS:
        files = fetch_json(API + asset)
        entry = {"name": name, "asset": asset}
        for short, key in MAPS.items():
            url = files[key]["1k"]["jpg"]["url"] if "jpg" in files[key]["1k"] else files[key]["1k"]["png"]["url"]
            raw = SRC / f"{asset}_{short}{url[url.rfind('.'):]}"
            download(url, raw)
            img = Image.open(raw)
            img = img.convert("L" if short == "disp" else "RGB").resize((SIZE, SIZE), Image.LANCZOS)
            out = MAT / f"{name}_{short}.jpg"
            img.save(out, quality=90)
            entry[short] = out.name
            if short == "diff":
                a = np.asarray(img, dtype=np.float64) / 255.0
                lin = np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)
                entry["mean"] = [round(float(v), 4) for v in lin.reshape(-1, 3).mean(axis=0)]
        manifest["layers"].append(entry)
        print(name, asset, entry["mean"])
    write_json(MAT / "manifest.json", manifest)


if __name__ == "__main__":
    sys.exit(main())
