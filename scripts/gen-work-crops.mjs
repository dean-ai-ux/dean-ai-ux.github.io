#!/usr/bin/env node
/**
 * Five bands of one office, and one crop of the MadridEasy ad.
 *
 * Five Prophet roles share a single photograph. Printing it five times reads as
 * a mistake, and `object-position` cannot help: the source is 933x1400 (0.667)
 * against a card near 0.75, so object-cover crops about 11% of the height and
 * every value from top to bottom lands on the same picture. Real crops are the
 * only way to get five different views, and this photo earns it — skylight,
 * then the tree and the pendants, then windows and desks, then the sofas.
 *
 *   node scripts/gen-work-crops.mjs
 *
 * Committed output, like scripts/gen-app-icons.mjs: the app ships the JPEGs and
 * the build never needs this to run.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Pillow does the pixels; node just drives it. exif_transpose on every source
   because a photo off a phone can report landscape while displaying portrait,
   and cropping the raw pixels then cuts the wrong axis. */
const py = `
from PIL import Image, ImageOps
from pathlib import Path
import json

root = Path(${JSON.stringify(root)})
out = []

office = ImageOps.exif_transpose(Image.open(root / 'public/media/work.jpg')).convert('RGB')
W, H = office.size
CW, CH = 600, 800                      # the card's proportion, 0.75
x0 = (W - CW) // 2
# Walk the frame top to bottom. The last band starts at H-CH so nothing falls
# off the bottom edge; the five are spaced across whatever travel remains.
last = H - CH
for i in range(5):
    y = round(last * i / 4)
    office.crop((x0, y, x0 + CW, y + CH)).resize((720, 960), Image.LANCZOS) \\
        .save(root / f'public/media/work-{i+1}.jpg', quality=86, optimize=True)
    out.append({'file': f'work-{i+1}.jpg', 'band': f'y {y}..{y+CH} of {H}'})

ad = ImageOps.exif_transpose(Image.open(root / 'public/media/madrideasy.jpg')).convert('RGB')
AW, AH = ad.size
# The two figures occupy the middle of a very tall frame; a centred cover crop
# would take the Instagram overlay above them and the floor below.
band_h = round(AW / 0.75)
top = round(AH * 0.20)
top = min(top, AH - band_h)
ad.crop((0, top, AW, top + band_h)).resize((720, 960), Image.LANCZOS) \\
    .save(root / 'public/media/work-madrideasy.jpg', quality=86, optimize=True)
out.append({'file': 'work-madrideasy.jpg', 'band': f'y {top}..{top+band_h} of {AH}'})

print(json.dumps(out, indent=2))
`;

const result = execFileSync('python3', ['-c', py], { encoding: 'utf8' });
for (const c of JSON.parse(result)) console.log(`  ${c.file.padEnd(22)} ${c.band}`);
