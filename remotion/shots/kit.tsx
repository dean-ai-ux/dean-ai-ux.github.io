import React from 'react';
import { AbsoluteFill, continueRender, delayRender } from 'remotion';
import { Glass, Rect } from '../glass';
import { fontFamily } from '../theme';

/**
 * Type set the way Apple sets it: heavy, tight, and very large against very
 * small. Archivo rather than SF Pro, whose licence does not cover this use.
 */
const base: React.CSSProperties = { fontFamily, color: '#FFFFFF', fontVariationSettings: "'wdth' 100" };

export const apple = {
  hero: { ...base, fontSize: 210, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 1 },
  display: { ...base, fontSize: 124, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.02 },
  title: { ...base, fontSize: 68, fontWeight: 650, letterSpacing: '-0.03em', lineHeight: 1.08 },
  body: { ...base, fontSize: 40, fontWeight: 550, letterSpacing: '-0.015em', lineHeight: 1.2 },
  label: { ...base, fontSize: 24, fontWeight: 650, letterSpacing: '0.14em', textTransform: 'uppercase' as const },
} as const;

export const dim = (a: number) => `rgba(255,255,255,${a})`;

/** A block of text centred on a point, so a lens can be placed around it by coordinates. */
export const At: React.FC<{
  x?: number;
  y: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  align?: 'center' | 'left';
}> = ({ x = 960, y, children, style, align = 'center' }) => (
  <div
    style={{
      position: 'absolute',
      left: align === 'center' ? 0 : x,
      right: align === 'center' ? 0 : undefined,
      top: y,
      transform: 'translateY(-50%)',
      textAlign: align,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * A glass capsule with text on it. The text sits on the glass rather than
 * behind it, which is how Apple labels controls, and it keeps the words crisp.
 */
export const Chip: React.FC<{
  rect: Rect;
  backdrop: React.ReactNode;
  children: React.ReactNode;
  textStyle?: React.CSSProperties;
  sheen?: number;
  opacity?: number;
  lift?: number;
  scale?: number;
}> = ({ rect, backdrop, children, textStyle, sheen = 0.3, opacity = 1, lift = 0, scale = 1 }) => {
  const r = { ...rect, y: rect.y + lift };
  return (
    <div style={{ opacity, transform: `scale(${scale})`, transformOrigin: `${r.x + r.w / 2}px ${r.y + r.h / 2}px`, position: 'absolute', inset: 0 }}>
      <Glass rect={r} radius={Math.min(r.h / 2, 48)} backdrop={backdrop} sheen={sheen} edgeBand={0.32}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ ...apple.body, ...textStyle }}>{children}</div>
        </AbsoluteFill>
      </Glass>
    </div>
  );
};

/** Rough text width, used only as a placeholder until the real measurement lands. */
export const widthOf = (text: string, size: number, tracking = -0.04) =>
  text.length * size * (0.56 + tracking);

/**
 * Measure real rendered widths.
 *
 * The storyboard stills placed glass by counting characters, and in shot 7 the
 * lens missed its word and ran off the frame. This renders the strings hidden,
 * in the exact style they appear in, waits for the webfont, and reads their
 * widths from layout. The render is held with delayRender until the numbers
 * exist, so no frame is ever drawn with a guessed size.
 */
export const useWidths = (texts: string[], style: React.CSSProperties) => {
  const refs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const [handle] = React.useState(() => delayRender('measuring text for glass'));
  const [widths, setWidths] = React.useState<number[] | null>(null);
  React.useLayoutEffect(() => {
    let live = true;
    document.fonts.ready.then(() => {
      if (!live) return;
      setWidths(refs.current.map((r) => (r ? r.getBoundingClientRect().width : 0)));
      continueRender(handle);
    });
    return () => {
      live = false;
    };
  }, [handle]);
  const probe = (
    <div style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', left: 0, top: 0 }}>
      {texts.map((t, i) => (
        <span
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          style={{ ...style, position: 'absolute', whiteSpace: 'pre' }}
        >
          {t}
        </span>
      ))}
    </div>
  );
  const get = (i: number, fallbackSize = 40) =>
    widths ? widths[i] : widthOf(texts[i], fallbackSize);
  return { probe, get };
};
