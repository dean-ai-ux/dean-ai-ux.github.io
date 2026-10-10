import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { useDrift } from './motion';
import { verde } from './theme';

/**
 * The dark keynote ground, and the light that lives in it.
 *
 * Glass is only as good as what is behind it. On a flat black field a glass
 * panel is invisible, because there is nothing for it to bend or tint. So the
 * ground is never actually empty: it carries a few large, very soft pools of
 * Verde colour that drift slowly, and on some shots a dimmed photograph. The
 * glass then has something to catch.
 */

export const INK = '#07090A'; // near-black, a touch cool, never pure #000

type Glow = { x: number; y: number; r: number; color: string; alpha: number };

/**
 * Soft coloured light, drifting.
 *
 * Positions are percentages of the frame, radii a fraction of its width. Each
 * pool drifts on its own period so they never move in step.
 */
export const Glows: React.FC<{ glows?: Glow[]; drift?: number }> = ({
  glows = DEFAULT_GLOWS,
  drift = 1,
}) => (
  <AbsoluteFill>
    {glows.map((g, i) => (
      <GlowPool key={i} glow={g} index={i} drift={drift} />
    ))}
  </AbsoluteFill>
);

const GlowPool: React.FC<{ glow: Glow; index: number; drift: number }> = ({ glow, index, drift }) => {
  const dx = useDrift(380 + index * 70, 4 * drift, index * 90);
  const dy = useDrift(450 + index * 55, 3 * drift, index * 140);
  /* Radii are percentages of each side, so a circle needs the vertical radius
     scaled by the frame's aspect. This was a fixed 1.6, tuned by eye for a wide
     frame; in the portrait cut it stretched every glow into a tall streak. */
  const { width, height } = useVideoConfig();
  const ry = glow.r * 100 * (width / height) * 0.9;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(${glow.r * 100}% ${ry}% at ${glow.x + dx}% ${
          glow.y + dy
        }%, ${glow.color} 0%, transparent 70%)`,
        opacity: glow.alpha,
      }}
    />
  );
};

export const DEFAULT_GLOWS: Glow[] = [
  { x: 30, y: 40, r: 0.45, color: verde.sage, alpha: 0.55 },
  { x: 72, y: 62, r: 0.4, color: '#1F6B4F', alpha: 0.5 },
  { x: 58, y: 18, r: 0.3, color: verde.brass, alpha: 0.18 },
];

/** The ground itself: ink plus glows. */
export const DarkGround: React.FC<{ glows?: Glow[]; children?: React.ReactNode }> = ({
  glows,
  children,
}) => (
  <AbsoluteFill style={{ background: INK }}>
    <Glows glows={glows} />
    {children}
  </AbsoluteFill>
);

/**
 * A photograph laid into the dark ground, dimmed so it reads as light and
 * texture rather than as a picture. Glass placed over it picks up its colour,
 * which is what makes the glass look like glass.
 */
export const PhotoGround: React.FC<{
  src: string;
  dim?: number;
  push?: number;
}> = ({ src, dim = 0.62, push = 0 }) => {
  const frame = useCurrentFrame();
  const scale = 1.08 + push * Math.min(1, frame / 240) * 0.06;
  return (
    <AbsoluteFill style={{ background: INK }}>
      <Img
        src={staticFile(src)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }}
      />
      <AbsoluteFill style={{ background: INK, opacity: dim }} />
    </AbsoluteFill>
  );
};

/**
 * A light sweep: a narrow bright band that crosses a region once.
 *
 * `progress` runs 0 to 1. Rendered as a gradient band translated across, so it
 * costs nothing. Placed inside a glass panel it reads as light catching the
 * surface as the panel moves.
 */
export const Sweep: React.FC<{ progress: number; strength?: number; angle?: number }> = ({
  progress,
  strength = 0.35,
  angle = 105,
}) => {
  if (progress <= 0 || progress >= 1) return null;
  const pos = -40 + progress * 180; // travels from off left to off right
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, transparent ${pos - 12}%, rgba(255,255,255,${strength}) ${pos}%, transparent ${pos + 12}%)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  );
};
