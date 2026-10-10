import React from 'react';
import { AbsoluteFill } from 'remotion';
import { evolvePath } from '@remotion/paths';
import { Glass, Rect } from './glass';

/**
 * Diagram primitives: glass boxes that hold words, and lines that draw
 * themselves between them.
 *
 * Diagrams are where this film carries information rather than mood, so the
 * one rule here is that nothing appears whole. Boxes arrive and lines draw in,
 * because a chart that is simply there reads as a slide.
 */

/** A glass box with text centred in it. */
export const Box: React.FC<{
  rect: Rect;
  backdrop: React.ReactNode;
  children: React.ReactNode;
  textStyle: React.CSSProperties;
  appear?: number;
  tint?: number;
  radius?: number;
  align?: 'center' | 'left';
}> = ({ rect, backdrop, children, textStyle, appear = 1, tint, radius, align = 'center' }) => {
  if (appear <= 0) return null;
  const lift = (1 - appear) * 40;
  const r = { ...rect, y: rect.y + lift };
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, appear * 1.4) }}>
      <Glass rect={r} radius={radius ?? Math.min(r.h / 2, 40)} backdrop={backdrop} sheen={0.2 + appear * 0.3} tint={tint} edgeBand={0.28}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: align === 'center' ? 'center' : 'flex-start',
            padding: align === 'left' ? '0 36px' : undefined,
          }}
        >
          <div style={{ ...textStyle, textAlign: align }}>{children}</div>
        </AbsoluteFill>
      </Glass>
    </div>
  );
};

export type Line = { d: string; progress: number; color?: string; width?: number; dot?: [number, number] };

/**
 * Lines that draw in. `evolvePath` turns a progress value into a dash offset,
 * so a line grows from its start along its own length rather than fading in.
 * A small dot rides the leading end, which is what makes it read as a
 * connection being made rather than a stroke being revealed.
 */
export const Lines: React.FC<{ lines: Line[] }> = ({ lines }) => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
    {lines.map((l, i) => {
      if (l.progress <= 0) return null;
      const { strokeDasharray, strokeDashoffset } = evolvePath(Math.min(1, l.progress), l.d);
      return (
        <g key={i}>
          <path
            d={l.d}
            fill="none"
            stroke={l.color ?? 'rgba(255,255,255,0.55)'}
            strokeWidth={l.width ?? 3}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
          />
          {l.dot && l.progress >= 1 && <circle cx={l.dot[0]} cy={l.dot[1]} r={7} fill="#FFFFFF" />}
        </g>
      );
    })}
  </svg>
);

/** A smooth cubic between two points, bowing horizontally (or vertically). */
export const curve = (x1: number, y1: number, x2: number, y2: number, vertical = false) => {
  if (vertical) {
    const my = (y1 + y2) / 2;
    return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
  }
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
};
