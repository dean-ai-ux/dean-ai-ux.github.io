import React from 'react';
import { continueRender, delayRender } from 'remotion';
import { useOrientation, useType } from '../layout';

/**
 * Shared pieces for the shots: measuring real text so glass can be sized to
 * it, and the chapter label.
 */

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

/**
 * The chapter label. Same place in every shot of a cut, so it reads as
 * navigation: the viewer always knows which of the three ideas they are in.
 */
export const Eyebrow: React.FC<{ children: React.ReactNode; appear?: number }> = ({ children, appear = 1 }) => {
  const { portrait } = useOrientation();
  const t = useType();
  return (
    <div
      style={{
        position: 'absolute',
        left: portrait ? 80 : 120,
        top: portrait ? 150 : 96,
        ...t.eyebrow,
        opacity: appear,
        transform: `translateY(${(1 - appear) * 12}px)`,
      }}
    >
      {children}
    </div>
  );
};
