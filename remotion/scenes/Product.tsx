import React from 'react';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { ActLabel } from '../parts';
import { GradientField } from '../backdrops';
import { ease, ramp, useDrift } from '../motion';
import { type, verde } from '../theme';

/**
 * Act three. The things themselves, running.
 *
 * The first cut never showed the product. It showed photographs of the offices
 * the work happened in and four square marks, which is a film about a career
 * rather than about anything made. This act is the correction: the live site
 * scrolling, then the game playing, both captured from the real build by
 * scripts/gen-film-captures.mjs.
 *
 * Stills scrolled inside a frame, not video. A tall screenshot translated
 * upward is indistinguishable from a screen recording at this size, stays
 * perfectly sharp, and keeps the film deterministic.
 */

const FRAME_W = 1180;
const FRAME_H = 720;

/** The browser chrome. Three dots and a bar: enough to read as a window. */
const Chrome: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      height: 44,
      background: '#E8E8E6',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 18,
      gap: 8,
      flexShrink: 0,
    }}
  >
    {['#DE5C52', '#E5B44A', '#4FB05C'].map((c) => (
      <span key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />
    ))}
    <span
      style={{
        ...type.caption,
        fontSize: 15,
        color: '#6A6A66',
        background: '#F6F6F4',
        borderRadius: 7,
        padding: '4px 16px',
        marginLeft: 14,
      }}
    >
      {label}
    </span>
  </div>
);

/**
 * The window. Content is handed in so the same frame can hold the site and then
 * the game without the frame itself ever cutting, which is what makes the two
 * read as one demonstration rather than two slides.
 */
const Window: React.FC<{ children: React.ReactNode; lift: number }> = ({ children, lift }) => (
  <div
    style={{
      width: FRAME_W,
      height: FRAME_H,
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: '#FFFFFF',
      boxShadow: `0 ${40 + lift}px ${90 + lift * 2}px rgba(0,0,0,0.45)`,
      transform: `translateY(${-lift}px)`,
    }}
  >
    {children}
  </div>
);

/** A capture scrolled inside the window. */
const Scroll: React.FC<{ src: string; travel: number; length: number; from?: number }> = ({
  src,
  travel,
  length,
  from = 0,
}) => {
  const frame = useCurrentFrame() - from;
  /* Held still for a beat before it moves. A scroll that begins on frame zero
     reads as a pan; one that waits reads as somebody deciding to scroll. */
  const y = ramp(frame, [18, length], [0, -travel], ease.inOut);
  return (
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      <Img
        src={staticFile(src)}
        style={{
          width: '100%',
          display: 'block',
          position: 'absolute',
          top: 0,
          transform: `translateY(${y}px)`,
        }}
      />
    </div>
  );
};

export const Product: React.FC = () => {
  const frame = useCurrentFrame();
  const sway = useDrift(560, 6);
  /* The window rises into the shot and keeps rising almost imperceptibly. */
  const lift = ramp(frame, [0, 34], [-40, 0], ease.enter) + ramp(frame, [0, 140], [0, 14], ease.inOut);
  const scale = ramp(frame, [0, 34], [0.94, 1], ease.enter);

  const SWAP = 78;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <GradientField seed="product" intensity={0.8} />

      <div style={{ position: 'absolute', top: 92, left: 96 }}>
        <ActLabel>Live</ActLabel>
      </div>

      <div style={{ transform: `translateX(${sway}px) scale(${scale})` }}>
        <Window lift={lift}>
          <Sequence durationInFrames={SWAP + 6} layout="none">
            <SiteHalf />
          </Sequence>
          <Sequence from={SWAP} layout="none">
            <GameHalf from={SWAP} />
          </Sequence>
        </Window>
      </div>
    </AbsoluteFill>
  );
};

/* The two halves are split out so each owns its own chrome label and its own
   cross-fade, and so the swap is a dissolve inside the window rather than a
   cut of the whole shot. */

const SiteHalf: React.FC = () => {
  const frame = useCurrentFrame();
  const out = ramp(frame, [72, 84], [1, 0], ease.exit);
  return (
    <AbsoluteFill style={{ opacity: out, display: 'flex', flexDirection: 'column' }}>
      <Chrome label="dean-ai-ux.github.io" />
      <Scroll src="media/film-site.jpg" travel={330} length={78} />
    </AbsoluteFill>
  );
};

const GameHalf: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame();
  const inn = ramp(frame, [0, 16], [0, 1], ease.enter);
  return (
    <AbsoluteFill style={{ opacity: inn, display: 'flex', flexDirection: 'column' }}>
      <Chrome label="Fed Chair for a Year" />
      <Scroll src="media/film-game.jpg" travel={60} length={60} from={-from} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '34px 28px 20px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)',
          ...type.titleMd,
          color: '#FFFFFF',
        }}
      >
        A monetary policy simulator, playable in the browser
      </div>
    </AbsoluteFill>
  );
};

export default Product;
