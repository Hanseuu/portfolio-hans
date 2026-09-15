#!/usr/bin/env python3
"""
Generate web-optimized derivatives of the photos in asset/.

The originals in asset/ are camera-resolution files (up to 9.4 MB each, ~30 MB
total). Shipping those to a browser is very slow, so this script writes two
smaller sets and leaves the originals untouched:

    asset/web/<slug>.jpg|.webp     max 1600px long edge  -> lightbox / large view
    asset/thumbs/<slug>.jpg|.webp  max 800px long edge   -> gallery grid

EXIF orientation is baked into the pixels (two source files use orientation 8),
and EXIF metadata is dropped from the output to save bytes.

Usage:  python3 tools/optimize-images.py
Requires: Pillow  (pip install Pillow)
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:  # pragma: no cover
    sys.exit("Pillow is required:  pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "asset"
WEB = SRC / "web"
THUMBS = SRC / "thumbs"

# Square avatar, handled separately from the landscape/portrait photos.
AVATAR = "Foto diri.jpg"

# Icons are already small and must not be resized or converted.
SKIP = {
    "instagram.png",
    "youtube.png",
    "spotify.png",
    "social-media.png",
    "diaphragm.png",
}

WEB_EDGE = 1600
THUMB_EDGE = 800
AVATAR_EDGE = 640

JPEG_OPTS = dict(format="JPEG", quality=82, optimize=True, progressive=True)
WEBP_OPTS = dict(format="WEBP", quality=80, method=6)


def slugify(name: str) -> str:
    """'gereja st gabriel.jpg' -> 'gereja-st-gabriel'"""
    stem = Path(name).stem.lower()
    stem = re.sub(r"[^a-z0-9]+", "-", stem)
    return stem.strip("-")


def load(path: Path) -> Image.Image:
    """Open an image, apply EXIF rotation, and normalise to RGB."""
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    if im.mode not in ("RGB", "L"):
        im = im.convert("RGB")
    return im


def fit(im: Image.Image, edge: int) -> Image.Image:
    """Downscale so the long edge is at most `edge`. Never upscales."""
    if max(im.size) <= edge:
        return im.copy()
    scale = edge / max(im.size)
    size = (max(1, round(im.width * scale)), max(1, round(im.height * scale)))
    return im.resize(size, Image.LANCZOS)


def save_pair(im: Image.Image, out_dir: Path, slug: str) -> int:
    """Write .jpg and .webp variants; return total bytes written."""
    out_dir.mkdir(parents=True, exist_ok=True)
    written = 0
    for ext, opts in ((".jpg", JPEG_OPTS), (".webp", WEBP_OPTS)):
        dest = out_dir / f"{slug}{ext}"
        im.save(dest, **opts)
        written += dest.stat().st_size
    return written


def main() -> None:
    sources = sorted(
        p for p in SRC.iterdir()
        if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png"} and p.name not in SKIP
    )
    if not sources:
        sys.exit(f"No source images found in {SRC}")

    before = after = 0
    for path in sources:
        slug = slugify(path.name)
        original = path.stat().st_size
        before += original

        with load(path) as im:
            if path.name == AVATAR:
                square = ImageOps.fit(im, (AVATAR_EDGE, AVATAR_EDGE), Image.LANCZOS)
                produced = save_pair(square, WEB, slug)
                produced += save_pair(fit(square, 320), THUMBS, slug)
            else:
                produced = save_pair(fit(im, WEB_EDGE), WEB, slug)
                produced += save_pair(fit(im, THUMB_EDGE), THUMBS, slug)

        after += produced
        print(f"  {path.name:26s} {original/1e6:6.2f} MB  ->  {produced/1e6:5.2f} MB   ({slug})")

    print(f"\n{len(sources)} images: {before/1e6:.1f} MB of originals -> {after/1e6:.1f} MB of derivatives")
    print(f"Wrote {WEB.relative_to(ROOT)}/ and {THUMBS.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
