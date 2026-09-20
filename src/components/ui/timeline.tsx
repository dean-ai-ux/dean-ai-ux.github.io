"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import * as React from 'react';

export interface TimelineEntry {
  /** The heading that sticks beside the entry — a date range here. */
  title: string;
  /** A second line under it, smaller. Optional. */
  meta?: string;
  content: React.ReactNode;
}

/**
 * A vertical timeline whose rail fills as you scroll past it.
 *
 * Three departures from the component as published, all required here:
 *
 * 1. Its own heading and blurb are gone. The section already has a header band
 *    above it, and a second title inside the timeline said the same thing twice.
 * 2. Colors come from the theme rather than white/black/neutral-*, so the rail
 *    and the headings follow the light and dark toggle. The fill is Verde's
 *    palette instead of the original purple-to-blue.
 * 3. The height of the rail is measured with a ResizeObserver rather than once
 *    on mount. Measured once, a card that grows after first paint — a webfont
 *    landing, an image decoding — leaves the rail short of the last entry with
 *    no way to notice.
 */
export function Timeline({ data }: { data: TimelineEntry[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* 'end 50%' — the original — asks for the list's foot to reach the middle of
     the viewport before the rail is full. When the timeline is the last thing on
     the page there is not that much scroll left, so progress topped out around
     0.79 and the final entries never got the line. 'end 90%' completes within
     the scroll the page actually has. */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 10%', 'end 90%'],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full" ref={containerRef}>
      {/* Clearance for the fixed mountain band, which is 260px tall once
          risen and now rises at the foot of every page. At pb-20 the last
          entry finished underneath it. */}
      <div ref={ref} className="relative pb-48">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:gap-10 md:pt-24">
            <div className="sticky top-24 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm">
              <div className="absolute left-3 grid size-10 place-items-center rounded-full bg-background">
                <span className="size-3 rounded-full border border-border bg-muted" />
              </div>
              <div className="hidden md:block md:pl-20">
                <h3 className="t-display-md tabular-nums text-muted-foreground">{item.title}</h3>
                {item.meta && <p className="t-body-sm tabular-nums text-muted-foreground/70">{item.meta}</p>}
              </div>
            </div>

            <div className="relative w-full pl-20 pr-4 md:pl-4">
              <div className="mb-4 md:hidden">
                <h3 className="t-headline-md tabular-nums text-muted-foreground">{item.title}</h3>
                {item.meta && <p className="t-caption tabular-nums text-muted-foreground/70">{item.meta}</p>}
              </div>
              {item.content}
            </div>
          </div>
        ))}

        {/* The rail: a static rule masked to fade at both ends, with the filled
            length driven by how far through the list you have scrolled. */}
        <div
          style={{ height: `${height}px` }}
          className="absolute left-8 top-0 w-px overflow-hidden bg-gradient-to-b from-transparent via-border to-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
              background:
                'linear-gradient(to top, var(--verde-viz-forest), var(--verde-viz-sage) 40%, transparent)',
            }}
            className="absolute inset-x-0 top-0 w-px rounded-full"
          />
        </div>
      </div>
    </div>
  );
}

export default Timeline;
