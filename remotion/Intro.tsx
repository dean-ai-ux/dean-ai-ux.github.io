import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

import { Finishing } from './backdrops';
import { INK } from './light';
import { ease, ramp } from './motion';
import { SHOTS } from './shots';

/**
 * Twenty-four seconds, nine shots: three of Dean's thoughts from his bio, each
 * followed by the work that backs it, ending on the landing page itself.
 *
 * The storyboard (reviewed and approved before this was built) fixed each
 * shot's length. Cross-fades overlap neighbours, so every shot but the last is
 * lengthened by the fade it shares with the next one, and the total still lands
 * on 720 frames: 816 of sequence minus 8 fades of 12.
 *
 * Fades only, and short ones. Most of the movement between ideas happens inside
 * the shots, as glass travelling and settling, so the seams should be quiet.
 */
const FADE = 12;

/**
 * A slow push across a shot's whole length. Every shot has springs that settle
 * within its first second; without this, the rest of each shot would hold still,
 * and a held frame is what makes a film feel like slides.
 */
const Push: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = ramp(frame, [0, durationInFrames], [0, 1], ease.inOut);
  return (
    <AbsoluteFill style={{ transform: `scale(${1 + t * 0.025})`, transformOrigin: '50% 50%' }}>
      {children}
    </AbsoluteFill>
  );
};

export const Intro: React.FC = () => (
  <AbsoluteFill style={{ background: INK }}>
    <TransitionSeries>
      {SHOTS.map((s, i) => {
        const last = i === SHOTS.length - 1;
        const Shot = s.component;
        return (
          <React.Fragment key={s.id}>
            <TransitionSeries.Sequence durationInFrames={s.frames + (last ? 0 : FADE)}>
              {/* The closing shot is not pushed: it has to land exactly on the
                  landing tile's size so the handoff to the page matches. */}
              {last ? <Shot /> : <Push><Shot /></Push>}
            </TransitionSeries.Sequence>
            {!last && (
              <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} />
            )}
          </React.Fragment>
        );
      })}
    </TransitionSeries>

    {/* Grain and vignette over the dark shots, lifted before the ground turns
        white so the last frame is as flat as the page it hands off to. Shot 9
        starts at frame 675. */}
    <Finishing liftFrom={668} liftTo={692} />
  </AbsoluteFill>
);
