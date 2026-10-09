import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ActLabel, ArcLine } from '../parts';
import { type, verde } from '../theme';
import education from '../../src/content/education.json';

type Entry = { id: string; outcomes?: { claim: string }[] };

/* The claim is read out of education.json rather than retyped, so the film
   cannot end up asserting something the site no longer says. */
const fed = (education as Entry[]).find((e) => e.id === 'davidson-fed-challenge');
const permanent = fed?.outcomes?.find((o) => /ECO 386/.test(o.claim))?.claim ?? '';

/**
 * Act four. The thing he started that kept going without him.
 *
 * This is the one beat that is not about output. A team becomes a permanent
 * course, which is the strongest claim on the site because it is the one he had
 * least control over once it was made. It gets the quietest treatment: one
 * photograph, one line, no movement to speak of.
 */
export const Outlasted: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const progress = interpolate(frame, [10, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const claimOpacity = interpolate(frame, [52, 76], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fade = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });
  const push = interpolate(frame, [0, durationInFrames], [1.06, 1.12]);

  return (
    <AbsoluteFill style={{ background: verde.forest, opacity: fade }}>
      <AbsoluteFill>
        <Img
          src={staticFile('media/fed-challenge.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${push})`,
          }}
        />
      </AbsoluteFill>
      {/* 0.86 was not enough. The team photograph has white shirts behind
          exactly where the claim sits, and at 0.75 text opacity the sentence
          was unreadable: measured against the render, the glyphs and the shirts
          landed within a few points of the same luminance. 0.94 keeps the
          photograph legible as a presence while giving the type a ground. */}
      <AbsoluteFill style={{ background: verde.forest, opacity: 0.94 }} />

      <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: 140, paddingRight: 140 }}>
        <ActLabel delay={6}>Davidson</ActLabel>
        <div style={{ marginTop: 26 }}>
          <ArcLine
            from="Fed Challenge"
            to="ECO 386"
            progress={progress}
            style={type.displayMd}
            arrowSize={50}
            gap={24}
          />
        </div>
        <div
          style={{
            ...type.headlineMd,
            color: verde.onForest,
            opacity: claimOpacity,
            marginTop: 30,
            maxWidth: 1180,
          }}
        >
          {permanent}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
