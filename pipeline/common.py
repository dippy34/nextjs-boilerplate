"""Shared helpers for the data pipeline.

Raw downloads go to data-raw/ (git-ignored); processed, engine-ready files go to
public/data/ and are committed so the app runs without re-running the pipeline.
"""
from __future__ import annotations

import html
import json
import os
import re
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data-raw"
OUT = ROOT / "public" / "data"
RAW.mkdir(exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

UA = {"User-Agent": "SpaceExplorer-data-pipeline/0.1 (open-source educational renderer)"}

# Physical constants (IAU 2012/2015 nominal values)
AU_KM = 149597870.7
PC_M = 3.0856775814913673e16
LY_M = 9.4607304725808e15


def download(url: str, dest: Path, retries: int = 4, min_size: int = 1) -> Path:
    """Download url to dest unless it already exists. Retries with backoff."""
    if dest.exists() and dest.stat().st_size >= min_size:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    delay = 2
    for attempt in range(retries + 1):
        try:
            with requests.get(url, headers=UA, stream=True, timeout=120) as r:
                r.raise_for_status()
                tmp = dest.with_suffix(dest.suffix + ".part")
                with open(tmp, "wb") as f:
                    for chunk in r.iter_content(1 << 20):
                        f.write(chunk)
                os.replace(tmp, dest)
            if dest.stat().st_size < min_size:
                raise RuntimeError(f"{url}: downloaded file too small")
            print(f"  downloaded {url} -> {dest.relative_to(ROOT)} ({dest.stat().st_size/1e6:.1f} MB)")
            return dest
        except Exception as e:  # noqa: BLE001
            if attempt == retries:
                raise
            print(f"  retry {attempt+1} for {url}: {e}")
            time.sleep(delay)
            delay *= 2
    return dest


def html_tables(text: str) -> list[list[list[str]]]:
    """Very small HTML table extractor: returns tables as lists of rows of cell text."""
    text = re.sub(r"<script.*?</script>", "", text, flags=re.S)
    out = []
    for t in re.findall(r"<table.*?</table>", text, flags=re.S):
        rows = []
        for r in re.findall(r"<tr.*?</tr>", t, flags=re.S):
            cells = [
                re.sub(r"\s+", " ", html.unescape(re.sub(r"<.*?>", "", c))).strip()
                for c in re.findall(r"<t[hd].*?</t[hd]>", r, flags=re.S)
            ]
            rows.append(cells)
        out.append(rows)
    return out


def write_json(path: Path, obj, compact: bool = True) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        if compact:
            json.dump(obj, f, separators=(",", ":"), allow_nan=False)
        else:
            json.dump(obj, f, indent=1, allow_nan=False)
    print(f"  wrote {path.relative_to(ROOT)} ({path.stat().st_size/1e3:.0f} kB)")
