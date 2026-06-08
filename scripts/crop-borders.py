"""
Crop white border strips from render images.
Scans from each edge until the white-pixel fraction drops below 0.50,
which marks the transition from the title/logo border into real render content.
"""
import os
from PIL import Image

ASSETS = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'web')

WHITE_CHANNEL  = 240   # per-channel minimum to count as "white"
CONTENT_THRESH = 0.50  # fraction below which a row is "real content"
MAX_SCAN       = 300   # max pixels to scan from each edge
MIN_STRIP      = 3     # ignore crops smaller than this

EXTS = {'.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'}

def row_white_frac(px, y, w):
    n = sum(1 for x in range(w)
            if px[x, y][0] > WHITE_CHANNEL
            and px[x, y][1] > WHITE_CHANNEL
            and px[x, y][2] > WHITE_CHANNEL)
    return n / w

def col_white_frac(px, x, h):
    n = sum(1 for y in range(h)
            if px[x, y][0] > WHITE_CHANNEL
            and px[x, y][1] > WHITE_CHANNEL
            and px[x, y][2] > WHITE_CHANNEL)
    return n / h

def find_top_crop(px, w, h):
    for y in range(min(MAX_SCAN, h)):
        if row_white_frac(px, y, w) < CONTENT_THRESH:
            return y if y >= MIN_STRIP else 0
    return 0

def find_bottom_crop(px, w, h):
    for y in range(h - 1, max(h - MAX_SCAN, 0), -1):
        if row_white_frac(px, y, w) < CONTENT_THRESH:
            strip = h - 1 - y
            return strip if strip >= MIN_STRIP else 0
    return 0

def find_left_crop(px, w, h):
    for x in range(min(MAX_SCAN, w)):
        if col_white_frac(px, x, h) < CONTENT_THRESH:
            return x if x >= MIN_STRIP else 0
    return 0

def find_right_crop(px, w, h):
    for x in range(w - 1, max(w - MAX_SCAN, 0), -1):
        if col_white_frac(px, x, h) < CONTENT_THRESH:
            strip = w - 1 - x
            return strip if strip >= MIN_STRIP else 0
    return 0

def crop_image(path):
    img = Image.open(path).convert('RGB')
    w, h = img.size
    px = img.load()

    top   = find_top_crop(px, w, h)
    bot   = find_bottom_crop(px, w, h)
    left  = find_left_crop(px, w, h)
    right = find_right_crop(px, w, h)

    if top == 0 and bot == 0 and left == 0 and right == 0:
        return False, 0, 0, 0, 0

    cropped = img.crop((left, top, w - right, h - bot))
    cropped.save(path, quality=95, optimize=True)
    return True, top, bot, left, right

def main():
    changed = 0
    skipped = 0
    for root, dirs, files in os.walk(ASSETS):
        for fname in sorted(files):
            if os.path.splitext(fname)[1] not in EXTS:
                continue
            fpath = os.path.join(root, fname)
            rel   = os.path.relpath(fpath, ASSETS)
            try:
                did_crop, top, bot, left, right = crop_image(fpath)
                if did_crop:
                    print(f'  cropped  {rel}  (top={top} bot={bot} left={left} right={right})')
                    changed += 1
                else:
                    skipped += 1
            except Exception as e:
                print(f'  ERROR    {rel}: {e}')

    print(f'\nDone — {changed} cropped, {skipped} skipped/clean.')

if __name__ == '__main__':
    main()
