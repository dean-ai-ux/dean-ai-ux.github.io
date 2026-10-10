import { useVideoConfig } from 'remotion';
import { fontFamily } from './theme';
import type React from 'react';

/**
 * One set of shot files drives both cuts. A shot asks which way up the frame is
 * and how big its type should be, rather than hardcoding either, so the
 * landscape and portrait films cannot drift apart.
 */
export const useOrientation = () => {
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  return { portrait, W: width, H: height, cx: width / 2, cy: height / 2 };
};

/**
 * The type ramp for each cut.
 *
 * The floor is the point. In landscape nothing is under 44px at 1920 wide,
 * which is 33px in a 1440 laptop window. In portrait nothing is under 48px at
 * 1080 wide, which is 17px on a 390px phone. The first cut of this film had
 * 24px labels and 40px chips, which on a phone came out at 5 and 8 pixels.
 */
const base = { fontFamily, color: '#FFFFFF', fontVariationSettings: "'wdth' 100" } as const;

const ramp = (portrait: boolean) => {
  const s = portrait
    ? { hero: 128, display: 92, title: 68, body: 52, small: 48 }
    : { hero: 150, display: 100, title: 64, body: 48, small: 44 };
  return {
    hero: { ...base, fontSize: s.hero, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1 },
    display: { ...base, fontSize: s.display, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.06 },
    title: { ...base, fontSize: s.title, fontWeight: 650, letterSpacing: '-0.03em', lineHeight: 1.12 },
    body: { ...base, fontSize: s.body, fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1.2 },
    small: { ...base, fontSize: s.small, fontWeight: 500, letterSpacing: '-0.01em', lineHeight: 1.2 },
    eyebrow: {
      ...base,
      fontSize: s.small,
      fontWeight: 650,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      color: '#C99A52',
    },
  } satisfies Record<string, React.CSSProperties>;
};

export const useType = () => ramp(useOrientation().portrait);

export const dim = (a: number) => `rgba(255,255,255,${a})`;
