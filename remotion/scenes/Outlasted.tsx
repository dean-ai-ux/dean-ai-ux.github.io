import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { ActLabel, ArcLine } from '../parts';
import { ease, ramp, useKenBurns } from '../motion';
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

  const progress = ramp(frame, [10, 58], [0, 1], ease.enter);
  const claim = ramp(frame, [52, 84], [0, 1], ease.enter);
  /* Pushed in and drifting left, so the group behind the type is never still
     and the shot has somewhere to go across its whole length. */
  const camera = useKenBurns({ from: 1.08, to: 1.18, dx: -40 });

  return (
    <AbsoluteFill style={{ background: verde.forest }}>
      <AbsoluteFill>
        <Img
          src={staticFile('media/fed-challenge.jpg')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: camera,
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
            opacity: claim,
            transform: `translateY(${(1 - claim) * 14}px)`,
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
