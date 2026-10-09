import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { verde } from './theme';
import { Origin } from './scenes/Origin';
import { Work } from './scenes/Work';
import { Built } from './scenes/Built';
import { Outlasted } from './scenes/Outlasted';
import { Landing } from './scenes/Landing';

/**
 * Eighteen seconds, five acts.
 *
 * The three lines of profile.arc carry the structure: Austin to New York opens,
 * zero to one runs under the work, and static to living lands last, at the
 * moment the film resolves into the page it is sitting on top of. The two acts
 * in the middle are the evidence for the claim the three lines make.
 *
 * Scenes overlap by a few frames at the seams. Each one fades its own tail, so
 * a cut is a cross-fade rather than a flash of the ground between two shots.
 */
export const SCENES = [
  { Component: Origin, from: 0, durationInFrames: 100 },
  { Component: Work, from: 95, durationInFrames: 140 },
  { Component: Built, from: 230, durationInFrames: 120 },
  { Component: Outlasted, from: 345, durationInFrames: 100 },
  { Component: Landing, from: 440, durationInFrames: 100 },
] as const;

export const Intro: React.FC = () => (
  <AbsoluteFill style={{ background: verde.forest }}>
    {SCENES.map(({ Component, from, durationInFrames }, i) => (
      <Sequence key={i} from={from} durationInFrames={durationInFrames}>
        <Component />
      </Sequence>
    ))}
  </AbsoluteFill>
);
