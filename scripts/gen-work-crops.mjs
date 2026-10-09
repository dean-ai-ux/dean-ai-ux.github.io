#!/usr/bin/env node
/**
 * One photograph per Prophet role, plus the MadridEasy ad.
 *
 * This script used to slice five horizontal bands out of a single office
 * photograph, because a single office photograph was all there was. The strip
 * read as the same picture five times. There are now four more photographs, of
 * four different rooms, so each role gets its own.
 *
 *   node scripts/gen-work-crops.mjs
 *   SOURCES=/path/to/photos node scripts/gen-work-crops.mjs
 *
 * The originals live outside the repo and are not committed. That is the same
 * arrangement as scripts/gen-ridge.mjs, which reads the Verde checkout through
 * a VERDE env var. Four full-resolution photographs come to roughly 4MB, and
 * the site would carry them in every deploy without ever serving them. What is
 * committed is the crops, so the build never needs this script or the
 * originals to run.
 *
 * Crops are chosen by `window`, a horizontal position from 0 (flush left) to 1
 * (flush right) for the 3:4 slice. Each was picked by rendering all five
 * positions and comparing them, rather than by centring and hoping. These
 * frames run up to 2.02 wide against a card at 0.75, so a crop keeps as little
 * as 37% of the width, and the difference between 0.5 and 0.75 is the
 * difference between having the people in frame and losing them.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES =
  process.env.SOURCES ??
  path.join(os.homedir(), 'Desktop', 'Claude Skills', 'Images for website');

/**
 * Which photograph backs which card, and where the 3:4 window sits.
 *
 * ENTRY_ART in src/App.tsx maps each Prophet role to one of these filenames,
 * so the destination names are load-bearing, and the order here is the order
 * of the strip, newest role first.
 *
 * The rooms alternate cool and warm down the strip. There is no link between a
 * particular room and a particular job, and pretending otherwise would be
 * inventing one.
 */
const CARDS = [
  { out: 'work-1.jpg', src: 'Propheteers_landscape.webp',              window: 0.75,
    note: 'teal sofa, three people; the only window holding the presenter and the seated pair' },
  { out: 'work-2.jpg', src: 'MB20221128_Forge_IMG_4632+(Custom).webp', window: 0.75,
    note: 'red leather lounge; further left, the cast-iron column takes the frame' },
  { out: 'work-3.jpg', src: 'MB20221128_Forge_IMG_4793.webp',          window: 0.75,
    note: 'marble bar, pendant run, tree' },
  { out: 'work-4.jpg', src: 'MB20221128_Forge_IMG_4357.jpg',           window: 1.0,
    note: 'fanned ceiling and orange chairs, the most unmistakable of the four' },
];

const missing = CARDS.filter((c) => !fs.existsSync(path.join(SOURCES, c.src)));
if (missing.length) {
  console.error(`Sources not found in ${SOURCES}:`);
  for (const m of missing) console.error(`  ${m.src}`);
  console.error('Set SOURCES=/path/to/photos. The committed work-*.jpg still build without them.');
  process.exit(1);
}

/* Pillow does the pixels; node just drives it. exif_transpose on every source
   because a photo off a phone can report landscape while displaying portrait,
   and cropping the raw pixels then cuts the wrong axis. */
const py = `
from PIL import Image, ImageOps
from pathlib import Path
import json

root = Path(${JSON.stringify(root)})
sources = Path(${JSON.stringify(SOURCES)})
cards = json.loads(${JSON.stringify(JSON.stringify(CARDS))})

AR = 0.75              # the card's proportion, and the tightest of the three
                       # boxes this art has to fill. The overlay asks for 4:3
                       # and for a square, and both take the middle of this.
# Measured, not guessed: the card tops out at 320 CSS px (1920 viewport) and the
# overlay image at 320x320, so 320 is the largest this art is ever drawn. 720
# covers that to 2.25x device pixel ratio, and to 3x on a phone, where the card
# measures 240. Going wider only enlarges work-1, whose source is 901px tall.
OUT_W, OUT_H = 720, 960
out = []

def save(im, dest):
    im.resize((OUT_W, OUT_H), Image.LANCZOS).save(
        root / 'public/media' / dest, quality=86, optimize=True)

for c in cards:
    im = ImageOps.exif_transpose(Image.open(sources / c['src'])).convert('RGB')
    W, H = im.size
    cw = round(H * AR)
    if cw <= W:
        ch = H
    else:                                  # taller than 3:4, so bound by width
        cw, ch = W, round(W / AR)
    x = round((W - cw) * c['window'])
    y = (H - ch) // 2
    save(im.crop((x, y, x + cw, y + ch)), c['out'])
    out.append({'file': c['out'], 'src': c['src'],
                'crop': f'{cw}x{ch} at x={x} of {W}x{H}',
                'upscaled': cw < OUT_W})

# The fifth card keeps the atrium, the one room the four new photographs do not
# cover. It sits last in the strip because the Work section banner is this same
# photograph, and the fifth card is the one usually scrolled off-screen.
office = ImageOps.exif_transpose(Image.open(root / 'public/media/work.jpg')).convert('RGB')
W, H = office.size
cw = min(W, round(H * AR)); ch = round(cw / AR)
x = (W - cw) // 2
y = round((H - ch) * 0.25)                 # the tree and the globe pendants
save(office.crop((x, y, x + cw, y + ch)), 'work-5.jpg')
out.append({'file': 'work-5.jpg', 'src': 'work.jpg (atrium)',
            'crop': f'{cw}x{ch} at y={y} of {W}x{H}', 'upscaled': cw < OUT_W})

# MadridEasy, unchanged. The two figures sit in the middle of a very tall frame,
# and a centred cover crop would take the Instagram overlay above them and the
# floor below.
ad = ImageOps.exif_transpose(Image.open(root / 'public/media/madrideasy.jpg')).convert('RGB')
AW, AH = ad.size
band_h = round(AW / AR)
top = min(round(AH * 0.20), AH - band_h)
save(ad.crop((0, top, AW, top + band_h)), 'work-madrideasy.jpg')
out.append({'file': 'work-madrideasy.jpg', 'src': 'madrideasy.jpg',
            'crop': f'{AW}x{band_h} at y={top} of {AW}x{AH}', 'upscaled': AW < OUT_W})

print(json.dumps(out, indent=2))
`;

const crops = JSON.parse(execFileSync('python3', ['-c', py], { encoding: 'utf8' }));
let enlarged = 0;
for (const c of crops) {
  if (c.upscaled) enlarged++;
  console.log(`  ${c.file.padEnd(22)} ${c.src.padEnd(42)} ${c.crop}${c.upscaled ? '  UPSCALED' : ''}`);
}
console.log(
  enlarged
    ? `\n  ${enlarged} crop(s) narrower than 720px and enlarged to fit. Check sharpness.`
    : `\n  ${crops.length} crops, none enlarged.`,
);
