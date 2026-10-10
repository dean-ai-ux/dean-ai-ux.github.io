import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame } from 'remotion';
import { Glass, Rect } from '../glass';
import { Box } from '../diagram';
import { UnemploymentChart } from '../chart';
import { DarkGround, PhotoGround } from '../light';
import { ease, ramp, springs } from '../motion';
import { dim, useOrientation, useType } from '../layout';
import { Eyebrow } from './kit';
import projects from '../../src/content/projects.json';
import education from '../../src/content/education.json';

const pop = (frame: number, delay: number, cfg: keyof typeof springs = 'pop') =>
  spring({ frame: frame - delay, fps: 30, config: springs[cfg] });

const Lines: React.FC<{ lines: string[]; style: React.CSSProperties }> = ({ lines, style }) => (
  <div style={style}>
    {lines.map((l) => (
      <div key={l}>{l}</div>
    ))}
  </div>
);

/* ---------------------------------------------------------------- shot 7 ---
   "forward guidance works only when paired with explicit thresholds"
   (about.json), above the FOMC's December 2012 thresholds and what unemployment
   did next. See chart.tsx for why no rate rise is drawn. */
export const ShotGuidance: React.FC = () => {
  const frame = useCurrentFrame();
  const { portrait } = useOrientation();
  const t = useType();
  const ground = <DarkGround />;

  const head = ramp(frame, [0, 14], [0, 1], ease.enter);
  const panel = pop(frame, 6, 'glide');
  const furniture = ramp(frame, [16, 30], [0, 1], ease.enter);
  const line = ramp(frame, [18, 62], [0, 1], ease.inOut);
  const markers: [number, number] = [ramp(frame, [22, 34], [0, 1], ease.enter), ramp(frame, [52, 64], [0, 1], ease.enter)];
  const source = ramp(frame, [40, 54], [0, 1], ease.enter);

  const P: Rect = portrait ? { x: 50, y: 640, w: 980, h: 1040 } : { x: 120, y: 330, w: 1680, h: 620 };

  return (
    <AbsoluteFill>
      {ground}
      <Eyebrow>On policy</Eyebrow>
      <Lines
        lines={portrait ? ['Forward guidance works', 'only with explicit', 'thresholds.'] : ['Forward guidance works only', 'with explicit thresholds.']}
        style={{ position: 'absolute', left: portrait ? 80 : 120, top: portrait ? 260 : 150, ...t.title, fontSize: portrait ? 76 : 64, opacity: head }}
      />
      <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, panel * 1.4) }}>
        <Glass rect={{ ...P, y: P.y + (1 - panel) * 40 }} radius={36} backdrop={ground} sheen={0.25} tint={0.05}>
          <UnemploymentChart
            width={P.w}
            height={P.h}
            line={line}
            furniture={furniture}
            markers={markers}
            type={{ small: t.small, body: t.body }}
            compact={portrait}
          />
        </Glass>
      </div>
      <div
        style={{
          position: 'absolute',
          left: portrait ? 80 : 120,
          right: portrait ? 80 : undefined,
          top: P.y + P.h + 26,
          ...t.small,
          color: dim(0.45 * source),
        }}
      >
        Unemployment: BLS via FRED. Thresholds: FOMC statements.
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- shot 8 ---
   The proof: he built a monetary policy simulator. Its real interface, with its
   charts, captured from the live build. */
type Project = { id: string; org: string; role: string };
const FED = (projects as Project[]).find((p) => p.id === 'fed-chair-for-a-year')!;

export const ShotGame: React.FC = () => {
  const frame = useCurrentFrame();
  const { portrait } = useOrientation();
  const t = useType();
  const ground = <DarkGround />;
  const text = ramp(frame, [0, 12], [0, 1], ease.enter);
  const win = pop(frame, 4, 'glide');
  const W: Rect = portrait ? { x: 60, y: 660, w: 960, h: 700 } : { x: 700, y: 230, w: 1100, h: 740 };

  return (
    <AbsoluteFill>
      {ground}
      <Eyebrow>On policy</Eyebrow>
      <div style={{ position: 'absolute', left: portrait ? 80 : 120, top: portrait ? 260 : 330, width: portrait ? 920 : 520, opacity: text }}>
        <div style={{ ...t.display, fontSize: portrait ? 104 : 96 }}>{FED.org}</div>
        <div style={{ ...t.body, color: dim(0.62), marginTop: 22 }}>{FED.role}</div>
      </div>
      <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, win * 1.4) }}>
        <Glass rect={{ ...W, y: W.y + (1 - win) * 60 }} radius={30} backdrop={ground} sheen={0.25}>
          <div style={{ height: 54, display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px' }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <span key={c} style={{ width: 13, height: 13, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <div style={{ position: 'absolute', left: 10, right: 10, top: 54, bottom: 10, borderRadius: 18, overflow: 'hidden', background: '#fff' }}>
            <Img src={staticFile('media/film-game.jpg')} style={{ width: '100%', display: 'block', transform: `translateY(${-ramp(frame, [10, 48], [0, 40], ease.inOut)}px)` }} />
          </div>
        </Glass>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- shot 9 ---
   "The inaugural team placed in the top 15% of 120 participating institutions"
   and "Prof. Stroup formalized the effort as ECO 386, a permanent economics
   department course" (education.json); "co-authored a paper on adapting
   rules-based policy to crisis intervention" (about.json).
   120 dots, the top 15% band lit. The band, not a rank: the content states
   the band and nothing finer. */
type Edu = { id: string; outcomes?: { claim: string }[] };
const fed = (education as Edu[]).find((e) => e.id === 'davidson-fed-challenge');
const TOTAL = 120;
const TOP = Math.round(TOTAL * 0.15); // 18
const STATED = !!fed?.outcomes?.some((o) => /top 15%/i.test(o.claim) && /120/.test(o.claim));

export const ShotDavidson: React.FC = () => {
  const frame = useCurrentFrame();
  const { portrait } = useOrientation();
  const t = useType();
  /* Dimmed further than elsewhere: this shot carries a grid of 120 dots and
     two cards, and at 0.8 the faces behind competed with all of it. */
  const ground = <PhotoGround src="media/fed-challenge.jpg" dim={0.88} push={1} />;

  const COLS = 12;
  const D = portrait ? 50 : 36;
  const G = portrait ? 22 : 16;
  const gx = portrait ? (1080 - (COLS * (D + G) - G)) / 2 : 120;
  const gy = portrait ? 300 : 330;
  const lit = ramp(frame, [18, 30], [0, 1], ease.enter);
  const cap = ramp(frame, [24, 36], [0, 1], ease.enter);

  const F1: Rect = portrait ? { x: 80, y: 1150, w: 920, h: 250 } : { x: 900, y: 360, w: 900, h: 230 };
  const F2: Rect = portrait ? { x: 80, y: 1440, w: 920, h: 170 } : { x: 900, y: 630, w: 900, h: 150 };

  return (
    <AbsoluteFill>
      {ground}
      <Eyebrow>At Davidson</Eyebrow>
      {STATED &&
        Array.from({ length: TOTAL }, (_, i) => {
          const r = Math.floor(i / COLS);
          const c = i % COLS;
          const a = ramp(frame - 2 - i * 0.15, [0, 8], [0, 1], ease.enter);
          const top = i < TOP;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: gx + c * (D + G),
                top: gy + r * (D + G),
                width: D,
                height: D,
                borderRadius: '50%',
                opacity: a,
                background: top ? `rgba(226,184,113,${0.25 + 0.75 * lit})` : 'rgba(255,255,255,0.18)',
                boxShadow: top ? `0 0 ${18 * lit}px rgba(226,184,113,${0.7 * lit})` : 'none',
              }}
            />
          );
        })}
      {STATED && (
        <div style={{ position: 'absolute', left: portrait ? 80 : 120, right: portrait ? 80 : undefined, top: gy + 10 * (D + G) + 10, ...t.title, opacity: cap }}>
          <span style={{ color: '#E2B871' }}>Top 15%</span> of 120 institutions
        </div>
      )}
      <Box rect={F1} backdrop={ground} textStyle={{ ...t.body, fontWeight: 650 }} appear={pop(frame, 14)} radius={36} align="left">
        Fed Challenge, now ECO 386, a permanent course
      </Box>
      <Box rect={F2} backdrop={ground} textStyle={{ ...t.body, fontWeight: 650 }} appear={pop(frame, 20)} radius={36} align="left">
        Co-authored paper on rules-based policy
      </Box>
    </AbsoluteFill>
  );
};
