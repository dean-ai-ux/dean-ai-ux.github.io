import React from 'react';
import { Composition } from 'remotion';
import { Intro } from './Intro';
import { DURATION, FPS } from './theme';
import { SHOTS } from './shots';

/**
 * Two cuts of the film from one set of shots: landscape for laptops and
 * portrait for phones. Every shot is also its own composition in both
 * orientations, so a single shot can be previewed or stilled for review.
 */
const L = { width: 1920, height: 1080 };
const P = { width: 1080, height: 1920 };

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Intro" component={Intro} durationInFrames={DURATION} fps={FPS} {...L} />
    <Composition id="IntroPortrait" component={Intro} durationInFrames={DURATION} fps={FPS} {...P} />
    {SHOTS.map((s) => (
      <React.Fragment key={s.id}>
        <Composition id={s.id} component={s.component} durationInFrames={s.frames} fps={FPS} {...L} />
        <Composition id={`${s.id}-P`} component={s.component} durationInFrames={s.frames} fps={FPS} {...P} />
      </React.Fragment>
    ))}
  </>
);
