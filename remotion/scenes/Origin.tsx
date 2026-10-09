import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ArcLine } from '../parts';
import { GradientField, RuleGrid } from '../backdrops';
import { ease, ramp, useDrift } from '../motion';
import { type, verde } from '../theme';
import profile from '../../src/content/profile.json';

const arc = (profile as { arc: string[][] }).arc;

/**
 * Act one. Austin becomes New York.
 *
 * No exit fade here any more. TransitionSeries owns every seam now, and a scene
 * that also fades its own tail double-fades: the two curves multiply and the
 * cut dips to black in the middle.
 */
export const Origin: React.FC = () => {
  const frame = useCurrentFrame();

  const progress = ramp(frame, [6, 54], [0, 1], ease.enter);

  /* The whole block creeps upward for the entire shot. Nothing on screen is
     ever completely still, which is most of the difference between a film and
     a slideshow. */
  const lift = ramp(frame, [0, 104], [10, -10], ease.inOut);
  const sway = useDrift(420, 4);

  const nameIn = ramp(frame, [34, 66], [0, 1], ease.enter);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <GradientField seed="origin" />
      <RuleGrid opacity={0.04} />

      <div style={{ transform: `translate(${sway}px, ${lift}px)` }}>
        <ArcLine
          from={arc[0][0]}
          to={arc[0][1]}
          progress={progress}
          style={type.displayLg}
          arrowSize={62}
          gap={28}
        />
        <div
          style={{
            ...type.titleLg,
            color: verde.onForest,
            opacity: nameIn * 0.65,
            marginTop: 28,
            letterSpacing: '6px',
            textTransform: 'uppercase',
            /* Tracking opens as it arrives. Four pixels, over half a second,
               and it is the difference between type appearing and type
               settling. */
            transform: `translateX(${ramp(frame, [34, 70], [-6, 0], ease.enter)}px)`,
          }}
        >
          Dean Dowling
        </div>
      </div>
    </AbsoluteFill>
  );
};
