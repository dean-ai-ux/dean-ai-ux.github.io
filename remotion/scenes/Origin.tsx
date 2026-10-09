import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ArcLine } from '../parts';
import { type, verde } from '../theme';
import profile from '../../src/content/profile.json';

const arc = (profile as { arc: string[][] }).arc;

/**
 * Act one. Austin becomes New York.
 *
 * Opens on nothing but the ground, so the first thing the viewer sees is the
 * colour the site is built out of rather than a title card. The name arrives
 * under the line rather than over it: the move is the subject, and the name is
 * the footnote that tells you whose move it is.
 */
export const Origin: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [8, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  /* Everything lifts a little on the way out, so the cut into the Prophet rooms
     is a continuation rather than a hard change of subject. */
  const exit = interpolate(frame, [durationInFrames - 14, durationInFrames], [0, -28], {
    extrapolateLeft: 'clamp',
  });
  const exitFade = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  const nameOpacity = interpolate(frame, [38, 62], [0, 0.65], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: verde.forest,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: exitFade,
      }}
    >
      <div style={{ transform: `translateY(${exit}px)`, textAlign: 'left' }}>
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
            opacity: nameOpacity,
            marginTop: 28,
            letterSpacing: '6px',
            textTransform: 'uppercase',
          }}
        >
          Dean Dowling
        </div>
      </div>
    </AbsoluteFill>
  );
};
