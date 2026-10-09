import React from 'react';
import { AbsoluteFill, random, staticFile, useCurrentFrame } from 'remotion';
import { ease, ramp } from './motion';
import { useDrift } from './motion';
import { verde } from './theme';

/**
 * What sits behind the type.
 *
 * Drawn in code, not generated. There are no assets here, no API keys and no
 * network: every layer is deterministic, so the same frame renders the same
 * forever and a re-render never quietly changes the film.
 *
 * One rule governs all of it. These layers are behind. If a backdrop is ever
 * the thing you look at, it has failed, so the contrast ceilings here are
 * deliberately low and should stay that way.
 */

/**
 * Two large radial washes drifting against each other.
 *
 * This is what gives a flat fill depth. A single colour across 1920x1080 reads
 * as a slide; the same colour with a soft off-centre lift reads as a space with
 * light in it. The two washes move on different periods and are never in phase,
 * so the field never settles into a pattern you can read.
 */
export const GradientField: React.FC<{
  seed?: string;
  intensity?: number;
}> = ({ seed = 'verdevista', intensity = 1 }) => {
  const a = random(`${seed}-a`);
  const b = random(`${seed}-b`);

  const ax = 28 + useDrift(520, 9, a * 200);
  const ay = 22 + useDrift(610, 7, b * 200);
  const bx = 76 + useDrift(470, 11, 140 + a * 200);
  const by = 72 + useDrift(680, 8, 260 + b * 200);

  return (
    <AbsoluteFill style={{ background: verde.forest }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 55% at ${ax}% ${ay}%, ${verde.sage} 0%, transparent 70%)`,
          opacity: 0.3 * intensity,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 50% at ${bx}% ${by}%, #1E5140 0%, transparent 72%)`,
          opacity: 0.42 * intensity,
        }}
      />
      {/* A top-down darkening, so type set low always has a ground. */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom, transparent 35%, ${verde.forest} 100%)`,
          opacity: 0.55,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * A sparse drifting rule grid.
 *
 * Verde is a Swiss, rectilinear system, so the one ornament the film allows
 * itself is the grid that system is built on. Held at 5% it is felt rather than
 * seen, which is the point: it gives the eye a sense of a plane behind the type
 * without giving it anything to read.
 */
export const RuleGrid: React.FC<{ opacity?: number; spacing?: number }> = ({
  opacity = 0.05,
  spacing = 120,
}) => {
  const x = useDrift(900, 26);
  const y = useDrift(1100, 18, 300);
  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translate(${x}px, ${y}px)`,
        backgroundImage: `linear-gradient(${verde.onForest} 1px, transparent 1px),
                          linear-gradient(90deg, ${verde.onForest} 1px, transparent 1px)`,
        backgroundSize: `${spacing}px ${spacing}px`,
        /* Oversized so the drift never exposes an edge. */
        inset: -spacing * 2,
      }}
    />
  );
};

/**
 * Film grain, as a tiled still.
 *
 * This was an SVG feTurbulence filter covering the whole 1920x1080 frame. It
 * looked identical and it was the single largest cost in the render: the
 * browser recomputed fractal noise over two million pixels on every one of 600
 * frames, and the full render went from 22 seconds to six and a half minutes.
 *
 * A 256px tile generated once, committed, and repeated costs nothing. Grain
 * does not need to be unique per frame to read as grain, and keeping it static
 * also keeps H.264 happy: animated noise is unpredictable, so the encoder turns
 * every frame into a keyframe and the file balloons.
 */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => (
  <AbsoluteFill
    style={{
      opacity,
      mixBlendMode: 'overlay',
      pointerEvents: 'none',
      backgroundImage: `url(${staticFile('media/film-grain.png')})`,
      backgroundRepeat: 'repeat',
      backgroundSize: '256px 256px',
    }}
  />
);

/**
 * A vignette.
 *
 * Pulls the corners down a few percent so the eye goes to the middle. It is the
 * cheapest trick in the finishing kit and the one that most reliably separates
 * something that looks rendered from something that looks shot.
 */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.45 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(70% 70% at 50% 50%, transparent 55%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/**
 * The finishing pass, applied once over the whole film rather than per scene.
 *
 * It lifts before the end. The last act turns the ground over to the page's
 * white and the film hands off to the real landing page, which is flat: holding
 * a vignette over that put grey in the corners of a white page and the handoff
 * stopped matching. Grain goes with it, for the same reason.
 */
export const Finishing: React.FC<{ liftFrom: number; liftTo: number }> = ({
  liftFrom,
  liftTo,
}) => {
  const frame = useCurrentFrame();
  const present = ramp(frame, [liftFrom, liftTo], [1, 0], ease.inOut);
  if (present <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: present, pointerEvents: 'none' }}>
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};
