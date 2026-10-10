import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';

/**
 * Liquid glass.
 *
 * A panel that bends what sits behind it, catches light on its rim, and carries
 * a soft highlight that moves as it moves. It is built from two parts:
 *
 *   1. The refraction: what you see *through* the glass, slightly magnified,
 *      blurred and brightened compared with what is around it.
 *   2. The surface: rim, inner shadow, highlight and tint, all plain gradients
 *      and borders that cost nothing to draw.
 *
 * Part 1 is where the cost is, so it comes in three interchangeable methods
 * that were timed against each other before the film was built on any of them.
 */

export type GlassMethod = 'backdrop' | 'displace' | 'twice';

export type Rect = { x: number; y: number; w: number; h: number };

export const Glass: React.FC<{
  rect: Rect;
  radius?: number;
  /** The scene behind the glass, as a full-frame element. Needed by 'twice'. */
  backdrop?: React.ReactNode;
  method?: GlassMethod;
  /** How much the centre of the glass magnifies what is behind it. */
  magnify?: number;
  blur?: number;
  /** Magnification in the band around the rim, where the lensing is. */
  edgeMagnify?: number;
  /** Width of that band, as a fraction of the panel's shorter side. */
  edgeBand?: number;
  /** 0 to 1, slides the highlight across the surface. */
  sheen?: number;
  tint?: number;
  /** A dark layer inside the glass, for panels over photographs. */
  shade?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({
  rect,
  radius = 40,
  backdrop,
  method = 'twice',
  magnify = 1.05,
  blur = 1.5,
  edgeMagnify = 1.28,
  edgeBand = 0.2,
  sheen = 0.3,
  tint = 0.07,
  shade = 0,
  children,
  style,
}) => {
  const { x, y, w, h } = rect;

  const shell: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width: w,
    height: h,
    borderRadius: radius,
    overflow: 'hidden',
    /* The outer shadow seats the panel in space. */
    boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35)',
    ...style,
  };

  if (method === 'backdrop') {
    shell.backdropFilter = `blur(${blur}px) saturate(1.7) brightness(1.08)`;
    (shell as Record<string, unknown>).WebkitBackdropFilter = shell.backdropFilter;
  }
  if (method === 'displace') {
    shell.backdropFilter = `url(#liquid-glass) blur(${Math.round(blur / 2)}px) saturate(1.7)`;
  }

  return (
    <div style={shell}>
      {method === 'twice' && backdrop && (
        <>
          {/* The centre: the scene drawn a second time, lined up with the scene
              outside, barely magnified and barely blurred. Apple's Liquid Glass
              is close to clear in the middle; heavy frosting is the iOS 7 look,
              and the first version of this component was exactly that. */}
          <Layer rect={rect} magnify={magnify} blur={blur} backdrop={backdrop} />
          {/* The edge: a second copy, magnified much harder, shown only in a
              band around the rim. That band is where real glass bends light
              most, and it is what makes the panel read as a lens. Only this
              method can do it: a backdrop-filter applies one effect to the
              whole panel. */}
          <Layer
            rect={rect}
            magnify={edgeMagnify}
            blur={blur + 3}
            backdrop={backdrop}
            mask={edgeMask(Math.min(w, h) * edgeBand)}
          />
        </>
      )}

      {/* Shade: over a photograph the refracted copy is bright, and white text
          on it measured as low as 2.7:1. A dark layer inside the panel is how
          Apple keeps text on glass readable over busy wallpaper. */}
      {shade > 0 && <AbsoluteFill style={{ background: `rgba(7,9,10,${shade})` }} />}

      {/* Tint: a faint white body so even glass over pure black reads as an
          object rather than a hole. */}
      <AbsoluteFill style={{ background: `rgba(255,255,255,${tint})` }} />

      {/* Edge light: real glass is brightest at its edges, where light enters
          at a glancing angle. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(130% 120% at 50% 45%, transparent 58%, rgba(255,255,255,0.14) 100%)',
        }}
      />

      {/* The highlight, a broad soft band whose position follows `sheen`. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(118deg, transparent ${sheen * 100 - 30}%, rgba(255,255,255,0.22) ${
            sheen * 100
          }%, transparent ${sheen * 100 + 22}%)`,
          mixBlendMode: 'screen',
        }}
      />

      {/* The rim: a bright top edge and a fainter one below, then a hairline
          border. This is what makes it read as a cut, polished edge. */}
      <AbsoluteFill
        style={{
          borderRadius: radius,
          boxShadow:
            'inset 0 1.5px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.18), inset 0 0 30px rgba(255,255,255,0.06)',
        }}
      />

      {children && <AbsoluteFill style={{ position: 'absolute' }}>{children}</AbsoluteFill>}
    </div>
  );
};

/**
 * The SVG filter the 'displace' method points at. Mounted once per frame.
 * Kept even though it is not the chosen method, so the probe can be re-run.
 */
export const GlassFilterDefs: React.FC = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <filter id="liquid-glass" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves={2} seed={4} result="noise" />
      <feGaussianBlur in="noise" stdDeviation={2} result="soft" />
      <feDisplacementMap in="SourceGraphic" in2="soft" scale={60} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);

/** One redrawn copy of the scene, aligned to the frame and magnified about the panel. */
const Layer: React.FC<{
  rect: Rect;
  magnify: number;
  blur: number;
  backdrop: React.ReactNode;
  mask?: string;
}> = ({ rect, magnify, blur, backdrop, mask }) => {
  /* The redrawn scene must be the size of the actual frame, which is 1080x1920
     in the portrait cut. It was a fixed 1920x1080 before there was one. */
  const { width, height } = useVideoConfig();
  return (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      WebkitMaskImage: mask,
      maskImage: mask,
      WebkitMaskComposite: mask ? 'source-over' : undefined,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: -rect.x,
        top: -rect.y,
        width,
        height,
        transform: `scale(${magnify})`,
        transformOrigin: `${rect.x + rect.w / 2}px ${rect.y + rect.h / 2}px`,
        filter: `blur(${blur}px) saturate(1.5) brightness(1.1)`,
      }}
    >
      {backdrop}
    </div>
  </div>
  );
};

/**
 * A mask that is opaque in a band of `band` pixels around the panel's edge and
 * clear in the middle. Four gradients, one per side, painted together: the
 * corners get covered twice, which is correct, because corners bend most.
 */
const edgeMask = (band: number) =>
  [
    `linear-gradient(to right, #000 0, transparent ${band}px)`,
    `linear-gradient(to left, #000 0, transparent ${band}px)`,
    `linear-gradient(to bottom, #000 0, transparent ${band}px)`,
    `linear-gradient(to top, #000 0, transparent ${band}px)`,
  ].join(', ');
