import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame } from 'remotion';
import { Glass, Rect } from '../glass';
import { Box } from '../diagram';
import { DarkGround } from '../light';
import { ease, ramp, springs } from '../motion';
import { dim, useOrientation, useType } from '../layout';
import { Eyebrow } from './kit';
import projects from '../../src/content/projects.json';

const pop = (frame: number, delay: number, cfg: keyof typeof springs = 'pop') =>
  spring({ frame: frame - delay, fps: 30, config: springs[cfg] });
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: mix(a.x, b.x, t),
  y: mix(a.y, b.y, t),
  w: mix(a.w, b.w, t),
  h: mix(a.h, b.h, t),
});

/* ---------------------------------------------------------------- shot 5 ---
   "A presentation captures the best thinking available at a particular moment.
    AI-enabled deliverables can remain active" (about.json).
   A slide settles and goes grey: it is fixed at the moment it was made. Then
   it opens out into a window with this site running in it. */

/** A generic slide: shapes only, no words, so it stands for any deck. */
const Slide: React.FC<{ frozen: number }> = ({ frozen }) => (
  <AbsoluteFill
    style={{
      background: '#F3F4F2',
      padding: '7% 8%',
      display: 'flex',
      flexDirection: 'column',
      gap: '6%',
      filter: `grayscale(${frozen}) brightness(${1 - frozen * 0.35})`,
    }}
  >
    <div style={{ height: '9%', width: '55%', background: '#12352A', borderRadius: 6 }} />
    <div style={{ display: 'flex', gap: '6%', flex: 1 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10%' }}>
        {[90, 75, 82, 60].map((w, i) => (
          <div key={i} style={{ height: '9%', width: `${w}%`, background: '#C9CFCB', borderRadius: 5 }} />
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8%' }}>
        {[40, 62, 50, 85].map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 3 ? '#4A7C59' : '#9DB3A6', borderRadius: 5 }} />
        ))}
      </div>
    </div>
  </AbsoluteFill>
);

export const ShotLiving: React.FC = () => {
  const frame = useCurrentFrame();
  const { portrait, cx } = useOrientation();
  const t = useType();
  const ground = <DarkGround />;

  const c1 = ramp(frame, [0, 12], [0, 1], ease.enter) * ramp(frame, [44, 54], [1, 0], ease.exit);
  const c2 = ramp(frame, [54, 66], [0, 1], ease.enter);
  const slideIn = pop(frame, 4, 'glide');
  const frozen = ramp(frame, [18, 36], [0, 1], ease.inOut);
  const morph = ramp(frame, [44, 66], [0, 1], ease.inOut);
  const scroll = ramp(frame, [60, 99], [0, 1], ease.inOut);
  const live = pop(frame, 64);

  const slideR: Rect = portrait ? { x: 80, y: 760, w: 920, h: 518 } : { x: 510, y: 320, w: 900, h: 506 };
  const winR: Rect = portrait ? { x: cx - 300, y: 560, w: 600, h: 1240 } : { x: 380, y: 290, w: 1160, h: 680 };
  const R = mixRect(slideR, winR, morph);
  const site = portrait ? 'media/film-site-mobile.jpg' : 'media/film-site.jpg';
  /* How far each capture can scroll before it runs out of page and shows only
     white: the phone capture is 1290x3936 shown 580 wide in a window about 1160
     tall, so roughly 600px; the desktop page is short. Kept inside both. */
  /* 520 was the arithmetic limit, but the phone page ends in blank space above
     the footer, and the full render showed the window scrolled into white by
     the end of the shot. 260 stays on the tiles. */
  const travel = portrait ? 260 : 140;

  const caption = (lines: string[], o: number) => (
    <div
      style={{
        position: 'absolute',
        left: portrait ? 80 : 0,
        right: portrait ? 80 : 0,
        top: portrait ? 270 : 168,
        textAlign: portrait ? 'left' : 'center',
        ...t.title,
        opacity: o,
        transform: `translateY(${(1 - Math.min(1, o * 1.2)) * 12}px)`,
      }}
    >
      {lines.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  );

  return (
    <AbsoluteFill>
      {ground}
      <Eyebrow>On deliverables</Eyebrow>
      {caption(portrait ? ['A presentation', 'captures a moment.'] : ['A presentation captures a moment.'], c1)}
      {caption(portrait ? ['AI-enabled deliverables', 'can remain active.'] : ['AI-enabled deliverables can remain active.'], c2)}

      <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, slideIn * 1.4), transform: `translateY(${(1 - slideIn) * 40}px)` }}>
        <Glass rect={R} radius={mix(18, portrait ? 56 : 28, morph)} backdrop={ground} sheen={0.3}>
          {/* The slide, while it is still a slide. */}
          <div style={{ position: 'absolute', inset: 10, borderRadius: 12, overflow: 'hidden', opacity: 1 - morph }}>
            <Slide frozen={frozen} />
          </div>
          {/* The window, as the slide opens into it. */}
          <div style={{ position: 'absolute', inset: 0, opacity: morph }}>
            <div style={{ height: portrait ? 70 : 54, display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px' }}>
              {!portrait &&
                ['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                  <span key={c} style={{ width: 13, height: 13, borderRadius: '50%', background: c }} />
                ))}
              <span
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  ...t.small,
                  fontSize: portrait ? 48 : 44,
                  fontWeight: 650,
                  color: '#9ED3B1',
                  opacity: live,
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#5FD18A',
                    boxShadow: `0 0 ${10 + 8 * Math.sin(frame / 5)}px #5FD18A`,
                  }}
                />
                Live
              </span>
            </div>
            <div
              style={{
                position: 'absolute',
                left: 10,
                right: 10,
                top: portrait ? 70 : 54,
                bottom: 10,
                borderRadius: portrait ? 44 : 18,
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <Img src={staticFile(site)} style={{ width: '100%', display: 'block', transform: `translateY(${-scroll * travel}px)` }} />
            </div>
          </div>
        </Glass>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- shot 6 ---
   Three things built, readable: name and kind, from projects.json. Fed Chair
   moves to the policy chapter, where it is the proof. */

type Project = { id: string; org: string; role: string };
const SHOWN = ['verde-design-system', 'maia', 'davidson-course-compass'];
const CARDS = SHOWN.map((id) => (projects as Project[]).find((p) => p.id === id)!).filter(Boolean);

export const ShotProjects: React.FC = () => {
  const frame = useCurrentFrame();
  const { portrait } = useOrientation();
  const t = useType();
  const ground = <DarkGround />;

  const rect = (i: number): Rect =>
    portrait ? { x: 80, y: 560 + i * 300, w: 920, h: 250 } : { x: 120 + i * 580, y: 400, w: 540, h: 320 };

  return (
    <AbsoluteFill>
      {ground}
      <Eyebrow>Built</Eyebrow>
      {CARDS.map((p, i) => {
        const a = pop(frame, 4 + i * 6);
        return (
          <Box key={p.id} rect={rect(i)} backdrop={ground} textStyle={{}} appear={a} radius={36} align="left">
            <div style={{ ...t.body, fontWeight: 700, fontSize: portrait ? 60 : 52, lineHeight: 1.1 }}>{p.org}</div>
            <div style={{ ...t.small, color: dim(0.62), marginTop: 14 }}>{p.role}</div>
          </Box>
        );
      })}
    </AbsoluteFill>
  );
};
