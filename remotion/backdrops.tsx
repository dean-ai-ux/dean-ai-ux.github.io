import React from 'react';
import { AbsoluteFill, staticFile, useCurrentFrame } from 'remotion';
import { ease, ramp } from './motion';

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
