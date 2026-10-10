import React from 'react';
import { evolvePath } from '@remotion/paths';
import data from './data/unrate-2012-2014.json';

/**
 * The forward-guidance chart, drawn from the committed FRED series.
 *
 * What it shows is exactly what happened, and nothing more. Unemployment falls
 * toward the 6.5% threshold the FOMC set in December 2012. The policy rate
 * stays in its 0 to 1/4 percent range the whole time. In March 2014, with
 * unemployment nearing 6.5%, the Committee updated its guidance. There was no
 * rate rise in this window, so none is drawn: a hike at the crossing would be
 * the obvious diagram and it would be false.
 *
 * Two panels, not one axis. The first version plotted both series on 0 to 9%
 * so the policy rate would fit, which flattened unemployment into a line that
 * barely moved, and the fall toward the threshold was the whole story. The
 * series live on very different scales, so each gets its own: unemployment on
 * 5.6 to 8.4%, the policy rate in a strip of its own beneath.
 */

type Point = { date: string; value: number };
const POINTS = data.points as Point[];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const mi = (d: string) => {
  const [y, m] = d.split('-').map(Number);
  return y * 12 + (m - 1);
};
const START = mi(POINTS[0].date);
const END = mi(POINTS[POINTS.length - 1].date);
const Y_LO = 5.6;
const Y_HI = 8.4;

export const UnemploymentChart: React.FC<{
  width: number;
  height: number;
  line: number;
  furniture: number;
  markers: [number, number];
  type: { small: React.CSSProperties; body: React.CSSProperties };
  compact?: boolean;
}> = ({ width, height, line, furniture, markers, type, compact = false }) => {
  const fs = Number(type.small.fontSize) || 44;
  const lh = fs * 1.25;
  /* Room above the plot for the dated markers: side by side when wide, stacked
     when narrow, because side by side they printed over each other. */
  const labelZone = compact ? lh * 4 + 40 : lh * 2 + 40;
  const pad = { l: compact ? 120 : 140, r: compact ? 40 : 60, t: labelZone + 30, b: 90 };
  const STRIP = 96;
  const GAP = 56;
  const pw = width - pad.l - pad.r;
  const ph = height - pad.t - pad.b - STRIP - GAP;
  const x = (d: string) => pad.l + ((mi(d) - START) / (END - START)) * pw;
  const y = (v: number) => pad.t + ((Y_HI - v) / (Y_HI - Y_LO)) * ph;
  const stripTop = pad.t + ph + GAP;

  const d = POINTS.map((p, i) => `${i ? 'L' : 'M'} ${x(p.date).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ');
  const evo = evolvePath(Math.max(0.0001, Math.min(1, line)), d);
  const shown = Math.max(0, Math.min(POINTS.length - 1, Math.round(line * (POINTS.length - 1))));
  const lead = POINTS[shown];

  const muted: React.CSSProperties = { ...type.small, fill: 'rgba(255,255,255,0.72)', fontWeight: 500 };
  const label = (d2: string) => {
    const [yy, mm] = d2.split('-').map(Number);
    return compact ? `${MONTHS[mm - 1]} '${String(yy).slice(2)}` : `${MONTHS[mm - 1]} ${yy}`;
  };
  const xTicks = ['2012-12', '2013-06', '2013-12', '2014-06'];
  const thY = y(data.threshold);
  const ev = data.events;

  /* Marker label rows: Dec 2012 takes rows 0-1, Mar 2014 takes row 0 (wide)
     or rows 2-3 (narrow). */
  const rowY = (r: number) => 20 + fs + r * lh;

  return (
    <svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      {/* unemployment panel: grid and axis */}
      {[6, 7, 8].map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={pad.l + pw} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.09)" strokeWidth={2} />
          <text x={pad.l - 20} y={y(t) + fs * 0.35} textAnchor="end" style={muted}>
            {t}%
          </text>
        </g>
      ))}

      {/* threshold */}
      <g opacity={furniture}>
        <rect x={pad.l} y={thY - 7} width={pw} height={14} rx={7} fill="rgba(201,154,82,0.3)" />
        <line x1={pad.l} x2={pad.l + pw} y1={thY} y2={thY} stroke="#C99A52" strokeWidth={3} strokeDasharray="14 10" />
        {/* Left, not right: on the right the line is converging on 6.5% and
            the label sat on top of it. On the left the line is still near 8%. */}
        <text x={pad.l + 18} y={thY - 22} style={{ ...muted, fill: '#E2B871', fontWeight: 650 }}>
          6.5% threshold
        </text>
      </g>

      {/* policy rate strip, on its own scale */}
      <g opacity={furniture}>
        <line x1={pad.l} x2={pad.l + pw} y1={stripTop + STRIP} y2={stripTop + STRIP} stroke="rgba(255,255,255,0.12)" strokeWidth={2} />
        <rect x={pad.l} y={stripTop + STRIP - 22} width={pw} height={20} rx={6} fill="rgba(122,199,150,0.75)" />
        <text x={pad.l} y={stripTop + STRIP - 40} style={{ ...muted, fill: '#9ED3B1', fontWeight: 650 }}>
          Policy rate, 0 to ¼%
        </text>
      </g>

      {/* x axis */}
      {xTicks.map((t, i) => (
        <text
          key={t}
          x={x(t)}
          y={stripTop + STRIP + fs + 26}
          textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
          style={muted}
        >
          {label(t)}
        </text>
      ))}

      {/* dated markers */}
      {ev.map((e, i) => {
        const mx = x(e.date);
        const o = markers[i] ?? 0;
        const right = i === ev.length - 1;
        const r0 = right && compact ? 2 : 0;
        const anchor = right ? 'end' : 'start';
        const tx = mx + (right ? -16 : 16);
        return (
          <g key={e.date} opacity={o}>
            <line x1={mx} x2={mx} y1={rowY(r0) - fs} y2={stripTop + STRIP} stroke="rgba(255,255,255,0.4)" strokeWidth={2} strokeDasharray="6 8" />
            <text x={tx} y={rowY(r0)} textAnchor={anchor} style={{ ...type.small, fill: '#FFFFFF', fontWeight: 650 }}>
              {e.label}
            </text>
            {e.detail && (
              <text x={tx} y={rowY(r0 + 1)} textAnchor={anchor} style={muted}>
                {e.detail}
              </text>
            )}
          </g>
        );
      })}

      {/* the unemployment line, labelled at its start where nothing else is */}
      <path
        d={d}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={6}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={evo.strokeDasharray}
        strokeDashoffset={evo.strokeDashoffset}
      />
      {line > 0.02 && <circle cx={x(lead.date)} cy={y(lead.value)} r={11} fill="#FFFFFF" />}
      {/* Above the line's opening stretch, in the empty top of the panel. */}
      <text x={x(POINTS[0].date) + 18} y={y(8.2)} style={{ ...type.small, fill: '#FFFFFF', fontWeight: 650 }} opacity={furniture}>
        Unemployment
      </text>
    </svg>
  );
};
