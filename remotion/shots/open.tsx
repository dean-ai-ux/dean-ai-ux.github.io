import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame } from 'remotion';
import { Glass } from '../glass';
import { DarkGround, Sweep } from '../light';
import { ease, ramp, springs } from '../motion';
import { dim, useOrientation, useType } from '../layout';
import { verde } from '../theme';
import { Eyebrow, useWidths } from './kit';
import { Tile } from './tile';
import work from '../../src/content/work.json';

type Role = { role: string; org: string; end: string | null; start: string };
/* The current role, newest first in work.json. */
const NOW = (work as Role[])[0];

/* ---------------------------------------------------------------- shot 1 ---
   His name on glass, and who he is, so the film never opens on an unknown. */
export const ShotOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { portrait, cx, cy } = useOrientation();
  const t = useType();
  const p = spring({ frame: frame - 4, fps: 30, config: springs.pop });
  const bloom = ramp(frame, [0, 30], [0, 1], ease.enter);
  const sub = ramp(frame, [18, 36], [0, 1], ease.enter);
  const nameStyle = { ...t.title, fontSize: portrait ? 76 : 68 };
  const m = useWidths(['Dean Dowling'], nameStyle);

  const ground = <DarkGround glows={[{ x: 50, y: 50, r: portrait ? 0.5 : 0.32, color: verde.sage, alpha: 0.75 * bloom }]} />;
  const W = m.get(0, 68) + (portrait ? 140 : 130);
  const H = portrait ? 170 : 150;
  const scale = 0.55 + 0.45 * p;

  return (
    <AbsoluteFill>
      {m.probe}
      {ground}
      <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, p * 1.5), transform: `scale(${scale})`, transformOrigin: `${cx}px ${cy}px` }}>
        <Glass rect={{ x: cx - W / 2, y: cy - H / 2 - 40, w: W, h: H }} radius={H / 2} backdrop={ground} sheen={0.2 + p * 0.3}>
          <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <span style={nameStyle}>Dean Dowling</span>
          </AbsoluteFill>
          <Sweep progress={ramp(frame, [16, 46], [0, 1], ease.inOut)} strength={0.4} />
        </Glass>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: cy + H / 2,
          textAlign: 'center',
          ...t.body,
          color: dim(0.7 * sub),
          transform: `translateY(${(1 - sub) * 14}px)`,
        }}
      >
        {NOW.role}, {NOW.org}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- shot 2 ---
   "what separates useful AI from merely impressive AI" (about.json), posed as
   the question it answers. The first cut showed only "Merely impressive." then
   "Useful.", which had no subject and staged a distinction as a progression. */
export const ShotQuestion: React.FC = () => {
  const frame = useCurrentFrame();
  const { portrait } = useOrientation();
  const t = useType();
  /* Each word carries its own weight: "merely impressive AI?" is held back, so
     the distinction is made by the type itself rather than by a caption. */
  const W = (text: string, held = false) => ({ text, held });
  const lines = portrait
    ? [[W('What'), W('separates')], [W('useful'), W('AI')], [W('from'), W('merely', true)], [W('impressive', true), W('AI?', true)]]
    : [[W('What'), W('separates'), W('useful'), W('AI')], [W('from'), W('merely', true), W('impressive', true), W('AI?', true)]];
  let n = 0;
  return (
    <AbsoluteFill>
      <DarkGround />
      <Eyebrow appear={ramp(frame, [0, 14], [0, 1], ease.enter)}>On AI</Eyebrow>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: portrait ? 'flex-start' : 'center', padding: portrait ? '0 80px' : 0 }}>
        <div style={{ ...t.display, fontSize: portrait ? 104 : 108, textAlign: portrait ? 'left' : 'center' }}>
          {lines.map((ln, li) => (
            <div key={li}>
              {ln.map((w, wi) => {
                const k = n++;
                const o = ramp(frame - 6 - k * 4, [0, 12], [0, 1], ease.enter);
                return (
                  <span key={wi} style={{ opacity: o, color: w.held ? dim(0.5) : '#FFFFFF' }}>
                    {w.text}
                    {wi < ln.length - 1 ? ' ' : ''}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- shot 10 --
   Light floods to white and leaves the landing tile, as it sits on the page. */
export const ShotClose: React.FC = () => {
  const frame = useCurrentFrame();
  const { portrait } = useOrientation();
  const light = ramp(frame, [0, 24], [0, 1], ease.inOut);
  const tile = spring({ frame: frame - 8, fps: 30, config: springs.glide });
  const reach = 10 + light * 140;
  const SCALE = portrait ? 1.8 : 2.15;
  return (
    <AbsoluteFill style={{ background: '#07090A' }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, #FFFFFF ${reach * 0.6}%, transparent ${reach}%)` }} />
      <AbsoluteFill style={{ background: '#FFFFFF', opacity: ramp(frame, [16, 30], [0, 1], ease.inOut) }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ transform: `scale(${SCALE * (0.94 + 0.06 * tile)})`, opacity: Math.min(1, tile * 1.4) }}>
          <Tile />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
