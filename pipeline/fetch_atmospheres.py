"""Atmosphere bulk parameters from the NASA NSSDCA planetary fact sheets
(https://nssdc.gsfc.nasa.gov/planetary/factsheet/), used to scale the engine's
single-scattering atmosphere model: scale height, surface (or 1-bar) pressure,
mean molecular weight and temperature.

Output: public/data/solar/atmospheres.json
"""
from __future__ import annotations

import html
import re

import requests

from common import OUT, UA, write_json

FACT = "https://nssdc.gsfc.nasa.gov/planetary/factsheet/{}fact.html"
PLANETS = ["venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"]


def num(pattern: str, text: str) -> float | None:
    m = re.search(pattern, text)
    if not m:
        return None
    vals = [float(v) for v in re.findall(r"[\d.]+", m.group(1))]
    return sum(vals) / len(vals) if vals else None


def main() -> None:
    out = {}
    for p in PLANETS:
        t = requests.get(FACT.format(p), headers=UA, timeout=60).text
        t = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t)))
        rec = {
            "scaleHeightKm": num(r"Scale height: ([\d.\s-]+?) km", t),
            "meanMolecularWeight": num(r"Mean molecular weight: ([\d.\s-]+)", t),
            "source": FACT.format(p),
        }
        sp = re.search(r"Surface pressure: ([\d.]+) (bars|mb)", t)
        if sp:
            rec["surfacePressureBar"] = float(sp.group(1)) / (1000.0 if sp.group(2) == "mb" else 1.0)
            rec["temperatureK"] = num(r"Average temperature: ~?([\d.]+) K", t)
        else:  # giant planets: the 1-bar level (the reference radius)
            rec["surfacePressureBar"] = 1.0
            rec["temperatureK"] = num(r"Temperature at 1 bar: ([\d.]+) K", t)
        out[p.capitalize()] = rec
        print(f"  {p}: {rec}")
    write_json(OUT / "solar" / "atmospheres.json", out, compact=False)


if __name__ == "__main__":
    main()
