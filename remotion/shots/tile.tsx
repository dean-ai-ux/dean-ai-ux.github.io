import React from 'react';
import { staticFile } from 'remotion';
import { fontFamily, verde } from '../theme';
import profile from '../../src/content/profile.json';

const arc = (profile as { arc: string[][] }).arc;

/**
 * The arrow between the two halves of an arc line.
 *
 * Drawn rather than imported: the site uses lucide's ArrowRight, and pulling a
 * React icon library into the film to get one glyph is not worth it. These are
 * lucide's own path commands at its 24-unit grid, so the shape matches.
 */
export const Arrow: React.FC<{ size: number; opacity?: number }> = ({ size, opacity = 0.5 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ opacity, flexShrink: 0 }}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

/**
 * The landing tile, built at the site's own CSS dimensions exactly as
 * src/App.tsx sets them, so the film's last frame and the page behind the
 * overlay are the same object. Scale it as a whole; never retype its sizes.
 */
export const Tile: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 24, // sm:gap-6
      padding: 32, // sm:p-8
      borderRadius: 16, // rounded-2xl
      background: verde.forest,
      color: verde.onForest,
      fontFamily,
    }}
  >
    <div style={{ flexShrink: 0 }}>
      {/* size-24, rounded-full. The original 400x400 headshot, square, so the
          circle crops nothing. */}
      <img
        src={staticFile('media/portrait.jpg')}
        alt=""
        style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', display: 'block' }}
      />
      <span
        style={{
          fontFamily,
          fontSize: 14,
          lineHeight: '20px',
          letterSpacing: '0.2px',
          fontWeight: 500,
          marginTop: 12,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          textDecoration: 'underline',
          textUnderlineOffset: 4,
          opacity: 0.8,
          whiteSpace: 'nowrap',
        }}
      >
        About me
        {/* The site puts an ArrowUpRight here. It is four pixels of glyph, and
            leaving it out was the only visible difference between this frame
            and the tile it hands off to. */}
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 7h10v10" />
          <path d="M7 17 17 7" />
        </svg>
      </span>
    </div>
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
        fontFamily,
        fontSize: 28,
        lineHeight: '36px',
        letterSpacing: '-0.25px',
        fontWeight: 400,
        fontVariationSettings: "'wdth' 100",
      }}
    >
      {arc.map(([from, to]) => (
        <li key={from} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ opacity: 0.6 }}>{from}</span>
          <Arrow size={20} opacity={0.5} />
          <span>{to}</span>
        </li>
      ))}
    </ul>
  </div>
);
