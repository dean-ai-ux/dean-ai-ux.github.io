import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { ArcLine, Arrow } from '../parts';
import { fontFamily, type, verde } from '../theme';
import profile from '../../src/content/profile.json';

const arc = (profile as { arc: string[][] }).arc;

/**
 * Act five. The film becomes the page.
 *
 * The third arc line gets the same large treatment as the first two, and then
 * the actual landing tile assembles underneath it and takes over. The last
 * frame is the tile the site opens on, so when the overlay dismisses there is
 * no cut: the thing on screen is already the thing behind it.
 *
 * The tile is built at the site's own CSS dimensions, exactly as src/App.tsx
 * sets them, and then scaled as a whole. Matching the real numbers and scaling
 * once is the only way the proportions survive: retyping them at film size
 * would drift the moment a padding changes.
 */
const TILE_SCALE = 2.15;

const Tile: React.FC = () => (
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

export const Landing: React.FC = () => {
  const frame = useCurrentFrame();

  /* The hero line holds, then hands over. These ran overlapping at first, on
     the theory that it would read as one object resolving. It did not: both
     were semi-transparent at once and the tile's small type printed through the
     middle of the large type as a double exposure. The hero is now fully out at
     64 before the tile starts at 66. */
  const heroProgress = interpolate(frame, [6, 44], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const heroOut = interpolate(frame, [48, 64], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const heroLift = interpolate(frame, [48, 64], [0, -40], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const tileIn = interpolate(frame, [66, 88], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tileScale = interpolate(tileIn, [0, 1], [1.07, 1]);

  /* The ground turns over to the page's own white in the last second.
     Up to here the film has been forest edge to edge, and the tile is forest
     too, so the card has no edge and reads as type floating on a field. The
     site is a white page with a green card on it. Turning the ground over
     gives the card its edge back and means the final frame and the page behind
     the overlay are the same picture, which is the point of ending here.
     PAGE is --background in src/index.css, light mode: 0 0% 100%. */
  const PAGE = '#FFFFFF';
  const ground = interpolate(frame, [70, 94], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{ background: verde.forest, justifyContent: 'center', alignItems: 'center' }}
    >
      <AbsoluteFill style={{ background: PAGE, opacity: ground }} />
      {heroOut > 0 && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            opacity: heroOut,
            transform: `translateY(${heroLift}px)`,
          }}
        >
          <ArcLine
            from={arc[2][0]}
            to={arc[2][1]}
            progress={heroProgress}
            style={type.displayLg}
            arrowSize={62}
            gap={28}
          />
        </AbsoluteFill>
      )}

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          opacity: tileIn,
        }}
      >
        <div style={{ transform: `scale(${TILE_SCALE * tileScale})` }}>
          <Tile />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
