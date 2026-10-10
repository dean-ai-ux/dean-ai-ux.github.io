import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame } from 'remotion';
import { Glass } from '../glass';
import { DarkGround, PhotoGround, Sweep } from '../light';
import { ease, ramp, springs } from '../motion';
import { apple, At, Chip, dim, useWidths } from './kit';
import work from '../../src/content/work.json';
import projects from '../../src/content/projects.json';
import education from '../../src/content/education.json';

const pop = (frame: number, delay: number, cfg: keyof typeof springs = 'pop') =>
  spring({ frame: frame - delay, fps: 30, config: springs[cfg] });

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (v: string | null) => {
  if (!v) return 'Present';
  const [y, m] = v.split('-').map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
};

/* ---------------------------------------------------------------- shot 4 ---
   Proof of the first thought. "a founding member of the AI Foundry" (about.json),
   then every Prophet role from work.json, stacked like notifications. */

type Role = { id: string; role: string; org: string; start: string; end: string | null };
const ROLES = (work as Role[]).filter((r) => r.org === 'Prophet');

export const ShotFoundry: React.FC = () => {
  const frame = useCurrentFrame();
  const head = ramp(frame, [0, 18], [0, 1], ease.enter);
  const ground = <PhotoGround src="media/work-1.jpg" dim={0.58} push={1} />;

  const CARD = { x: 1010, w: 760, h: 132 };
  /* Each card steps back 108px, enough that every role stays readable. The
     first version stepped 44px, iOS-notification tight, and the roles behind
     the front card printed over one another as garble. */
  const FRONT_Y = 720;
  const STEP = 108;

  return (
    <AbsoluteFill>
      {ground}
      <At align="left" x={150} y={500}>
        <div style={{ ...apple.label, color: dim(0.6 * head), marginBottom: 22 }}>Prophet</div>
        <div style={{ ...apple.display, fontSize: 96, opacity: head }}>
          Founding member
          <br />
          of the AI Foundry.
        </div>
      </At>

      {/* Back to front, so the newest role is drawn last and sits on top. */}
      {ROLES.map((r, i) => i)
        .reverse()
        .map((i) => {
          const r = ROLES[i];
          const p = pop(frame, 14 + (ROLES.length - 1 - i) * 6);
          const depth = i; // 0 is the newest, in front
          const y = FRONT_Y - depth * STEP + (1 - p) * 120;
          const scale = 1 - depth * 0.035;
          return (
            <div
              key={r.id}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: Math.min(1, p * 1.3) * (1 - depth * 0.13),
                transform: `scale(${scale})`,
                transformOrigin: `${CARD.x + CARD.w / 2}px ${FRONT_Y}px`,
              }}
            >
              <Glass rect={{ x: CARD.x, y, w: CARD.w, h: CARD.h }} radius={34} backdrop={ground} sheen={0.25 + p * 0.25}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '0 30px', height: '100%' }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 18,
                      background: 'rgba(0,0,0,0.35)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Img src={staticFile('media/prophet-mark.png')} style={{ height: 34 }} />
                  </div>
                  <div>
                    <div style={{ ...apple.body, fontSize: 36, fontWeight: 650 }}>{r.role}</div>
                    <div style={{ ...apple.body, fontSize: 24, color: dim(0.6), marginTop: 4 }}>
                      {fmt(r.start)} – {fmt(r.end)}
                    </div>
                  </div>
                </div>
              </Glass>
            </div>
          );
        })}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- shot 6 ---
   Proof of the second thought. This site, a living resume, scrolling inside a
   glass window, then the projects in a glass dock (projects.json). */

type Project = { id: string; org: string };
const DOCK = ['verde-design-system', 'fed-chair-for-a-year', 'maia', 'davidson-course-compass'];
const ICON: Record<string, string> = {
  'verde-design-system': 'media/icon-verde-design-system.jpg',
  'fed-chair-for-a-year': 'media/icon-fed-chair-for-a-year.jpg',
  maia: 'media/maia.jpg',
  'davidson-course-compass': 'media/icon-davidson-course-compass.jpg',
};
const DOCKED = DOCK.map((id) => (projects as Project[]).find((p) => p.id === id)!).filter(Boolean);

export const ShotLive: React.FC = () => {
  const frame = useCurrentFrame();
  const win = pop(frame, 0, 'glide');
  const dock = pop(frame, 30, 'glide');
  /* The icon being named this moment; at the key frame, Fed Chair. */
  const named = Math.min(DOCKED.length - 1, Math.max(0, Math.floor((frame - 44) / 14)));
  const ground = <DarkGround />;
  const tagStyle = { ...apple.body, fontSize: 30, fontWeight: 600 };
  const tags = useWidths(DOCKED.map((p) => p.org), tagStyle);

  const WIN = { x: 430, y: 56 + (1 - win) * 80, w: 1060, h: 600 };
  /* The landing page is short: past about 150px of travel the window shows
     only the blank white below the last row of tiles, and the first cut of
     this shot spent its second half scrolled into that empty space. */
  const scroll = ramp(frame, [20, 100], [0, -140], ease.inOut);

  const DW = 640;
  const DH = 150;
  const DX = 960 - DW / 2;
  const DY = 790 + (1 - dock) * 160;

  /* Icons are 112px with 30px between them, centred in the dock. The tag sits
     centred over whichever icon is lifted. */
  const ICON_SIZE = 112;
  const ICON_GAP = 30;
  const row = DOCKED.length * ICON_SIZE + (DOCKED.length - 1) * ICON_GAP;
  const iconCentre = (i: number) => DX + (DW - row) / 2 + ICON_SIZE / 2 + i * (ICON_SIZE + ICON_GAP);
  const tagW = tags.get(named, 30) + 64;

  return (
    <AbsoluteFill>
      {tags.probe}
      {ground}

      <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, win * 1.3) }}>
        <Glass rect={WIN} radius={30} backdrop={ground} sheen={0.2 + win * 0.2}>
          <div style={{ height: 54, display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 22 }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
              <span key={c} style={{ width: 13, height: 13, borderRadius: '50%', background: c }} />
            ))}
            <span
              style={{
                ...apple.body,
                fontSize: 19,
                fontWeight: 500,
                color: dim(0.8),
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '6px 18px',
                marginLeft: 250,
              }}
            >
              dean-ai-ux.github.io
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 10,
              right: 10,
              top: 54,
              bottom: 10,
              borderRadius: 20,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <Img
              src={staticFile('media/film-site.jpg')}
              style={{ width: '100%', display: 'block', transform: `translateY(${scroll}px)` }}
            />
          </div>
        </Glass>
      </div>

      <div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, dock * 1.4) }}>
        <Glass rect={{ x: DX, y: DY, w: DW, h: DH }} radius={46} backdrop={ground} sheen={0.3}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: ICON_GAP, height: '100%' }}>
            {DOCKED.map((p, i) => {
              const inn = pop(frame, 36 + i * 4);
              const lifted = i === named && frame > 44;
              return (
                <div
                  key={p.id}
                  style={{
                    width: ICON_SIZE,
                    height: ICON_SIZE,
                    borderRadius: 26,
                    overflow: 'hidden',
                    transform: `translateY(${lifted ? -20 : 0}px) scale(${inn * (lifted ? 1.12 : 1)})`,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
                  }}
                >
                  <Img src={staticFile(ICON[p.id])} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              );
            })}
          </div>
        </Glass>
      </div>

      {/* The name of the lifted icon, on its own small glass tag above the dock. */}
      {frame > 44 && DOCKED[named] && (
        <Chip
          rect={{ x: iconCentre(named) - tagW / 2, y: DY - 92, w: tagW, h: 64 }}
          backdrop={ground}
          textStyle={{ fontSize: 30, fontWeight: 600 }}
        >
          {DOCKED[named].org}
        </Chip>
      )}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- shot 8 ---
   Proof of the third thought. The Fed Challenge team became ECO 386
   (education.json); two facts in glass: "The inaugural team placed in the top
   15% of 120 participating institutions" (education.json) and "co-authored a
   paper on adapting rules-based policy to crisis intervention" (about.json). */

type Edu = { id: string; outcomes?: { claim: string }[] };
const fed = (education as Edu[]).find((e) => e.id === 'davidson-fed-challenge');
const HAS_TOP15 = !!fed?.outcomes?.some((o) => /top 15%/i.test(o.claim));

export const ShotEco: React.FC = () => {
  const frame = useCurrentFrame();
  const head = ramp(frame, [0, 16], [0, 1], ease.enter);
  const lens = pop(frame, 12);
  const c1 = pop(frame, 30);
  const c2 = pop(frame, 38);

  const Scene: React.FC = () => (
    <>
      <PhotoGround src="media/fed-challenge.jpg" dim={0.66} push={1} />
      <At align="left" x={150} y={330}>
        <span style={{ ...apple.title, color: dim(0.55 * head) }}>Fed Challenge</span>
      </At>
      <At align="left" x={150} y={500}>
        <span style={{ ...apple.hero, fontSize: 180, opacity: head }}>ECO 386</span>
      </At>
    </>
  );
  const scene = <Scene />;
  const eco = useWidths(['ECO 386'], { ...apple.hero, fontSize: 180 });
  const facts = useWidths(['Top 15% of 120 institutions', 'Co-authored paper on rules-based policy'], apple.body);
  const LPAD = 60;
  const lw = eco.get(0, 180) + LPAD * 2;
  const lh = 230;

  return (
    <AbsoluteFill>
      {eco.probe}
      {facts.probe}
      {scene}
      <Glass
        rect={{ x: 150 - LPAD + (1 - lens) * 700, y: 500 - lh / 2, w: lw, h: lh }}
        radius={lh / 2}
        backdrop={scene}
        sheen={0.2 + lens * 0.4}
      >
        <Sweep progress={ramp(frame, [24, 54], [0, 1], ease.inOut)} strength={0.25} />
      </Glass>
      {HAS_TOP15 && (
        <Chip
          rect={{ x: 150, y: 720, w: facts.get(0) + 100, h: 96 }}
          backdrop={scene}
          opacity={Math.min(1, c1 * 1.4)}
          lift={(1 - c1) * 60}
        >
          Top 15% of 120 institutions
        </Chip>
      )}
      <Chip
        rect={{ x: 150, y: 840, w: facts.get(1) + 100, h: 96 }}
        backdrop={scene}
        opacity={Math.min(1, c2 * 1.4)}
        lift={(1 - c2) * 60}
      >
        Co-authored paper on rules-based policy
      </Chip>
    </AbsoluteFill>
  );
};
