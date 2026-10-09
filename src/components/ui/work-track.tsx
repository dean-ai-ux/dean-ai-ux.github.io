"use client";

import * as React from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';

export interface TrackEntry {
  id: string;
  title: string;
  subtitle: string;
  dates: string;
  duration?: string;
  art: React.ReactNode;
  /** An employer's mark, set in the card's top corner over the art. */
  mark?: { src: string; alt: string };
}

/**
 * The work history as a strip you scroll sideways.
 *
 * Native overflow rather than a pinned section driving a transform: the reader
 * scrolls the row itself — trackpad, shift-wheel, swipe, or by tabbing through
 * the cards — and the page behaves like a page. The earlier version turned
 * vertical scroll into horizontal movement, which meant taking the scroll over
 * for the length of the section and inflating the page to nearly three screens
 * to buy the travel.
 *
 * The rail beneath is the scrollbar: `scrollXProgress` over the same element
 * fills it, so the thing that shows position is the thing the reader is moving.
 * The native bar is hidden because the rail says it better; the cards clipped
 * at the right edge are what signal there is more.
 */
export function WorkTrack({
  entries, onOpen, leadRun,
}: {
  entries: TrackEntry[];
  onOpen: (i: number) => void;
  /** How many entries at the head share one organisation, for the band. */
  leadRun: number;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollXProgress } = useScroll({ container: scrollRef });
  /* A light spring so the gauge settles rather than stepping with each wheel
     tick — dropped under reduced motion, where it should track exactly. */
  const settled = useSpring(scrollXProgress, { stiffness: 260, damping: 40, mass: 0.3 });
  const fill = useTransform(reduced ? scrollXProgress : settled, [0, 1], ['0%', '100%']);

  /* Half the gap reclaimed on each inner edge, so segments drawn per card meet
     across it. Without this the rule reads as seven dashes and the band as five
     — gap-6 is 24px, so 12px a side closes it exactly. */
  const bridge = (i: number, first: number, last: number) =>
    `${i > first ? '-ml-3' : ''} ${i < last ? '-mr-3' : ''}`;

  return (
    <div>
      <div
        ref={scrollRef}
        tabIndex={0}
        role="group"
        aria-label="Work history, scroll sideways"
        className="overflow-x-auto overscroll-x-contain rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Room below the last line. overflow-x:auto forces the other axis to
            clip too, so text sitting flush with the foot of the strip gets its
            descenders shaved — measured at exactly 0px clearance on six of the
            seven cards. */}
        <div className="flex w-max gap-6 pb-3 snap-x snap-mandatory">
          {entries.map((entry, i) => (
            <div key={entry.id} className="flex w-[clamp(240px,19vw,320px)] shrink-0 snap-start flex-col">
              <button
                type="button"
                onClick={() => onOpen(i)}
                aria-label={`${entry.title} — ${entry.subtitle}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {entry.art}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition duration-300 group-hover:from-black/90" />
                {/* Top corner, over its own short scrim: the glyph is white and
                    the office photographs are bright at the top, where the
                    skylight is. Without the scrim it disappears into the sky. */}
                {entry.mark && (
                  <span className="pointer-events-none absolute inset-x-0 top-0 flex justify-end bg-gradient-to-b from-black/45 to-transparent p-4 pb-10">
                    <img src={entry.mark.src} alt={entry.mark.alt} className="h-6 w-auto opacity-90" />
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 flex flex-col p-5 text-white">
                  <span className="t-title-lg">{entry.title}</span>
                  <span className="t-caption text-white/75">{entry.subtitle}</span>
                </span>
              </button>

              <div className={`relative mt-5 h-3 ${bridge(i, 0, entries.length - 1)}`} aria-hidden>
                <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                <span className="absolute left-1/2 top-1/2 grid size-3 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-border bg-background">
                  <span className="size-1.5 rounded-full bg-foreground/50 transition-colors group-hover:bg-foreground" />
                </span>
              </div>

              <div className={`mt-3 h-1.5 ${i < leadRun ? bridge(i, 0, leadRun - 1) : ""}`} aria-hidden>
                {i < leadRun && (
                  <span
                    className={`block h-1.5 ${i === 0 ? 'rounded-l-full' : ''} ${
                      i === leadRun - 1 ? 'rounded-r-full' : ''
                    }`}
                    style={{ background: 'var(--verde-viz-sage)' }}
                  />
                )}
              </div>

              <div className="mt-3">
                <p className="t-title-md tabular-nums">{entry.dates}</p>
                {entry.duration && (
                  <p className="t-caption tabular-nums text-muted-foreground">{entry.duration}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The scrollbar, in the site's own terms. Below the strip rather than
          inside it, so it stays put while the row moves past. */}
      <div className="mt-8 h-0.5 overflow-hidden rounded-full bg-border">
        <motion.div
          style={{
            width: fill,
            background: 'linear-gradient(to right, var(--verde-viz-forest), var(--verde-viz-sage))',
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}

export default WorkTrack;
