import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame } from 'remotion';
import { Glass } from '../glass';
import { DarkGround, Sweep, DEFAULT_GLOWS } from '../light';
import { ease, ramp, springs, usePop } from '../motion';
import { verde } from '../theme';
import { apple, At, Chip, dim, useWidths } from './kit';

/**
 * The three thoughts, each from about.json. On-screen words are trimmed from
 * his sentences, never reworded. The source sentence is quoted above each shot.
 *
 * Every piece of glass that frames words is sized from the measured width of
 * those words, not from a character count.
 */

const popAt = (frame: number, delay: number) =>
  spring({ frame: frame - delay, fps: 30, config: springs.pop });

/* ---------------------------------------------------------------- shot 2 ---
   "what separates useful AI from merely impressive AI" */

const S2_Y = 560;
const S2Scene: React.FC<{ ghost: number; word: number }> = ({ ghost, word }) => (
  <DarkGround>
    <At y={S2_Y - 200}>
      <span style={{ ...apple.title, color: dim(0.38 * ghost) }}>Merely impressive.</span>
    </At>
    <At y={S2_Y}>
      <span style={{ ...apple.hero, opacity: word }}>Useful.</span>
    </At>
  </DarkGround>
);

export const ShotUseful: React.FC = () => {
  const frame = useCurrentFrame();
  const ghost = ramp(frame, [0, 14], [0, 1], ease.enter);
  const word = ramp(frame, [22, 40], [0, 1], ease.enter);
  const lens = usePop(18);
  const m = useWidths(['Useful.'], apple.hero);

  const w = m.get(0, 210) + 130;
  const h = 260;
  /* The lens arrives from the right and settles over the word. */
  const x = 960 - w / 2 + (1 - lens) * 900;
  const scene = <S2Scene ghost={ghost} word={word} />;

  return (
    <AbsoluteFill>
      {m.probe}
      {scene}
      <Glass rect={{ x, y: S2_Y - h / 2, w, h }} radius={h / 2} backdrop={scene} sheen={0.15 + lens * 0.4}>
        <Sweep progress={ramp(frame, [40, 70], [0, 1], ease.inOut)} strength={0.3} />
      </Glass>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- shot 3 ---
   "Professional work requires more: the right data, domain-specific tools,
    consistent methods, transparent reasoning, and results that can be verified." */

const NEEDS = [
  'the right data',
  'domain-specific tools',
  'consistent methods',
  'transparent reasoning',
  'results that can be verified',
];

/* Two loose rows, three then two. Each chip is centred on its x and floats at a
   slightly different depth so the group reads as hovering, not as a grid. */
const CHIP_LAYOUT = [
  { cx: 470, y: 470, depth: 1 },
  { cx: 960, y: 440, depth: 0.96 },
  { cx: 1450, y: 480, depth: 0.98 },
  { cx: 700, y: 640, depth: 0.97 },
  { cx: 1250, y: 660, depth: 1 },
];
const CHIP_PAD = 100;

const S3Ground: React.FC = () => (
  <DarkGround
    glows={[
      { x: 26, y: 58, r: 0.42, color: verde.sage, alpha: 0.6 },
      { x: 78, y: 40, r: 0.36, color: '#1F6B4F', alpha: 0.55 },
      { x: 52, y: 85, r: 0.3, color: verde.brass, alpha: 0.16 },
    ]}
  />
);

export const ShotNeeds: React.FC = () => {
  const frame = useCurrentFrame();
  const lead = ramp(frame, [2, 20], [0, 1], ease.enter);
  const ground = <S3Ground />;
  const m = useWidths(NEEDS, apple.body);

  return (
    <AbsoluteFill>
      {m.probe}
      {ground}
      <At y={300}>
        <span style={{ ...apple.title, color: dim(0.72 * lead) }}>Professional work requires more:</span>
      </At>
      {NEEDS.map((n, i) => {
        const p = popAt(frame, 16 + i * 7);
        const L = CHIP_LAYOUT[i];
        const w = m.get(i) + CHIP_PAD;
        return (
          <Chip
            key={n}
            rect={{ x: L.cx - w / 2, y: L.y, w, h: 96 }}
            backdrop={ground}
            opacity={Math.min(1, p * 1.4)}
            lift={(1 - p) * 60}
            scale={L.depth * (0.9 + 0.1 * p)}
            sheen={0.2 + p * 0.3}
          >
            {n}
          </Chip>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- shot 5 ---
   "A presentation captures the best thinking available at a particular moment.
    AI-enabled deliverables can remain active" */

const S5_Y = 610;
const S5_SIZE = 170;
const ARROW_GAP = 42;
const s5Word = { ...apple.hero, fontSize: S5_SIZE };
const s5Arrow = { ...apple.hero, fontSize: S5_SIZE, fontWeight: 400 };

const S5Scene: React.FC<{ line: number; arc: number }> = ({ line, arc }) => (
  <DarkGround glows={DEFAULT_GLOWS}>
    <At y={360}>
      <span style={{ ...apple.title, color: dim(0.62 * line) }}>A presentation captures a moment.</span>
    </At>
    <At y={S5_Y}>
      <span style={{ opacity: arc }}>
        <span style={{ ...s5Word, color: dim(0.45) }}>Static</span>
        <span style={{ ...s5Arrow, color: dim(0.4), margin: `0 ${ARROW_GAP}px` }}>→</span>
        <span style={s5Word}>Living</span>
      </span>
    </At>
  </DarkGround>
);

export const ShotLiving: React.FC = () => {
  const frame = useCurrentFrame();
  const line = ramp(frame, [0, 16], [0, 1], ease.enter);
  const arc = ramp(frame, [20, 36], [0, 1], ease.enter);
  const lens = usePop(30);
  const words = useWidths(['Static', 'Living'], s5Word);
  const arrow = useWidths(['→'], s5Arrow);
  const scene = <S5Scene line={line} arc={arc} />;

  /* The line is centred, so where "Living" starts follows from what is to its
     left. The lens rests on that word with even padding either side. */
  const staticW = words.get(0, S5_SIZE);
  const livingW = words.get(1, S5_SIZE);
  const arrowW = arrow.get(0, S5_SIZE) + ARROW_GAP * 2;
  const total = staticW + arrowW + livingW;
  const livingX = 960 - total / 2 + staticW + arrowW;
  const PAD = 60;
  const w = livingW + PAD * 2;
  const h = 230;
  const restX = livingX - PAD;
  const x = restX - (1 - lens) * 700;

  return (
    <AbsoluteFill>
      {words.probe}
      {arrow.probe}
      {scene}
      <Glass rect={{ x, y: S5_Y - h / 2, w, h }} radius={h / 2} backdrop={scene} sheen={0.2 + lens * 0.4} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- shot 7 ---
   "forward guidance works only when paired with explicit thresholds" */

const LINE1 = ['Forward', 'guidance', 'works'];
const LINE2 = ['only', 'with', 'explicit', 'thresholds.'];

/* Words are separated by real spaces rather than margins, so the measured
   width of a prefix string is exactly where the next word begins. The lensed
   last word gets LENS_GAP of extra room before it: glass refracts most at its
   rim, and with only a word space to work in, the rim pushed the first letter
   of "thresholds." against "explicit" until the line read "explicitthresholds". */
const LENS_GAP = 48;
const Words: React.FC<{ words: string[]; opacity: number[]; lensLast?: boolean }> = ({
  words,
  opacity,
  lensLast = false,
}) => (
  <span style={apple.display}>
    {words.map((t, i) => (
      <span
        key={t}
        style={{
          opacity: opacity[i] ?? 0,
          marginLeft: lensLast && i === words.length - 1 ? LENS_GAP : 0,
        }}
      >
        {t}
        {i < words.length - 1 ? ' ' : ''}
      </span>
    ))}
  </span>
);

const S7Scene: React.FC<{ reveal: number[] }> = ({ reveal }) => (
  <DarkGround
    glows={[
      { x: 70, y: 38, r: 0.4, color: verde.sage, alpha: 0.5 },
      { x: 30, y: 70, r: 0.38, color: '#1F6B4F', alpha: 0.5 },
      { x: 82, y: 72, r: 0.26, color: verde.brass, alpha: 0.22 },
    ]}
  >
    <At y={430}>
      <Words words={LINE1} opacity={reveal.slice(0, 3)} />
    </At>
    <At y={590}>
      <Words words={LINE2} opacity={reveal.slice(3)} lensLast />
    </At>
  </DarkGround>
);

export const ShotThresholds: React.FC = () => {
  const frame = useCurrentFrame();
  /* Word by word, the Apple keynote reveal. */
  const reveal = Array.from({ length: 7 }, (_, i) => ramp(frame - i * 5, [0, 12], [0, 1], ease.enter));
  const lens = usePop(40);
  const m = useWidths([LINE2.join(' '), LINE2.slice(0, 3).join(' ') + ' ', 'thresholds.'], apple.display);
  const scene = <S7Scene reveal={reveal} />;

  const total = m.get(0, 124) + LENS_GAP;
  const before = m.get(1, 124) + LENS_GAP;
  const word = m.get(2, 124);
  /* The rim sits in the middle of the widened gap, clear of both words. */
  const PAD = 42;
  const w = word + PAD * 2;
  const h = 190;
  const restX = 960 - total / 2 + before - PAD;

  return (
    <AbsoluteFill>
      {m.probe}
      {scene}
      <Glass
        rect={{ x: restX + (1 - lens) * 500, y: 590 - h / 2, w, h }}
        radius={h / 2}
        backdrop={scene}
        sheen={0.2 + lens * 0.4}
      />
    </AbsoluteFill>
  );
};
