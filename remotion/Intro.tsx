import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { slide } from '@remotion/transitions/slide';

import { Finishing } from './backdrops';
import { verde } from './theme';
import { Origin } from './scenes/Origin';
import { Work } from './scenes/Work';
import { Product } from './scenes/Product';
import { Built } from './scenes/Built';
import { Outlasted } from './scenes/Outlasted';
import { Landing } from './scenes/Landing';

/**
 * Twenty seconds, six acts.
 *
 * Every seam is a real transition now. The first cut hand-rolled each one as an
 * opacity ramp inside the outgoing scene, which meant each scene knew about its
 * neighbours, every cut was the same cut, and the ground showed through the
 * middle of each overlap. TransitionSeries owns the seams, so a scene renders
 * itself and nothing else.
 *
 * Transitions are chosen for register, not novelty. @remotion/transitions ships
 * twenty-one presentations and most of them, the glitch and RGB-split family in
 * particular, belong to a louder kind of film than this one. What is used here:
 *
 *   wipe        where two scenes both centre type, so nothing double-exposes
 *   slide       into the product shot, so the thing is set down in front of you
 *   fade        between compositions that do not occupy the same space
 *
 * No shader presentations at all, for two measured reasons. filmBurn washed the
 * frame to a cream that appears nowhere else in this film. And they are
 * extraordinarily slow: a 40-frame range containing one linearBlur rendered in
 * 198 seconds, against 8.7 for a 40-frame range with none. Every transition
 * here is DOM-only.
 *
 * Durations follow the toolkit's own numbers: 10 to 15 frames reads as a quick
 * cut, 20 to 30 as standard, 40 to 60 as a reveal.
 *
 * Arithmetic: a transition overlaps its neighbours, so the total is the sum of
 * the sequences minus the sum of the transitions. 712 - 112 = 600.
 */
export const Intro: React.FC = () => (
  <AbsoluteFill style={{ background: verde.forest }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={102}>
        <Origin />
      </TransitionSeries.Sequence>

      {/* A wipe, not a fade. Both of these scenes centre a large arc line, so
          cross-fading them printed "Austin to New York" through the middle of
          "0 to 1" as a double exposure. A wipe has a hard edge and never shows
          two compositions in the same place at once. */}
      <TransitionSeries.Transition
        presentation={wipe({ direction: 'from-bottom' })}
        timing={linearTiming({ durationInFrames: 22 })}
      />

      <TransitionSeries.Sequence durationInFrames={140}>
        <Work />
      </TransitionSeries.Sequence>

      {/* Into the product shot, rising from below, as though the thing were
          being set down in front of you.

          This was a linearBlur defocus, which looked right and was measured at
          5.0 seconds per frame against 0.2 everywhere else: 40 frames of it
          took 198 seconds, roughly two thirds of the entire render. Every
          shader presentation in @remotion/transitions carries that cost.
          A slide is DOM-only, free, and says the same thing here. */}
      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-bottom' })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 24 })}
      />

      <TransitionSeries.Sequence durationInFrames={140}>
        <Product />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={wipe({ direction: 'from-left' })}
        timing={linearTiming({ durationInFrames: 20 })}
      />

      <TransitionSeries.Sequence durationInFrames={100}>
        <Built />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 20 })}
      />

      <TransitionSeries.Sequence durationInFrames={100}>
        <Outlasted />
      </TransitionSeries.Sequence>

      {/* This was filmBurn, then a wipe, and both were wrong. filmBurn washed
          the frame to a cream that appears nowhere else in the film. The wipe
          held "Fed Challenge to ECO 386" and "Static to Living" on screen at
          once, at the same height, so at the wipe edge they read as one broken
          line. A slide pushes the outgoing scene out of the frame instead of
          leaving it in place, so the two never share the same ground. */}
      <TransitionSeries.Transition
        presentation={slide({ direction: 'from-right' })}
        timing={linearTiming({ durationInFrames: 26 })}
      />

      <TransitionSeries.Sequence durationInFrames={130}>
        <Landing />
      </TransitionSeries.Sequence>
    </TransitionSeries>

    {/* Over everything, including the transitions, so grain and vignette never
        pop at a seam, and gone by the time the ground turns white. */}
    <Finishing liftFrom={540} liftTo={574} />
  </AbsoluteFill>
);
