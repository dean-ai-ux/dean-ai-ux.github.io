import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';
import { ActLabel } from '../parts';
import { GradientField, RuleGrid } from '../backdrops';
import { ease, ramp, stagger, useDrift } from '../motion';
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
 * Act four. The things that exist because he made them.
 *
 * Four marks entering on a stagger. The stagger is the whole effect: four
 * things arriving together is a grid appearing, four things arriving seven
 * frames apart is a list being set down, and the second reads as considered.
 */
export const Built: React.FC = () => {
  const frame = useCurrentFrame();
  const sway = useDrift(620, 5, 90);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <GradientField seed="built" intensity={0.75} />
      <RuleGrid opacity={0.045} spacing={160} />

      <div style={{ position: 'absolute', top: 120, left: 96 }}>
        <ActLabel>Built</ActLabel>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 40,
          alignItems: 'flex-start',
          transform: `translateX(${sway}px)`,
        }}
      >
        {cards.map((p, i) => {
          const t = ramp(frame - stagger(i, 7, 8), [0, 30], [0, 1], ease.enter);
          return (
            <div
              key={p.id}
              style={{
                width: 330,
                opacity: t,
                transform: `translateY(${(1 - t) * 48}px)`,
              }}
            >
              <div
                style={{
                  width: 330,
                  height: 330,
                  borderRadius: 28,
                  overflow: 'hidden',
                  background: verde.sage,
                  /* The shadow grows with the card, so it reads as the card
                     settling onto a ground rather than as part of the card. */
                  boxShadow: `0 ${18 * t}px ${44 * t}px rgba(0,0,0,${0.4 * t})`,
                }}
              >
                <Img
                  src={staticFile(ART[p.id])}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              {/* Two lines, reserved. The names come from projects.json and run
                  from "Verde" to "Davidson Course Compass", so they wrap to
                  different depths and the subtitles would otherwise sit at four
                  different heights. 36px rather than titleLg's 48: at 48 the
                  longest name took three lines and printed over its subtitle. */}
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
