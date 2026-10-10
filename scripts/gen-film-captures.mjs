#!/usr/bin/env node
/**
 * Photograph the real product for the film.
 *
 * The first cut showed photographs of offices and four project marks, and never
 * once showed the thing Dean actually made. These captures fix that: the live
 * site and the Fed Chair game, caught full page so the film can scroll them.
 *
 *   npm run build && node scripts/gen-film-captures.mjs
 *
 * Stills, not video. A tall screenshot translated upward reads as a scroll,
 * stays perfectly sharp at any output resolution, and needs no video pipeline,
 * no Playwright and no second encoder. It also means the film's "footage" is
 * deterministic: the same build always produces the same frames.
 *
 * Captures the local `dist/` rather than the deployed site, so what the film
 * shows is the build sitting in the working tree. Run `npm run build` first.
 * Committed output, like the other generators.
 */
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'public/media');
const PORT = 4890;
const CDP = 9390;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
/* Wide enough for the 1180px window in a 1920 frame with headroom, small
   enough that Remotion decodes it without hitting its 30s <Img> timeout. */
const MAX_W = 1600;

if (!fs.existsSync(path.join(root, 'dist/index.html'))) {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

/* Each shot: where to go, how wide, and how tall a slice to keep.
   `full` captures beyond the viewport, which is what makes the scroll possible. */
const SHOTS = [
  { out: 'film-site.jpg', url: '/', width: 1280, height: 800, full: true,
    note: 'the landing page, full height, for the scroll' },
  { out: 'film-work.jpg', url: '/#work', width: 1280, height: 860, full: false,
    note: 'the work strip, one screen' },
  { out: 'film-built.jpg', url: '/#built', width: 1280, height: 860, full: false,
    note: 'the built section, one screen' },
  { out: 'film-game.jpg', url: '/media/fed-chair-for-a-year.html', width: 1280, height: 860,
    full: false, note: 'Fed Chair for a Year, running' },
  /* The portrait cut shows the site as a phone sees it, not the desktop page
     squeezed into a tall window. */
  { out: 'film-site-mobile.jpg', url: '/', width: 430, height: 932, full: true, mobile: true,
    note: 'the landing page at phone width, for the portrait cut' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT),
  '--strictPort'], { cwd: root, stdio: 'ignore' });
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${CDP}`, '--disable-gpu', '--hide-scrollbars',
  `--user-data-dir=${path.join(root, 'node_modules/.cache/film-capture')}`, 'about:blank',
], { stdio: 'ignore' });

const stop = () => { try { server.kill(); } catch { /* */ } try { chrome.kill(); } catch { /* */ } };
process.on('exit', stop);
process.on('SIGINT', () => { stop(); process.exit(1); });

const waitFor = async (probe, tries = 60) => {
  for (let i = 0; i < tries; i++) {
    try { if (await probe()) return true; } catch { /* not up yet */ }
    await sleep(250);
  }
  return false;
};

const ok = await waitFor(async () =>
  (await fetch(`http://127.0.0.1:${PORT}/`)).ok);
const cdpUp = await waitFor(async () =>
  (await fetch(`http://127.0.0.1:${CDP}/json/version`)).ok);
if (!ok || !cdpUp) { console.error('preview or Chrome did not start'); stop(); process.exit(1); }

const tab = await (await fetch(`http://127.0.0.1:${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) {
    const p = pending.get(d.id); pending.delete(d.id);
    d.error ? p.rej(new Error(d.error.message)) : p.res(d.result);
  }
};
await new Promise((r) => { ws.onopen = r; });
await send('Page.enable');
await send('Runtime.enable');

/* Mark the intro as already seen before any document runs. Without this the
   capture photographs the intro overlay playing over the page, and the film
   ends up containing a recording of itself. */
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try { sessionStorage.setItem('verdevista:intro-seen','1'); } catch (e) {}`,
});

const results = [];
for (const shot of SHOTS) {
  await send('Emulation.setDeviceMetricsOverride', {
    width: shot.width, height: shot.height, deviceScaleFactor: shot.mobile ? 3 : 2, mobile: !!shot.mobile,
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${shot.url}` });
  /* Long enough for the webfont, the images and framer's entrances. Entrances
     photographed mid-flight are the classic way to capture a page at opacity 0. */
  await sleep(3200);
  const { data } = await send('Page.captureScreenshot', {
    format: 'jpeg', quality: 88, captureBeyondViewport: shot.full,
  });
  const file = path.join(OUT, shot.out);
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
  /* Captured at deviceScaleFactor 2 for sharp text, then brought down to
     MAX_W. The full-size grabs are 2560px wide against a window 1180px wide in
     a 1920 frame, which is 2.2x more pixels than can ever be seen. Left at full
     size they also broke the render: Remotion's <Img> timed out after 30s
     decoding a 6 megapixel JPEG on every one of the parallel render tabs. */
  execFileSync('python3', ['-c', `
from PIL import Image
im = Image.open(r'${file}')
if im.width > ${MAX_W}:
    im = im.resize((${MAX_W}, round(im.height * ${MAX_W} / im.width)), Image.LANCZOS)
    im.convert('RGB').save(r'${file}', quality=88, optimize=True)
`]);
  const bytes = fs.statSync(file).size;
  results.push({ ...shot, bytes });
}
ws.close();
stop();

/* Report the pixel dimensions, because the film's scroll maths depends on the
   aspect of the tall capture and a silent change there would break a shot. */
for (const r of results) {
  let dims = '';
  try {
    dims = execFileSync('python3', ['-c',
      `from PIL import Image; im=Image.open(r'${path.join(OUT, r.out)}'); print(f'{im.size[0]}x{im.size[1]}')`],
      { encoding: 'utf8' }).trim();
  } catch { dims = 'unknown'; }
  console.log(`  ${r.out.padEnd(20)} ${dims.padEnd(12)} ${(r.bytes / 1024).toFixed(0).padStart(5)}KB  ${r.note}`);
}
