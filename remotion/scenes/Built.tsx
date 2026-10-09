import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ActLabel } from '../parts';
import { type, verde } from '../theme';
import projects from '../../src/content/projects.json';

type Project = { id: string; org: string; role: string; placeholder?: boolean };

/* Which four get a mark, in the order they appear. Named rather than taken as
   the first four of the file: the marks have to exist as images, and the order
   here is a composition decision, not a data one. */
const SHOWN = ['verde-design-system', 'fed-chair-for-a-year', 'maia', 'davidson-course-compass'];
const ART: Record<string, string> = {
  'verde-design-system': 'media/icon-verde-design-system.jpg',
  'fed-chair-for-a-year': 'media/icon-fed-chair-for-a-year.jpg',
  maia: 'media/maia.jpg',
  'davidson-course-compass': 'media/icon-davidson-course-compass.jpg',
};

const all = projects as Project[];
const cards = SHOWN.map((id) => all.find((p) => p.id === id)).filter(Boolean) as Project[];

/**
 * Act three. The things that exist because he made them.
 *
 * Four marks on the forest ground, entering on a stagger so they read as a
 * list being assembled rather than a grid appearing. Names come from
 * projects.json, so the cards cannot disagree with the Built section.
 */
export const Built: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fade = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: verde.forest,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fade,
      }}
    >
      <div style={{ position: 'absolute', top: 120, left: 96 }}>
        <ActLabel>Built</ActLabel>
      </div>

      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
        {cards.map((p, i) => {
          const s = spring({ frame: frame - 10 - i * 7, fps, config: { damping: 200 } });
          return (
            <div
              key={p.id}
              style={{
                width: 330,
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [44, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 330,
                  height: 330,
                  borderRadius: 28,
                  overflow: 'hidden',
                  background: verde.sage,
                }}
              >
                <Img
                  src={staticFile(ART[p.id])}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              {/* Two lines, reserved. The names come from projects.json and run
                  from "Verde" to "Davidson Course Compass", so they wrap to
                  different depths and the subtitles sat at four different
                  heights. 36px rather than the titleLg 48: at 48 the longest
                  name took three lines, overran the reserved block and printed
                  on top of its own subtitle. At 36 it takes two. */}
              <div
                style={{
                  ...type.titleLg,
                  fontSize: 36,
                  lineHeight: '44px',
                  color: verde.onForest,
                  marginTop: 20,
                  height: 88,
                  display: 'flex',
                  alignItems: 'flex-start',
                }}
              >
                {p.org}
              </div>
              <div style={{ ...type.caption, color: verde.onForest, opacity: 0.6 }}>{p.role}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
