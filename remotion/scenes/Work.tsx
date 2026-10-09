import React from 'react';
import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { ActLabel, ArcLine } from '../parts';
import { ease, ramp, useDrift } from '../motion';
import { type, verde } from '../theme';
import profile from '../../src/content/profile.json';
import work from '../../src/content/work.json';

const arc = (profile as { arc: string[][] }).arc;

type Role = { id: string; role: string; org: string; start: string; end: string | null };
const roles = (work as Role[]).filter((e) => e.org === 'Prophet').slice(0, 5);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (v: string | null) => {
  if (!v) return 'Present';
  const [y, m] = v.split('-').map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
};

/**
 * One room, pushed slowly, with its own Ken Burns direction.
 *
 * Each room gets a different push so five cuts in a row do not read as one
 * move repeated. Alternating the horizontal drift is enough: the eye reads
 * direction long before it reads rate.
 */
const Room: React.FC<{ index: number; length: number }> = ({ index, length }) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, [0, length], [0, 1], ease.inOut);
  const dir = index % 2 === 0 ? 1 : -1;
  const scale = 1.08 + t * 0.07;
  const x = dir * t * 26;

  /* In only. The outgoing room is covered by the incoming one, which is mounted
     above it, so fading both would show the ground through the overlap. */
  const appear = ramp(frame, [0, 14], [0, 1], ease.enter);

  return (
    <AbsoluteFill style={{ opacity: appear }}>
      <Img
        src={staticFile(`media/work-${index + 1}.jpg`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translateX(${x}px)`,
        }}
      />
      {/* Forest rather than black, so even the darkening stays inside the
          palette. Heavier at the foot, where the role sits. */}
      <AbsoluteFill style={{ background: verde.forest, opacity: 0.74 }} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, ${verde.forest} 2%, transparent 52%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Act two. Zero becomes one, over the rooms the work happened in.
 *
 * The rooms are real Sequences now rather than five layers toggled by opacity.
 * That gives each its own frame clock, so every Ken Burns starts at zero
 * instead of all five sharing the parent's frame and moving in lockstep.
 */
export const Work: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const per = Math.floor(durationInFrames / roles.length);

  const progress = ramp(frame, [8, 54], [0, 1], ease.enter);
  const index = Math.min(roles.length - 1, Math.floor(frame / per));
  const sway = useDrift(500, 5, 120);

  return (
    <AbsoluteFill style={{ background: verde.forest }}>
      {roles.map((r, i) => (
        <Sequence
          key={r.id}
          from={i * per}
          durationInFrames={i === roles.length - 1 ? durationInFrames - i * per : per + 14}
          layout="none"
        >
          <Room index={i} length={per + 14} />
        </Sequence>
      ))}

      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ transform: `translateX(${sway}px)` }}>
          <ArcLine
            from={arc[1][0]}
            to={arc[1][1]}
            progress={progress}
            style={type.displayLg}
            arrowSize={62}
            gap={28}
          />
        </div>
      </AbsoluteFill>

      {/* The role, keyed to the room behind it, entering from below each time. */}
      <AbsoluteFill style={{ justifyContent: 'flex-end', padding: 96 }}>
        <ActLabel delay={6}>Prophet</ActLabel>
        <RoleCaption role={roles[index]} from={index * per} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Animated against the frame its own role started on, not against the scene's.
 *
 * Remounting this with a key does not reset anything: useCurrentFrame reports
 * the parent's clock either way, so a `frame`-based entrance plays once for the
 * first role and never again for the other four. Passing `from` is what makes
 * the caption enter at every cut.
 */
const RoleCaption: React.FC<{ role: Role; from: number }> = ({ role, from }) => {
  const frame = useCurrentFrame();
  const enter = ramp(frame - from, [0, 20], [0, 1], ease.enter);
  return (
    <div style={{ transform: `translateY(${(1 - enter) * 16}px)`, opacity: enter }}>
      <div style={{ ...type.headlineLg, color: verde.onForest, marginTop: 14 }}>{role.role}</div>
      <div style={{ ...type.titleMd, color: verde.onForest, opacity: 0.6, marginTop: 6 }}>
        {fmt(role.start)} to {fmt(role.end)}
      </div>
    </div>
  );
};
