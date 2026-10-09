import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { type, verde } from './theme';

/**
 * The arrow between the two halves of an arc line.
 *
 * Drawn rather than imported: the site uses lucide's ArrowRight, and pulling a
 * React icon library into the film to get one glyph is not worth it. These are
 * lucide's own path commands at its 24-unit grid, so the shape matches.
 */
export const Arrow: React.FC<{ size: number; opacity?: number }> = ({ size, opacity = 0.5 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ opacity, flexShrink: 0 }}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

/**
 * One line of profile.arc: where it started, an arrow, where it is now.
 *
 * The site sets the left half back at 60% opacity and the arrow at 50%, and
 * this keeps those exact values so the closing frame reads as the same object.
 * `progress` runs 0 to 1 and drives the three parts in sequence rather than
 * together, which is what makes it read as a move rather than a fade.
 */
export const ArcLine: React.FC<{
  from: string;
  to: string;
  progress: number;
  style?: React.CSSProperties;
  arrowSize?: number;
  gap?: number;
}> = ({ from, to, progress, style, arrowSize = 48, gap = 24 }) => {
  const fromOpacity = interpolate(progress, [0, 0.35], [0, 0.6], { extrapolateRight: 'clamp' });
  const arrowOpacity = interpolate(progress, [0.3, 0.6], [0, 0.5], { extrapolateRight: 'clamp' });
  const toOpacity = interpolate(progress, [0.5, 0.9], [0, 1], { extrapolateRight: 'clamp' });
  const toShift = interpolate(progress, [0.5, 0.9], [18, 0], { extrapolateRight: 'clamp' });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap, color: verde.onForest, ...style }}>
      <span style={{ opacity: fromOpacity }}>{from}</span>
      <span style={{ opacity: arrowOpacity, display: 'flex' }}>
        <Arrow size={arrowSize} opacity={1} />
      </span>
      <span style={{ opacity: toOpacity, transform: `translateX(${toShift}px)`, display: 'inline-block' }}>
        {to}
      </span>
    </div>
  );
};

/**
 * A small all-caps marker naming the act.
 *
 * Sits where a chapter heading would. Brass because it is the one Verde tone
 * that reads as an annotation rather than as content.
 */
export const ActLabel: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        ...type.label,
        color: verde.brass,
        textTransform: 'uppercase',
        letterSpacing: '4px',
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [10, 0])}px)`,
      }}
    >
      {children}
    </div>
  );
};

/** Frames to seconds at the composition's own rate, for readable scene code. */
export const useSpringIn = (delay = 0, damping = 200) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
};
