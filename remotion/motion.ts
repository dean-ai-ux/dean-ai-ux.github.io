/**
 * The film's motion vocabulary.
 *
 * The first cut had 31 `interpolate` calls and not one easing option. Every
 * move in it was linear: things started at full speed, stopped dead, and
 * covered equal distance in equal time the whole way. That is the single
 * reason it read as unpolished. Nothing in the physical world moves linearly,
 * so nothing linear reads as real.
 *
 * Everything here exists so a scene can ask for a move by name and never
 * restate a curve. If a scene file contains a bare `interpolate` without an
 * easing, that is a bug.
 */
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * Curves.
 *
 * `enter` is the expo-out bezier: roughly 80% of the distance is covered in the
 * first third of the time, then it settles. It is the curve that makes type
 * feel like it arrives rather than slides.
 *
 * `exit` is its mirror, slow to leave and then gone, so an outgoing element
 * does not fight an incoming one for the eye.
 *
 * `inOut` is for things that both start and stop on screen, like a Ken Burns
 * push that has to not jerk at either end.
 *
 * `drift` is deliberately almost linear. Continuous background motion wants
 * constant velocity: ease it and it visibly pulses on a loop.
 */
export const ease = {
  enter: Easing.bezier(0.16, 1, 0.3, 1),
  exit: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  drift: Easing.bezier(0.4, 0, 0.6, 1),
} as const;

type Range = readonly [number, number];

/** interpolate, but it is not possible to forget the easing. */
export const ramp = (
  frame: number,
  input: Range,
  output: Range,
  easing: (n: number) => number = ease.enter,
) =>
  interpolate(frame, input as unknown as number[], output as unknown as number[], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/**
 * 0 to 1 over `len` frames after `delay`, eased in.
 *
 * Most entrances are this: a number between nought and one that something else
 * is derived from. Deriving opacity and offset from the same value is what
 * keeps the two in step.
 */
export const useEnter = (delay = 0, len = 26) => {
  const frame = useCurrentFrame();
  return ramp(frame - delay, [0, len], [0, 1], ease.enter);
};

/** 1 to 0 across the tail of a scene, eased out. */
export const useExit = (len = 16) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return ramp(frame, [durationInFrames - len, durationInFrames], [1, 0], ease.exit);
};

/** A spring that settles without overshoot, for anything meant to feel physical. */
export const useSettle = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.6 } });
};

/**
 * A slow push across a shot's whole length.
 *
 * Returns a transform string. Scale and offset both move, because a pure zoom
 * about the centre reads as a camera fault rather than as a camera move: real
 * pushes drift off axis.
 *
 * `inOut` rather than `drift` here. A Ken Burns runs the length of a shot and
 * is cut at both ends, so it wants to be slowest exactly where the cut lands.
 */
export const useKenBurns = ({
  from = 1.06,
  to = 1.14,
  dx = 0,
  dy = 0,
}: { from?: number; to?: number; dx?: number; dy?: number } = {}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = ramp(frame, [0, durationInFrames], [0, 1], ease.inOut);
  const scale = from + (to - from) * t;
  return `scale(${scale}) translate(${dx * t}px, ${dy * t}px)`;
};

/**
 * A value that drifts back and forth forever, for backdrop layers.
 *
 * Sine rather than a ping-ponged ramp: a ramp reverses with a visible corner at
 * each end, and at these speeds the corner is the only thing the eye catches.
 */
export const useDrift = (period: number, amplitude: number, phase = 0) => {
  const frame = useCurrentFrame();
  return Math.sin(((frame + phase) / period) * Math.PI * 2) * amplitude;
};

/** Stagger helper: the delay for item `i` in a group. */
export const stagger = (i: number, step = 6, base = 0) => base + i * step;
