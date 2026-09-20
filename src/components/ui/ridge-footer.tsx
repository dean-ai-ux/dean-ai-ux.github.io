import * as React from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { RIDGE_BANDS } from '@/generated/ridge';

/**
 * Verde's mountain range, along the bottom of every screen.
 *
 * At rest it is not there at all. Both bands are pushed down past the full
 * height of the band, so nothing of the range is painted until you scroll — and
 * then the whole thing rises out from below the viewport. Nothing is faded or
 * clipped to achieve that: the part you cannot see is genuinely below the
 * bottom edge, which is why it can come back without a seam.
 *
 * The two bands are the far half and the near half of the same range, generated
 * as separate <svg> elements precisely so they can move independently. The far
 * half travels less, which is what parallax is; they land in exact register at
 * full reveal, so the range is only ever "correct" when you can see all of it.
 *
 * Above the content rather than behind it: the cards carry opaque backgrounds,
 * so a band underneath them would simply be covered up. Text passing behind a
 * ridge is the effect; `pointer-events-none` keeps it from ever swallowing a
 * click, and the screens carry bottom padding so nothing rests under it.
 */

/** How tall the band is once the range has fully risen. */
const BAND = 260;

/**
 * How far each half is pushed down at the top of the page: far, then near.
 *
 * Both are at least BAND, so at the top of the page each band sits entirely
 * below its own container and the range is invisible rather than merely subtle.
 * The near band goes further, which is what makes them arrive at different rates
 * on the way up; they land in exact register at 0, so the range is only ever
 * correct once all of it is showing.
 */
const TRAVEL = [BAND, BAND + 40];

/**
 * Scroll distance over which the range comes up, measured back from the foot of
 * the page.
 *
 * It used to be measured forward from the top: 340px of scroll and the range was
 * up. That worked only while every screen was about one viewport tall, where
 * "scrolled a little" and "near the bottom" were the same place. The work
 * timeline scrolls 1462px, and under the old rule the range stood at its full
 * 260px for 1100px of that — covering a card the whole way down.
 *
 * Anchored to the foot instead, the range is what it looks like: the bottom of
 * the page. Short screens behave exactly as before, because on those the last
 * 340px is all of it.
 */
const REVEAL = 340;

function Band({
  svg, travel, progress,
}: { svg: string; travel: number; progress: MotionValue<number> }) {
  const y = useTransform(progress, [0, 1], [travel, 0]);
  return (
    <motion.div
      style={{ y }}
      className="ridge-band absolute inset-x-0 bottom-0"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function RidgeFooter() {
  const reduced = useReducedMotion();
  const raw = useMotionValue(0);

  /* Driven by hand rather than by useScroll's ranges, because the range this
     maps over depends on the document's height — which changes when you move
     between screens, often without any scroll to trigger a recompute. The
     ResizeObserver is what catches that case. */
  React.useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const limit = Math.max(0, doc.scrollHeight - window.innerHeight);
      if (limit <= 0) { raw.set(0); return; }
      const start = Math.max(0, limit - REVEAL);
      const span = Math.max(1, limit - start);
      raw.set(Math.min(1, Math.max(0, (window.scrollY - start) / span)));
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, [raw]);
  // A spring so the range settles rather than tracking the wheel tick for tick;
  // the figure is scenery, and scenery that snaps reads as a jump cut.
  const settled = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 });
  // Reduced motion keeps the reveal and drops the easing. Where the range sits
  // is a function of the scroll position — that is a position, not an animation,
  // and pinning it open instead would contradict the one thing this is for.
  const progress = reduced ? raw : settled;

  return (
    <div
      aria-hidden="true"
      className="ridge pointer-events-none fixed inset-x-0 bottom-0 z-30 overflow-hidden"
      style={{ height: BAND }}
    >
      {RIDGE_BANDS.map((svg, i) => (
        <Band key={i} svg={svg} travel={TRAVEL[i]} progress={progress} />
      ))}
    </div>
  );
}
