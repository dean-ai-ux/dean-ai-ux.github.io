import React from 'react';
import { AbsoluteFill, Img, spring, staticFile, useCurrentFrame } from 'remotion';
import { Glass } from '../glass';
import { Box, curve, Line, Lines } from '../diagram';
import { DarkGround, PhotoGround } from '../light';
import { ease, ramp, springs } from '../motion';
import { dim, useOrientation, useType } from '../layout';
import { Eyebrow, useWidths } from './kit';
import work from '../../src/content/work.json';

const pop = (frame: number, delay: number) => spring({ frame: frame - delay, fps: 30, config: springs.pop });

/* ---------------------------------------------------------------- shot 3 ---
   "General-purpose models make it easy to generate an answer. Professional
    work requires more: the right data, domain-specific tools, consistent
    methods, transparent reasoning, and results that can be verified."
   (about.json, verbatim). Drawn as what it describes: one model producing an
   answer, then the five things professional work needs, connected to it. */

const NEEDS = ['the right data', 'domain-specific tools', 'consistent methods', 'transparent reasoning', 'results that can be verified'];

export const ShotSystem: React.FC = () => {
  const frame = useCurrentFrame();
  const { portrait, cx } = useOrientation();
  const t = useType();
  const ground = <DarkGround />;

  const nodeText = { ...t.small, fontWeight: 600 };
  const modelText = { ...t.body, fontWeight: 650 };
  const nodes = useWidths(NEEDS, nodeText);
  const model = useWidths(['General-purpose', 'model'], modelText);
  const answer = useWidths(['an answer'], nodeText);

  /* Act one: a model on its own, and the answer it makes easy. */
  const s1 = ramp(frame, [0, 14], [0, 1], ease.enter) * ramp(frame, [50, 60], [1, 0], ease.exit);
  const mP = pop(frame, 6);
  const aP = pop(frame, 18) * ramp(frame, [50, 60], [1, 0], ease.exit);
  /* Act two: what professional work requires, assembling around it. */
  const s2 = ramp(frame, [56, 68], [0, 1], ease.enter);
  const nP = NEEDS.map((_, i) => pop(frame, 60 + i * 5));
  const lineP = NEEDS.map((_, i) => ramp(frame, [66 + i * 5, 80 + i * 5], [0, 1], ease.inOut));

  const MW = Math.max(model.get(0, 48), model.get(1, 48)) + 90;
  const MH = portrait ? 200 : 180;
  const M = portrait ? { x: cx - MW / 2, y: 610, w: MW, h: MH } : { x: cx - MW / 2, y: 510, w: MW, h: MH };
  const mcy = M.y + MH / 2;

  const NH = 104;
  const nw = (i: number) => nodes.get(i, 44) + 80;
  type R = { x: number; y: number; w: number; h: number };
  let rects: R[];
  let lines: Line[];
  if (!portrait) {
    const at = (i: number, ccx: number, ccy: number): R => ({ x: ccx - nw(i) / 2, y: ccy - NH / 2, w: nw(i), h: NH });
    rects = [at(0, 380, 470), at(1, 390, 760), at(2, 1540, 470), at(3, 1530, 760), at(4, 960, 905)];
    const L = M.x;
    const Rt = M.x + MW;
    lines = [
      { d: curve(L, mcy, rects[0].x + rects[0].w, rects[0].y + NH / 2), progress: lineP[0] },
      { d: curve(L, mcy, rects[1].x + rects[1].w, rects[1].y + NH / 2), progress: lineP[1] },
      { d: curve(Rt, mcy, rects[2].x, rects[2].y + NH / 2), progress: lineP[2] },
      { d: curve(Rt, mcy, rects[3].x, rects[3].y + NH / 2), progress: lineP[3] },
      { d: curve(cx, M.y + MH, cx, rects[4].y, true), progress: lineP[4] },
    ];
  } else {
    /* A spine down the left with a branch to each node, so no line ever runs
       behind a node above it. */
    const SPINE = 110;
    rects = NEEDS.map((_, i) => ({ x: SPINE + 70, y: 930 + i * 132, w: nw(i), h: NH }));
    const spineEnd = rects[4].y + NH / 2;
    const spineD = `M ${cx} ${M.y + MH} C ${cx} ${M.y + MH + 60}, ${SPINE} ${M.y + MH + 30}, ${SPINE} ${M.y + MH + 110} L ${SPINE} ${spineEnd}`;
    lines = [
      { d: spineD, progress: ramp(frame, [62, 84], [0, 1], ease.inOut) },
      ...rects.map((r, i) => ({ d: `M ${SPINE} ${r.y + NH / 2} L ${r.x} ${r.y + NH / 2}`, progress: lineP[i] })),
    ];
  }

  const A = portrait
    ? { x: cx - (answer.get(0, 44) + 80) / 2, y: 900, w: answer.get(0, 44) + 80, h: 96 }
    : { x: 1390, y: mcy - 48, w: answer.get(0, 44) + 80, h: 96 };
  const answerLine: Line = portrait
    ? { d: curve(cx, M.y + MH, cx, A.y, true), progress: aP }
    : { d: curve(M.x + MW, mcy, A.x, mcy), progress: aP };

  const top = portrait ? 270 : 150;
  const sentence = (lines1: string[], o: number) => (
    <div
      style={{
        position: 'absolute',
        left: portrait ? 80 : 0,
        right: portrait ? 80 : 0,
        top,
        textAlign: portrait ? 'left' : 'center',
        ...t.title,
        opacity: o,
        transform: `translateY(${(1 - Math.min(1, o * 1.2)) * 12}px)`,
      }}
    >
      {lines1.map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  );

  return (
    <AbsoluteFill>
      {nodes.probe}
      {model.probe}
      {answer.probe}
      {ground}
      <Eyebrow>On AI</Eyebrow>

      {sentence(
        portrait
          ? ['General-purpose models', 'make it easy to generate', 'an answer.']
          : ['General-purpose models make it easy', 'to generate an answer.'],
        s1,
      )}
      {sentence(['Professional work requires more:'], s2)}

      <Lines lines={[...(aP > 0.01 ? [{ ...answerLine, color: 'rgba(255,255,255,0.3)' }] : []), ...lines]} />

      <Box rect={M} backdrop={ground} textStyle={modelText} appear={mP} radius={44}>
        General-purpose
        <br />
        model
      </Box>
      {aP > 0.01 && (
        <Box rect={A} backdrop={ground} textStyle={{ ...nodeText, color: dim(0.6) }} appear={aP} tint={0.03}>
          an answer
        </Box>
      )}
      {NEEDS.map((n, i) => (
        <Box key={n} rect={rects[i]} backdrop={ground} textStyle={nodeText} appear={nP[i]}>
          {n}
        </Box>
      ))}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- shot 4 ---
   "a founding member of the AI Foundry" (about.json), over the Prophet office,
   with every Prophet role from work.json rising as a stack of glass cards,
   newest in front, the way notifications stack.

   This is the design from the first Apple cut, which Dean preferred to the
   to-scale timeline tried in storyboard v2. It returns at the v2 type floor:
   the original set dates at 24px and titles at 36px, which on a phone would
   have rendered at 9 and 13 pixels. */

type Role = { id: string; role: string; org: string; start: string; end: string | null };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmt = (v: string | null) => {
  if (!v) return 'Present';
  const [y, m] = v.split('-').map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
};
/* Newest first, as work.json lists them, so index 0 is the card in front. */
const ROLES = (work as Role[]).filter((r) => r.org === 'Prophet');

export const ShotFoundry: React.FC = () => {
  const frame = useCurrentFrame();
  const { portrait } = useOrientation();
  const t = useType();
  const ground = <PhotoGround src="media/work-1.jpg" dim={0.6} push={1} />;
  const head = ramp(frame, [0, 16], [0, 1], ease.enter);

  const CARD = portrait ? { x: 60, w: 960 } : { x: 960, w: 860 };
  const FRONT_Y = portrait ? 1540 : 790;
  const ICON = portrait ? 92 : 84;
  const PAD_X = 32;
  const GAP_X = 28;
  /* Each card is as tall as its own text. Titles are measured; one that will
     not fit on a line gets a second. The first version gave every card one
     height and stepped them closer than that height, so the card in front hid
     the date line of the card behind it. */
  const titleStyle = { ...t.body, fontWeight: 650, lineHeight: 1.12 };
  const titles = useWidths(ROLES.map((r) => r.role), titleStyle);
  const textRoom = CARD.w - PAD_X * 2 - ICON - GAP_X;
  const titleLine = Number(titleStyle.fontSize) * 1.12;
  const dateLine = Number(t.small.fontSize) * 1.2;
  const VPAD = 30;
  /* Well under VPAD, so the card in front only ever covers empty margin. At 26
     and 18 the clearance was 8px and the bottoms of dates still touched the
     card in front on the phone cut. */
  const OVERLAP = 14;
  const heights = ROLES.map((_, i) => {
    /* A margin, not an exact comparison: "Associate, Digital Transformation"
       measured a few pixels under the room available but wrapped in the real
       layout, and a card sized for one line hid its own date. */
    const lines = titles.get(i, 48) > textRoom - 40 ? 2 : 1;
    return Math.round(lines * titleLine + 6 + dateLine + VPAD * 2);
  });
  /* Top of each card, newest (index 0) in front, the rest stepping upward. */
  const tops: number[] = [];
  ROLES.forEach((_, i) => {
    tops[i] = i === 0 ? FRONT_Y : tops[i - 1] - (heights[i] - OVERLAP);
  });

  return (
    <AbsoluteFill>
      {titles.probe}
      {ground}
      <Eyebrow appear={head}>At Prophet</Eyebrow>
      <div
        style={{
          position: 'absolute',
          left: portrait ? 80 : 120,
          right: portrait ? 80 : undefined,
          top: portrait ? 280 : 400,
          ...t.display,
          fontSize: portrait ? 104 : 96,
          opacity: head,
          transform: `translateY(${(1 - head) * 14}px)`,
        }}
      >
        Founding member
        <br />
        of the AI Foundry.
      </div>

      {/* Back to front, so the newest role is drawn last and sits on top. */}
      {ROLES.map((_, i) => i)
        .reverse()
        .map((depth) => {
          const r = ROLES[depth];
          const p = pop(frame, 12 + (ROLES.length - 1 - depth) * 6);
          const h = heights[depth];
          const y = tops[depth] + (1 - p) * 120;
          /* Scaled about its own centre, so depth narrows a card without
             pulling it toward the others. */
          const scale = 1 - depth * 0.02;
          return (
            <div
              key={r.id}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: Math.min(1, p * 1.3) * (1 - depth * 0.05),
                transform: `scale(${scale})`,
                transformOrigin: `${CARD.x + CARD.w / 2}px ${tops[depth] + h / 2}px`,
              }}
            >
              <Glass rect={{ x: CARD.x, y, w: CARD.w, h }} radius={36} backdrop={ground} sheen={0.25 + p * 0.25} shade={0.42}>
                <div style={{ display: 'flex', alignItems: 'center', gap: GAP_X, padding: `0 ${PAD_X}px`, height: '100%' }}>
                  <div
                    style={{
                      width: ICON,
                      height: ICON,
                      borderRadius: 22,
                      background: 'rgba(0,0,0,0.38)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Img src={staticFile('media/prophet-mark.png')} style={{ height: ICON * 0.44 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={titleStyle}>{r.role}</div>
                    <div style={{ ...t.small, color: dim(0.78), marginTop: 6 }}>
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
