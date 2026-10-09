import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ActLabel, ArcLine } from '../parts';
import { type, verde } from '../theme';
import profile from '../../src/content/profile.json';
import work from '../../src/content/work.json';

const arc = (profile as { arc: string[][] }).arc;

type Role = { id: string; role: string; org: string; start: string; end: string | null };

/* The same five Prophet roles the work strip shows, read from the same file, so
   a new role appears in the film the next time it is rendered rather than
   requiring the script to be edited. */
const roles = (work as Role[]).filter((e) => e.org === 'Prophet').slice(0, 5);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (v: string | null) => {
  if (!v) return 'Present';
  const [y, m] = v.split('-').map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
};

/**
 * Act two. Zero becomes one, over the rooms the work happened in.
 *
 * The photographs run behind the line rather than beside it. They are evidence,
 * not the subject, so they sit at low contrast under a scrim and the type stays
 * the thing in focus. Each room holds for a beat and the next one cross-fades
 * in: five rooms across the act, which is the same five the work strip shows,
 * in the same order.
 */
export const Work: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const per = durationInFrames / roles.length;
  const index = Math.min(roles.length - 1, Math.floor(frame / per));
  const within = (frame % per) / per;

  const progress = interpolate(frame, [6, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fade = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill style={{ background: verde.forest, opacity: fade }}>
      {/* Both the outgoing and incoming room are mounted across the cut, so the
          cross-fade has something to fade to. A slow push keeps a still
          photograph from reading as a frozen frame. */}
      {roles.map((r, i) => {
        const active = i === index;
        const entering = active && within < 0.12;
        const opacity = active ? (entering ? interpolate(within, [0, 0.12], [0, 1]) : 1) : 0;
        const scale = 1.04 + (active ? within * 0.04 : 0);
        return (
          <AbsoluteFill key={r.id} style={{ opacity }}>
            <Img
              src={staticFile(`media/work-${i + 1}.jpg`)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${scale})`,
              }}
            />
          </AbsoluteFill>
        );
      })}

      {/* Forest at high alpha rather than black: the film should stay inside the
          site's palette even where it is only darkening a photograph. */}
      <AbsoluteFill style={{ background: verde.forest, opacity: 0.82 }} />

      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ArcLine
          from={arc[1][0]}
          to={arc[1][1]}
          progress={progress}
          style={type.displayLg}
          arrowSize={62}
          gap={28}
        />
      </AbsoluteFill>

      {/* The role being shown, bottom left, where the work strip puts it. */}
      <AbsoluteFill style={{ justifyContent: 'flex-end', padding: 96 }}>
        <ActLabel delay={4}>Prophet</ActLabel>
        <div
          key={roles[index].id}
          style={{
            ...type.headlineLg,
            color: verde.onForest,
            marginTop: 14,
            opacity: interpolate(within, [0, 0.1, 0.9, 1], [0, 1, 1, 0.3]),
          }}
        >
          {roles[index].role}
        </div>
        <div style={{ ...type.titleMd, color: verde.onForest, opacity: 0.6, marginTop: 6 }}>
          {fmt(roles[index].start)} to {fmt(roles[index].end)}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
