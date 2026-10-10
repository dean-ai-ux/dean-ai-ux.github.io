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

export function Intro() {
  const [state, setState] = React.useState<'playing' | 'leaving' | 'gone'>(() =>
    shouldPlay() ? 'playing' : 'gone',
  );
  /* True for the last stretch of the film, where its own ground turns white.
     The overlay follows it, so the letterbox bars turn white at the same moment
     and the final frame reads as the page rather than as a card on a field. */
  const [settling, setSettling] = React.useState(false);
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
        /* The film's own near-black while it plays, turning over to the page's
           white as the film does. The bars either side of a 16:9 film in a
           portrait window are therefore never a colour the film is not. This
           was forest green for the previous cut; left that way it would have
           framed a black film in green bars on every phone. */
        backgroundColor: settling ? '#FFFFFF' : '#07090A',
        opacity: state === 'leaving' ? 0 : 1,
      }}
    >
      <video
        ref={videoRef}
        src="media/intro.mp4"
        poster="media/intro-poster.jpg"
        muted
        autoPlay
        playsInline
        preload="auto"
        aria-hidden
        onEnded={dismiss}
        onError={dismiss}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.duration && v.currentTime > v.duration - 1.3) setSettling(true);
        }}
        /* contain, not cover. Cover would crop a 16:9 film to a portrait phone
           and show about a quarter of the frame, cutting the type in half. */
        className="size-full object-contain"
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
