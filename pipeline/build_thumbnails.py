"""Sphere thumbnails for the VR menu, rendered from the engine's own maps
(orthographic, lit from the upper left). Output: textures/thumbs.jpg (atlas of
128 px cells) + thumbs.json {body name: [column, row]}.
Bodies without a map are drawn from their measured colours (Venus: Mariner 10 disk
colour; Titan: Karkoschka albedo spectrum; Sun: limb-darkened 5772 K blackbody).
"""
from __future__ import annotations

import json

import numpy as np
from PIL import Image

from common import OUT, write_json

TEX = OUT / "textures"
CELL = 128
COLS = 8
KEY_TO_BODY = {"earth_day": "Earth"}
# central longitude (east) of the thumbnail's view, chosen to show recognisable features
VIEW_LON = {"Earth": 15.0, "Mars": -60.0, "Moon": 0.0, "Jupiter": 30.0}


def lin(a):
    return np.where(a <= 0.04045, a / 12.92, ((a + 0.055) / 1.055) ** 2.4)


def enc(a):
    a = np.clip(a, 0, 1)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * a ** (1 / 2.4) - 0.055)


def disk():
    y, x = np.mgrid[0:CELL, 0:CELL]
    nx = (x + 0.5) / CELL * 2 - 1
    ny = 1 - (y + 0.5) / CELL * 2
    r2 = nx * nx + ny * ny
    inside = r2 < 0.94
    nz = np.sqrt(np.clip(0.94 - r2, 0, None)) / np.sqrt(0.94)
    nx, ny = nx / np.sqrt(0.94), ny / np.sqrt(0.94)
    return nx, ny, nz, inside


def shade(nx, ny, nz):
    L = np.array([-0.55, 0.45, 0.70])
    L /= np.linalg.norm(L)
    return np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0, 1) * 0.95 + 0.05


def render_map(img: Image.Image, lon_left: float, view_lon: float) -> np.ndarray:
    src = lin(np.asarray(img.convert("RGB").resize((1024, 512), Image.Resampling.LANCZOS)) / 255.0)
    nx, ny, nz, inside = disk()
    lat = np.arcsin(np.clip(ny, -1, 1))
    lon = np.degrees(np.arctan2(nx, nz)) + view_lon
    u = ((lon - lon_left) / 360.0) % 1.0
    v = 0.5 - lat / np.pi
    px = np.clip((u * 1024).astype(int), 0, 1023)
    py = np.clip((v * 512).astype(int), 0, 511)
    col = src[py, px]
    col = col / max(np.percentile(col[inside], 97), 1e-3) * 0.85
    out = col * shade(nx, ny, nz)[..., None]
    out[~inside] = 0
    return out


def render_colour(rgb, limb=False, emissive=False) -> np.ndarray:
    nx, ny, nz, inside = disk()
    c = np.array(rgb, float)
    c = c / c.max() * 0.85
    s = (0.4 + 0.6 * nz) if emissive else shade(nx, ny, nz)
    out = c[None, None, :] * s[..., None]
    out[~inside] = 0
    return out


def main() -> None:
    man = json.loads((TEX / "manifest.json").read_text())
    cells: list[tuple[str, np.ndarray]] = []
    for key, info in man["maps"].items():
        if key.endswith("_relief") or info.get("channels") not in ("RGB", "L"):
            continue
        if key in ("earth_night", "earth_clouds"):
            continue
        body = KEY_TO_BODY.get(key, key.capitalize())
        if body == "Titan":
            continue  # drawn from its spectrum below
        img = Image.open(TEX / info["file"])
        cells.append((body, render_map(img, info.get("lonLeft", -180), VIEW_LON.get(body, 0.0))))
    venus = man.get("diskColors", {}).get("venus", {}).get("linearRGB")
    if venus:
        cells.append(("Venus", render_colour(venus)))
    titan = man.get("spectralColors", {}).get("titan", {}).get("linearRGB")
    if titan:
        cells.append(("Titan", render_colour(titan)))
    cells.append(("Sun", render_colour([1.0, 0.93, 0.82], emissive=True)))
    rows = (len(cells) + COLS - 1) // COLS
    atlas = np.zeros((rows * CELL, COLS * CELL, 3))
    index = {}
    for i, (name, img) in enumerate(cells):
        c, r = i % COLS, i // COLS
        atlas[r * CELL:(r + 1) * CELL, c * CELL:(c + 1) * CELL] = img
        index[name] = [c, r]
    Image.fromarray((enc(atlas) * 255 + 0.5).astype(np.uint8)).save(TEX / "thumbs.jpg", quality=90)
    write_json(TEX / "thumbs.json", {"cell": CELL, "cols": COLS, "rows": rows, "bodies": index})
    print(f"  {len(cells)} thumbnails: {', '.join(index)}")


if __name__ == "__main__":
    main()
