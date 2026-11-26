"""Mechanical icon packaging for the MOM's suite (resize + pad only; no redraws).
Run: python tools/gen_suite_icons.py [--sheet OUT.png]   (--sheet renders the current maskable icons under circle and squircle masks on light and dark; rows: light circle, light squircle, dark circle, dark squircle)
Sources are the verified existing logos listed in docs/moms-suite/APP_MAP.md.
"any" icons: artwork bbox fitted into 90% of the canvas. maskable: bbox diagonal inside the 80%-diameter safe circle."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'docs/moms-suite/sources'
# app dir -> (source, canvas background, extra files)
JOBS = {
    'apps/jump': (SRC / 'dr-girlfriend-mark-1024.png', (255, 249, 230), {}),
    'apps/hand': (ROOT / 'tv/assets/helping-hand-badge.png', (100, 39, 165), {}),
    'apps/alarm': (SRC / '2048-stage1-7636.png', (0, 0, 0), {}),
    'little-boyfriend/app/icons': (SRC / 'lil-boyfriend-mark-1024.png', (255, 249, 230), {'apple-touch-icon-180.png': 180}),
}


def render(src, bg, size, safe):
    art = Image.open(src).convert('RGBA')
    art = art.crop(art.getbbox())
    w, h = art.size
    # any: fit 90% of the canvas. maskable: the bbox diagonal fits an 80%-diameter circle.
    limit = size * 0.8 / (w * w + h * h) ** 0.5 if safe else size * 0.9 / max(w, h)
    art = art.resize((max(1, round(w * limit)), max(1, round(h * limit))), Image.LANCZOS)
    out = Image.new('RGB', (size, size), bg)
    out.paste(art, ((size - art.width) // 2, (size - art.height) // 2), art)
    return out


def sheet(out):
    jobs = [(k, ROOT / k) for k in JOBS] + [(a, ROOT / 'apps' / a) for a in ('corgi', 'fuel', 'misinformation')]
    cell, pad = 150, 10
    img = Image.new('RGB', (len(jobs) * (cell + pad) + pad, 4 * (cell + pad) + pad), (128, 128, 128))
    for col, (name, d) in enumerate(jobs):
        m = d / ('maskable-512.png' if (d / 'maskable-512.png').exists() else 'icon-maskable-512.png')
        for row, (bgc, circle, icon) in enumerate([((245, 245, 245), True, m), ((245, 245, 245), False, m), ((24, 24, 28), True, m), ((24, 24, 28), False, m)]):
            tile = Image.new('RGB', (cell, cell), bgc)
            a = Image.open(icon).convert('RGB').resize((cell, cell), Image.LANCZOS)
            mask = Image.new('L', (cell, cell), 0)
            ImageDraw.Draw(mask).ellipse((0, 0, cell - 1, cell - 1), fill=255) if circle else ImageDraw.Draw(mask).rounded_rectangle((0, 0, cell - 1, cell - 1), radius=cell // 4, fill=255)
            tile.paste(a, (0, 0), mask)
            img.paste(tile, (pad + col * (cell + pad), pad + row * (cell + pad)))
    img.save(out)
    print('sheet', out, '')


def main():
    if '--sheet' in sys.argv:
        return sheet(sys.argv[sys.argv.index('--sheet') + 1])
    for d, (src, bg, extra) in JOBS.items():
        out = ROOT / d
        maskable = 'maskable-512.png' if d.startswith('little') else 'icon-maskable-512.png'
        for name, size, safe in [('icon-192.png', 192, False), ('icon-512.png', 512, False), (maskable, 512, True)] + [(n, s, False) for n, s in extra.items()]:
            render(src, bg, size, safe).save(out / name, optimize=True)
            print('wrote', d, name)


if __name__ == '__main__':
    main()
