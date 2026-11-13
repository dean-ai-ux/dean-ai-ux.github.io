#!/usr/bin/env node
/**
 * Replays what a phone visitor does, against a build, and fails if any of it
 * goes wrong.
 *
 *   npm run build && npm run check:mobile
 *   CHROME=/path/to/chrome npm run check:mobile
 *
 * It serves dist/ itself and drives the Chrome already on this machine through
 * playwright-core, so there is no browser download. It is not run in CI.
 *
 * What it checks, and why each one is here:
 *
 *   layout      every section at 360, 390 and 430 wide and a phone held
 *               sideways: nothing wider than the screen, no text under 13px,
 *               nothing tappable under 44px.
 *   landing     a section opened from a tile, or from the menu, after
 *               scrolling: its header must be on screen. The landing's scroll
 *               used to carry over and open sections halfway down.
 *   back        Back from a section returns the landing to where it was.
 *   swipe       two real touch swipes on Work each settle with a card on the
 *               left edge. The snap was on an element that does not scroll.
 *   panel       an open panel holds the page behind still, and Back closes it
 *               without leaving the section.
 *   links       every entry has an address. Opening one writes it, loading it
 *               opens that entry, and closing a linked entry leaves the section.
 *               A link to a writing piece used to open Writing and stop there.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('No dist/. Run `npm run build` first.');
  process.exit(1);
}
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4',
  '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(root, url === '/' ? 'index.html' : url);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  const data = fs.readFileSync(file);
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = Number(range[1] || 0), end = range[2] ? Number(range[2]) : data.length - 1;
    res.writeHead(206, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'Content-Range': `bytes ${start}-${end}/${data.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    return res.end(data.subarray(start, end + 1));
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Accept-Ranges': 'bytes' });
  res.end(data);
});
await new Promise((r) => server.listen(0, r));
const U = `http://localhost:${server.address().port}/`;

const SECTIONS = ['home', 'work', 'education', 'built', 'writing'];
const failures = [];
const fail = (where, what) => failures.push(`${where}: ${what}`);
const phone = (width, height) => ({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
const settle = (p, ms = 700) => p.waitForTimeout(ms);

/** Measured in the page: overflow, small text, small targets. */
const probe = () => {
  const vw = innerWidth;
  const visible = (e) => {
    const b = e.getBoundingClientRect(), cs = getComputedStyle(e);
    return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && !e.closest('[aria-hidden=true]');
  };
  const wide = [...document.querySelectorAll('body *')]
    .filter((e) => visible(e) && e.getBoundingClientRect().right > vw + 1 && !e.closest('.overflow-x-auto'))
    .map((e) => e.tagName.toLowerCase());
  const tiny = [...new Set([...document.querySelectorAll('body *')]
    .filter((e) => visible(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
      && parseFloat(getComputedStyle(e).fontSize) < 13)
    .map((e) => `${getComputedStyle(e).fontSize} "${e.textContent.trim().slice(0, 24)}"`))];
  /* Links inside running text are exempt: a word in a sentence cannot be 44px. */
  const small = [...new Set([...document.querySelectorAll('a,button,[role=button]')]
    .filter((e) => visible(e) && !e.closest('p,li'))
    .filter((e) => { const b = e.getBoundingClientRect(); return b.height < 44 || b.width < 44; })
    .map((e) => `"${(e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 24)}" ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`))];
  return { scrollWidth: document.documentElement.scrollWidth, wide: wide.length, tiny, small };
};

/** Is the open section's header on screen, below the 64px bar? */
const headerOnScreen = (p) => p.evaluate(() => {
  const h = document.querySelector('section h1, h1');
  if (!h) return false;
  const b = h.getBoundingClientRect();
  return b.top >= 60 && b.bottom <= innerHeight;
});

const browser = await chromium.launch({ executablePath: CHROME });
try {
  /* layout */
  for (const [name, w, h] of [['360', 360, 740], ['390', 390, 844], ['430', 430, 932], ['landscape', 844, 390]]) {
    const ctx = await browser.newContext(phone(w, h));
    const p = await ctx.newPage();
    for (const s of SECTIONS) {
      await p.goto(`${U}#${s}`); await settle(p);
      const r = await p.evaluate(probe);
      const where = `layout ${name} #${s}`;
      if (r.scrollWidth > w) fail(where, `page is ${r.scrollWidth}px wide`);
      if (r.wide) fail(where, `${r.wide} elements past the right edge`);
      if (r.tiny.length) fail(where, `text under 13px: ${r.tiny.slice(0, 3).join(', ')}`);
      if (r.small.length) fail(where, `targets under 44px: ${r.small.slice(0, 3).join(', ')}`);
    }
    await ctx.close();
  }

  const ctx = await browser.newContext(phone(390, 844));
  const p = await ctx.newPage();

  /* landing: from a tile, after scrolling to it */
  for (const t of ['Work', 'Education', 'Built', 'Writing']) {
    await p.goto(`${U}#home`); await settle(p);
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await settle(p, 300);
    const tile = p.locator(`button[aria-label="${t}"]`).first();
    await tile.scrollIntoViewIfNeeded(); await settle(p, 200);
    const fromY = await p.evaluate(() => scrollY);
    await tile.tap(); await settle(p);
    if (!(await headerOnScreen(p))) fail(`landing ${t}`, `tile tapped at scrollY ${fromY}, header not on screen`);

    /* back: to where the landing was */
    await p.goBack(); await settle(p);
    const backY = await p.evaluate(() => scrollY);
    if (Math.abs(backY - fromY) > 4) fail(`back ${t}`, `landing returned at ${backY}, left from ${fromY}`);
  }

  /* landing: from the menu, scrolled down another section */
  await p.goto(`${U}#built`); await settle(p);
  await p.evaluate(() => scrollTo(0, 1500)); await settle(p, 300);
  await p.tap('button[aria-label=Menu]'); await settle(p, 300);
  await p.tap('#site-menu >> text=Work'); await settle(p);
  if (!(await headerOnScreen(p))) fail('landing menu', 'Work from the menu, header not on screen');

  /* swipe */
  await p.goto(`${U}#work`); await settle(p, 1200);
  const cdp = await ctx.newCDPSession(p);
  const card = await p.evaluate(() => {
    const row = document.querySelector('[aria-label^="Work history"] > div');
    const b = row.children[0].getBoundingClientRect();
    return { y: b.top + b.height / 2 };
  });
  for (let n = 1; n <= 2; n++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 330, y: card.y }] });
    for (let i = 1; i <= 12; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 330 - 200 * i / 12, y: card.y }] });
      await settle(p, 16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await settle(p, 1200);
    const aligned = await p.evaluate(() => {
      const sc = document.querySelector('[aria-label^="Work history"]');
      const left = sc.getBoundingClientRect().left;
      return [...sc.firstElementChild.children].some((c) => Math.abs(c.getBoundingClientRect().left - left) <= 2);
    });
    if (!aligned) fail(`swipe ${n}`, 'no card on the left edge after the swipe');
  }

  /* panel */
  await p.goto(`${U}#education`); await settle(p);
  await p.getByText('Spanish Teaching Assistant').first().tap(); await settle(p);
  if (!(await p.$('[role=dialog]'))) fail('panel', 'did not open');
  const behind = await p.evaluate(() => { const y = scrollY; scrollTo(0, y + 300); return [y, scrollY, document.body.style.overflow]; });
  if (behind[2] !== 'hidden') fail('panel', 'page behind is not locked');
  await p.goBack(); await settle(p);
  const after = await p.evaluate(() => ({ open: !!document.querySelector('[role=dialog]'), hash: location.hash, locked: document.body.style.overflow }));
  if (after.open) fail('panel', 'Back did not close it');
  if (after.hash !== '#education') fail('panel', `Back left the section, now at ${after.hash}`);
  if (after.locked === 'hidden') fail('panel', 'page still locked after closing');

  /* links: opening writes the address */
  await p.goto(`${U}#writing`); await settle(p);
  await p.locator('main button, section button').filter({ hasText: 'Software Isn' }).first().tap(); await settle(p);
  const opened = await p.evaluate(() => location.hash);
  if (opened !== '#writing/many-heads') fail('links', `opening Many Heads wrote ${opened}`);

  /* links: loading an address opens it, for every entry in every section */
  const content = (f) => JSON.parse(fs.readFileSync(path.join(root, '..', 'src', 'content', f), 'utf8'));
  const links = [
    ...content('work.json').map((e) => `#work/${e.id}`),
    ...content('education.json').map((e) => `#education/${e.id}`),
    ...content('projects.json').filter((e) => !e.placeholder).map((e) => `#built/${e.id}`),
    ...content('writing.json').filter((e) => !e.hidden).map((e) => `#writing/${e.id}`),
    '#about',
  ];
  for (const hash of links) {
    await p.goto(`${U}${hash}`); await p.reload(); await settle(p, 500);
    if (!(await p.$('[role=dialog]'))) fail('links', `${hash} did not open its entry`);
  }

  /* links: closing a linked entry leaves the section, not the site */
  await p.goto(`${U}#writing/ai-and-crypto`); await p.reload(); await settle(p);
  await p.tap('button[aria-label=Close]'); await settle(p);
  const closed = await p.evaluate(() => ({ open: !!document.querySelector('[role=dialog]'), hash: location.hash }));
  if (closed.open || closed.hash !== '#writing') fail('links', `closing a linked piece left ${closed.hash}, open ${closed.open}`);

  await ctx.close();
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(`check:mobile found ${failures.length} problem${failures.length === 1 ? '' : 's'}:`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log('check:mobile passed: layout at 4 sizes, landing, back, swipe, panel, links');
