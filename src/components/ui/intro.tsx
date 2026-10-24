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
 * a scroll, a click, Escape, Space and the arrow keys
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
 * The Vista intro: the VISTA wordmark that opens Vista: Many Heads, the brand
 * film Dean made in his own Vista design system. The first three seconds of
 * the film, which is exactly the wordmark settling and fading, silent so it can
 * autoplay. Then the landing page. The whole film plays only on request, from
 * the first tile on the landing page (FilmTile in App.tsx).
 *
 * The wordmark sits dead centre on an empty field, so the clip can cover any
 * screen, a phone included, without cropping anything that matters.
 */
const INK = '#0D0D0D';

export function Intro() {
  const [state, setState] = React.useState<'playing' | 'leaving' | 'gone'>(() =>
    shouldPlay() ? 'playing' : 'gone',
  );
  const videoRef = React.useRef<HTMLVideoElement>(null);

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
      data-intro
      aria-hidden
      onClick={dismiss}
      className="fixed inset-0 z-[60] flex items-center justify-center transition-[opacity,background-color] duration-[420ms]"
      style={{
        /* The film's own ink, behind it while it loads and as it fades. */
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
        className="size-full object-cover"
      />

    </div>
  );
}

export default Intro;
