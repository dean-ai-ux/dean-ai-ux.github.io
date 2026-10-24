import * as React from 'react';

/**
 * The film that plays over the landing page, and gets out of the way.
 *
 * An overlay, not a route. The site renders behind it exactly as it otherwise
 * would, so a crawler, a reader with JavaScript off, and anyone who dismisses
 * this in the first half second all get the same page. Nothing about the site
 * depends on this component existing.
 *
 * It is deliberately easy to escape. A resume is read by people with very
 * little time, and a film they cannot skip is worse than no film: the ending,
 * a scroll, a click, Escape, Space, the arrow keys and a visible Skip control
 * all dismiss it.
 */

const SEEN_KEY = 'verdevista:intro-seen';

/** sessionStorage throws outright in some privacy modes. Never let that matter. */
const seenThisSession = () => {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
};
const markSeen = () => {
  try {
    window.sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* A visitor who cannot be remembered sees it again. That is the harmless
       failure, so it is the one to choose. */
  }
};

/**
 * Decided once, before the <video> is ever mounted, so a returning visitor does
 * not download the film to discover they are not going to watch it.
 */
function shouldPlay(): boolean {
  if (typeof window === 'undefined') return false;
  /* #intro forces it back for development and for showing someone. */
  if (window.location.hash === '#intro') return true;
  /* A deep link to a section is a request for that section, not for a film. */
  if (window.location.hash && window.location.hash !== '#home') return false;
  if (seenThisSession()) return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  const conn = (navigator as { connection?: { saveData?: boolean } }).connection;
  if (conn?.saveData) return false;
  return true;
}

/**
 * The opening of Vista: Many Heads, the brand film Dean made in his own Vista
 * design system: the VISTA wordmark, then "Software isn't losing its head. It's
 * growing thousands." Cut from the film at 8.7s, silent, so it can autoplay.
 * The whole film, with its score, plays from the statement tile on the landing
 * page (see FilmTile in App.tsx).
 *
 * One cut for every screen. The film exists only at 16:9, and cropping it to a
 * phone would cut the title in half, so a phone gets it letterboxed in the
 * film's own ink.
 */
const INK = '#0D0D0D';

export function Intro() {
  const [state, setState] = React.useState<'playing' | 'leaving' | 'gone'>(() =>
    shouldPlay() ? 'playing' : 'gone',
  );
  /* Fill the screen when it is close to the film's shape, 16:10 to 2:1, which
     is most laptops and monitors. Cover trims at most 96px a side there, clear
     of the title; anything else keeps the bars, because a deeper crop would cut
     the type. Chrome draws the film a few levels darker than the ink it was
     made in, so wherever there are bars a faint seam shows. This keeps them
     off the common screens. */
  const [fill] = React.useState(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(min-aspect-ratio: 8/5) and (max-aspect-ratio: 2/1)').matches,
  );
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const skipRef = React.useRef<HTMLButtonElement>(null);

  const dismiss = React.useCallback(() => {
    setState((s) => (s === 'playing' ? 'leaving' : s));
  }, []);

  /* Every way out, in one place. Wheel and touchmove rather than scroll,
     because the body is locked below and a locked page fires no scroll event;
     the gesture still arrives, which is what Dean asked to listen for. */
  React.useEffect(() => {
    if (state !== 'playing') return;
    const keys = new Set(['Escape', ' ', 'Spacebar', 'ArrowDown', 'PageDown', 'Enter']);
    const onKey = (e: KeyboardEvent) => {
      if (keys.has(e.key)) {
        e.preventDefault();
        dismiss();
      }
    };
    const opts = { passive: true } as const;
    window.addEventListener('wheel', dismiss, opts);
    window.addEventListener('touchmove', dismiss, opts);
    window.addEventListener('scroll', dismiss, opts);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', dismiss);
      window.removeEventListener('touchmove', dismiss);
      window.removeEventListener('scroll', dismiss);
      window.removeEventListener('keydown', onKey);
    };
  }, [state, dismiss]);

  /* Lock the page while it plays, so dismissing always reveals the site from
     the top rather than from wherever a stray gesture scrolled it. */
  React.useEffect(() => {
    if (state === 'gone') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [state]);

  React.useEffect(() => {
    if (state !== 'playing') return;
    skipRef.current?.focus();
    const v = videoRef.current;
    if (!v) return;

    /* autoplay is permitted only because the file is muted and carries no audio
       track at all. play() can still be rejected, and a rejected promise here
       would otherwise leave a frozen first frame covering the site. */
    v.play().catch(dismiss);

    /* The watchdog. If the file 404s, the decode fails, or playback never
       starts for a reason no event reports, the site must appear anyway. This
       is the difference between a bad intro and a broken website. */
    const watchdog = window.setTimeout(() => {
      if (v.paused || v.readyState < 3) dismiss();
    }, 2500);
    return () => window.clearTimeout(watchdog);
  }, [state, dismiss]);

  React.useEffect(() => {
    if (state !== 'leaving') return;
    markSeen();
    const t = window.setTimeout(() => setState('gone'), 420);
    return () => window.clearTimeout(t);
  }, [state]);

  if (state === 'gone') return null;

  return (
    <div
      role="dialog"
      aria-label="Introduction"
      onClick={dismiss}
      className="fixed inset-0 z-[60] flex items-center justify-center transition-[opacity,background-color] duration-[420ms]"
      style={{
        /* The film's own ink, so the bars around it on a screen that is not
           16:9 are never a colour the film is not. */
        backgroundColor: INK,
        opacity: state === 'leaving' ? 0 : 1,
      }}
    >
      <video
        ref={videoRef}
        src="media/vista-intro.mp4"
        poster="media/vista-intro-poster.jpg"
        muted
        autoPlay
        playsInline
        preload="auto"
        aria-hidden
        onEnded={dismiss}
        onError={dismiss}
        className={`size-full ${fill ? 'object-cover' : 'object-contain'}`}
      />

      <button
        ref={skipRef}
        type="button"
        onClick={dismiss}
        className="absolute bottom-6 right-6 rounded-full border border-white/25 bg-black/30 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        Skip
      </button>
    </div>
  );
}

export default Intro;
