import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame } from 'remotion';
import { Glass } from '../glass';
import { DarkGround, Sweep } from '../light';
import { ease, ramp, springs } from '../motion';
import { verde } from '../theme';
import { Tile } from './tile';
import { apple } from './kit';

/* ---------------------------------------------------------------- shot 1 ---
   Black, one glass pill, his name. The light behind it is a single green pool,
   so the first colour the viewer sees is the site's. */

export const ShotOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const p = spring({ frame: frame - 4, fps: 30, config: springs.pop });
  const bloom = ramp(frame, [0, 30], [0, 1], ease.enter);
  const ground = (
    <DarkGround glows={[{ x: 50, y: 50, r: 0.32, color: verde.sage, alpha: 0.75 * bloom }]} />
  );

  const W = 640;
  const H = 156;
  const scale = 0.55 + 0.45 * p;
  return (
    <AbsoluteFill>
      {ground}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: Math.min(1, p * 1.5),
          transform: `scale(${scale})`,
          transformOrigin: '960px 540px',
        }}
      >
        <Glass rect={{ x: 960 - W / 2, y: 540 - H / 2, w: W, h: H }} radius={H / 2} backdrop={ground} sheen={0.2 + p * 0.3}>
          <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ ...apple.title, fontSize: 64 }}>Dean Dowling</span>
          </AbsoluteFill>
          <Sweep progress={ramp(frame, [18, 48], [0, 1], ease.inOut)} strength={0.4} />
        </Glass>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- shot 9 ---
   Black opens to white and leaves the landing tile, as it sits on the page.
   The tile is the same component the previous film ended on, so the last frame
   cannot drift from the page. */

const TILE_SCALE = 2.15;

export const ShotClose: React.FC = () => {
  const frame = useCurrentFrame();
  /* Light arrives from the centre rather than the whole frame fading: a radial
     wash that grows, so the brightening reads as light, not as a flash. */
  const light = ramp(frame, [0, 26], [0, 1], ease.inOut);
  const tile = spring({ frame: frame - 10, fps: 30, config: springs.glide });
  const reach = 10 + light * 140;

  return (
    <AbsoluteFill style={{ background: '#07090A' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, #FFFFFF ${reach * 0.6}%, transparent ${reach}%)`,
        }}
      />
      <AbsoluteFill style={{ background: '#FFFFFF', opacity: ramp(frame, [18, 34], [0, 1], ease.inOut) }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ transform: `scale(${TILE_SCALE * (0.94 + 0.06 * tile)})`, opacity: Math.min(1, tile * 1.4) }}>
          <Tile />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
