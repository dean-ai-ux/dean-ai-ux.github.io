import React from 'react';
import { Composition } from 'remotion';
import { Intro } from './Intro';
import { DURATION, FPS, HEIGHT, WIDTH } from './theme';
import { SHOTS } from './shots';

/**
 * The film, plus each storyboard shot as its own composition so a single shot
 * can be previewed or stilled without rendering the whole thing.
 */
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Intro" component={Intro} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    {SHOTS.map((s) => (
      <Composition key={s.id} id={s.id} component={s.component} durationInFrames={s.frames} fps={FPS} width={WIDTH} height={HEIGHT} />
    ))}
  </>
);
