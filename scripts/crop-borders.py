"""
Crop white border strips from render images.
Tracks the last white row/col seen from each edge, stopping only when we
exit the white strip into genuine render content. This correctly handles:
  - Deep borders (>300px) on large originals
  - 1-pixel JPEG artifacts at the very edge followed by a white strip
Sketches directories are skipped entirely.
"""
import os
from PIL import Image

ASSETS = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'web')

WHITE_CHANNEL  = 240   # per-channel minimum to count as "white"
CONTENT_THRESH = 0.50  # fraction below which a row/col is real content
MAX_SCAN       = 600   # max pixels to scan from each edge
MIN_STRIP      = 3     # ignore border crops smaller than this

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
    # Track the last row that was part of the white border strip.
    # Only stop when we've moved into real content (frac drops below threshold
    # after having seen at least one white row). This lets a 1-px artifact at
    # the very edge pass through without terminating the scan.
    last_white = -1
    for y in range(min(MAX_SCAN, h)):
        if row_white_frac(px, y, w) >= CONTENT_THRESH:
            last_white = y
        elif last_white >= 0:
            break  # exited the white strip
    return (last_white + 1) if last_white >= MIN_STRIP - 1 else 0

def find_bottom_crop(px, w, h):
    last_white = -1
    for i in range(min(MAX_SCAN, h)):
        y = h - 1 - i
        if row_white_frac(px, y, w) >= CONTENT_THRESH:
            last_white = i
        elif last_white >= 0:
            break
    return (last_white + 1) if last_white >= MIN_STRIP - 1 else 0

def find_left_crop(px, w, h):
    last_white = -1
    for x in range(min(MAX_SCAN, w)):
        if col_white_frac(px, x, h) >= CONTENT_THRESH:
            last_white = x
        elif last_white >= 0:
            break
    return (last_white + 1) if last_white >= MIN_STRIP - 1 else 0

def find_right_crop(px, w, h):
    last_white = -1
    for i in range(min(MAX_SCAN, w)):
        x = w - 1 - i
        if col_white_frac(px, x, h) >= CONTENT_THRESH:
            last_white = i
        elif last_white >= 0:
            break
    return (last_white + 1) if last_white >= MIN_STRIP - 1 else 0

def crop_image(path):
    # Open and convert inside a with-block so the file handle is released
    # before we write back to the same path (avoids silent save failures on Windows).
    with Image.open(path) as raw:
        img = raw.convert('RGB')

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
        # Skip sketches directories
        dirs[:] = [d for d in dirs if 'sketch' not in d.lower()]
        rel_root = os.path.relpath(root, ASSETS)
        if 'sketch' in rel_root.lower():
            continue

        for fname in sorted(files):
            if os.path.splitext(fname)[1] not in EXTS:
                continue
            fpath = os.path.join(root, fname)
            rel   = os.path.relpath(fpath, ASSETS)
            try:
                did_crop, top, bot, left, right = crop_image(fpath)
                if did_crop:
                    print('  cropped  {}  (top={} bot={} left={} right={})'.format(
                        rel, top, bot, left, right))
                    changed += 1
                else:
                    skipped += 1
            except Exception as e:
                print('  ERROR    {}: {}'.format(rel, e))

    print('\nDone - {} cropped, {} skipped/clean.'.format(changed, skipped))

if __name__ == '__main__':
    main()
