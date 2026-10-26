import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Play, X } from 'lucide-react';
import { SectionDock, type DockItem } from '@/components/ui/section-dock';
import { RidgeFooter } from '@/components/ui/ridge-footer';
import { SqueezeCarousel, type SqueezeSlide } from '@/components/ui/carousel-squeeze';
import { WorkTrack } from '@/components/ui/work-track';
import { Intro } from '@/components/ui/intro';
import { APP_PHOTOS, APP_FIGURES } from '@/generated/app-icons';

import profile from '@/content/profile.json';
import screens from '@/content/screens.json';
import work from '@/content/work.json';
import education from '@/content/education.json';
import projects from '@/content/projects.json';
import writing from '@/content/writing.json';
import about from '@/content/about.json';

type Entry = {
  id: string; org: string; role: string; location?: string;
  start: string; end: string | null; summary: string; context?: string;
  actions?: string[];
  outcomes?: { claim: string; evidence?: string[] }[];
  evidence?: { id: string; type?: string; title: string; url?: string; note?: string; restricted?: { reason?: string } }[];
  skills?: string[]; placeholder?: boolean;
  icon?: { file: string; alt?: string };
};

/* The order the sections read in the bar. Deliberately not TILES order: that
   array's index is what every `layoutId` is derived from, so reordering it to
   fix the nav would silently repoint the shared-element transitions. */
const NAV_ORDER = ['work', 'education', 'built', 'writing'];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = (v: string | null) => {
  if (!v) return 'Present';
  const [y, m] = v.split('-');
  return m ? `${MONTHS[+m - 1]} ${y}` : y;
};
/* v1 hosted its files under assets/; this project keeps the same files under
   public/media/. Rewriting here rather than editing the content means the two
   sites can go on sharing one set of entries. */
const asset = (url?: string) => (url?.startsWith('assets/') ? url.replace('assets/', 'media/') : url);

/**
 * How long a role ran, in words.
 *
 * Handles a start in the future — Senior Associate begins next month — which a
 * plain subtraction would render as a negative month count.
 */
const started = (start: string) => {
  const [y, m] = start.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1) <= new Date();
};

/** The range as shown. A role that has not begun has no end to show. */
const range = (start: string, end: string | null) =>
  started(start) ? `${fmt(start)} – ${fmt(end)}` : `From ${fmt(start)}`;

function span(start: string, end: string | null) {
  const [ys, ms] = start.split('-').map(Number);
  const now = new Date();
  if (!started(start)) return '';
  const [ye, me] = end ? end.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
  const n = Math.max(1, (ye - ys) * 12 + ((me || 1) - (ms || 1)));
  if (n < 12) return `${n} mo`;
  const y = Math.floor(n / 12), r = n % 12;
  return r ? `${y} yr ${r} mo` : `${y} yr`;
}

const openEvidence = (e: Entry) => e.evidence?.find((x) => x.url && !x.restricted);
const openLink = (e: Entry) => asset(openEvidence(e)?.url);

/* What the thing behind the link actually is. The verb was a guess before —
   "Open" for a game, a PDF and an announcement alike — and the content has
   always known the difference. */
const ACTION_VERB: Record<string, string> = { app: 'Play', doc: 'Open', repo: 'Code', link: 'Read', video: 'Watch' };

/**
 * A claim's proof.
 *
 * `withheld` is not a missing url — it is a url that exists and is not ours to
 * publish: client-confidential engagements and internal commercial figures.
 * Naming the proof and saying why it is not linked is the honest rendering, and
 * it is what keeps a claim from looking unsupported when in fact it is
 * supported by something the reader cannot be shown.
 */
type Proof = { id: string; title: string; url?: string; note?: string; withheld?: string };

const toProof = (ev: NonNullable<Entry['evidence']>[number]): Proof => ({
  id: ev.id,
  title: ev.title,
  url: ev.restricted ? undefined : asset(ev.url),
  note: ev.note,
  withheld: ev.restricted ? (ev.restricted.reason || 'Not public.') : undefined,
});

/* ── the landing grid ──────────────────────────────────────── */

type Tile = { key: string; title: string; desc: string; url: string; span: string; tab?: string; href?: string };

const TILES: Tile[] = [
  { key: 'work', title: 'Work', desc: '', url: 'media/work.jpg', tab: 'work',
    span: 'col-span-1 row-span-3 sm:col-span-1 sm:row-span-4 lg:col-start-1 lg:col-span-1 lg:row-start-1 lg:row-span-5' },
  { key: 'built', title: 'Built', desc: 'Vista, the Vista Video Production Tool, Fed Chair for a Year, MAIA, Course Compass', url: 'media/built-ridges.jpg', tab: 'built',
    span: 'col-span-1 row-span-2 sm:col-span-1 sm:row-span-2 lg:col-start-4 lg:col-span-1 lg:row-start-1 lg:row-span-3' },
  { key: 'education', title: 'Education', desc: '', url: 'media/davidson.jpg', tab: 'education',
    span: 'col-span-1 row-span-2 sm:col-span-2 sm:row-span-2 lg:col-start-2 lg:col-span-2 lg:row-start-1 lg:row-span-3' },
  { key: 'writing', title: 'Writing', desc: '', url: 'media/supply-wisdom.jpg', tab: 'writing',
    span: 'col-span-1 row-span-2 sm:col-span-2 sm:row-span-2 lg:col-start-3 lg:col-span-2 lg:row-start-4 lg:row-span-2' },
];

/* ── tile art ──────────────────────────────────────────────── */

/**
 * Which entries own a photograph.
 *
 * Deliberately short, and deliberately not padded out. A section's own photo is
 * not reused for one of its entries — the same picture twice on one screen reads
 * as a bug rather than a motif. The one exception is Supply Wisdom, where the
 * image genuinely belongs to the piece and the section tile is the borrower.
 *
 * Everything absent from this table renders typographically, which is 18 of 27
 * tiles. That is the design, not a gap to hide.
 */
const ENTRY_ART: Record<string, string> = {
  about: 'media/portrait.jpg',
  /* Five bands of one office, one per Prophet role — see
     scripts/gen-work-crops.mjs for why these are files and not object-position. */
  'prophet-senior-associate': 'media/work-1.jpg',
  'prophet-ai-foundry': 'media/work-2.jpg',
  'prophet-digital-transformation': 'media/work-3.jpg',
  'prophet-ai-strategy-intern': 'media/work-4.jpg',
  'prophet-associate-intern': 'media/work-5.jpg',
  madrideasy: 'media/work-madrideasy.jpg',
  'breakthrough-2020': 'media/breakthrough.jpeg',
  'breakthrough-2019': 'media/breakthrough-austin.jpg',
  'davidson-college': 'media/davidson-campus.jpg',
  /* Cropped to the tile's 2.7:1 rather than left square: the original is a
     portrait phone photo, and a centred cover crop starts below the heads. */
  'davidson-fed-challenge': 'media/fed-challenge.jpg',
  'davidson-spanish-ta': 'media/spanish-ta.jpg',
  'vista-design-system': 'media/icon-vista-design-system.jpg',
  'vista-video-toolkit': 'media/icon-vista-video-toolkit.jpg',
  'fed-chair-for-a-year': 'media/icon-fed-chair-for-a-year.jpg',
  maia: 'media/maia.jpg',
  'many-heads': 'media/many-heads-sizzle-poster.jpg',
  'w-0': 'media/rules-in-a-crisis-poster.jpg',
  'w-1': 'media/footwear.jpg',
  'w-2': 'media/supply-wisdom.jpg',
  'ai-and-crypto': 'media/ai-and-crypto-poster.jpg',
};

/* Verde's six landscape tones. The foreground for each is Verde's own onFill
   pairing, already contrast-checked there (4.75:1 through 13.39:1), so the label
   colour is a value the design system computed rather than one I guessed. */
const TONES = ['slate', 'moss', 'brass', 'clay', 'sage', 'forest'];

/** FNV-1a, same hash Verde seeds its imagery with. Keeps a given entry on the
 *  same tone forever instead of shuffling when the list is reordered. */
function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const toneOf = (id: string) => TONES[hash(id) % TONES.length];

type Item = {
  id: string;
  title: string;
  subtitle: string;
  dates?: string;
  summary?: string;
  context?: string;
  actions?: string[];
  outcomes?: { claim: string; proof: Proof[] }[];
  /* Evidence on the entry that no outcome cites — listed rather than dropped,
     which is what `openLink` taking only the first url used to do. */
  extraProof?: Proof[];
  dateRange?: { start: string; end: string | null };
  skills?: string[];
  href?: string;
  /** The evidence type behind `href`, so the action can name itself. */
  hrefKind?: string;
  meta?: { label: string; value: string }[];
  /* A written piece, as it was written: headed sections, each either a run of
     prose, a list of points, or both. The role-shaped fields above (actions,
     outcomes) describe work done; this one carries an argument, and forcing an
     essay through them would lose its shape. */
  essay?: {
    heading?: string;
    text?: string;
    points?: { lead?: string; text: string }[];
    /** Set larger, as the line the piece turns on. */
    pull?: boolean;
    /** A still from the piece's film, placed after the paragraph it illustrates. */
    figure?: { src: string; alt: string; caption?: string };
  }[];
  /* A piece that has a film of its own. Its detail opens as an article: the film
     across the top, then the text in one reading column with the figures. */
  film?: { src: string; poster: string; title: string; duration: string };
  /** What the link at the top of an article says. Defaults from the address. */
  hrefLabel?: string;
};

/** A tile's face: its photograph if it has one, otherwise its name on a tone. */
function TileArt({ item, size = 'tile', index, label = true }:
  { item: Item; size?: 'tile' | 'large'; index?: number; label?: boolean }) {
  const photo = ENTRY_ART[item.id];
  if (photo) {
    return <img src={photo} alt="" className="absolute inset-0 size-full object-cover" />;
  }
  /* Sequential where the caller knows the position, because hashing put both
     current Prophet roles on slate side by side, and both of Education's lower
     tiles on slate too. Consecutive indices cannot collide. */
  const tone = index === undefined ? toneOf(item.id) : TONES[index % TONES.length];
  return (
    <div
      className={`absolute inset-0 flex flex-col justify-end ${size === 'large' ? 'p-8' : 'p-4'}`}
      style={{ background: `var(--verde-viz-${tone})`, color: `var(--verde-viz-${tone}-on)` }}
    >
      {label && (
        <>
          <p className={`opacity-70 ${size === 'large' ? 't-body-sm' : 't-caption'}`}>{item.subtitle}</p>
          <p className={size === 'large' ? 'mt-2 t-headline-lg' : 'mt-1 t-title-md'}>{item.title}</p>
        </>
      )}
    </div>
  );
}

/**
 * A project's square mark, for the store grid.
 *
 * Three projects have a real screenshot. The rest get a figure Verde drew from
 * the project's own id, generated at build time into src/generated/app-icons.ts
 * — a store where two thirds of the shelf is blank squares is not a store, and
 * inventing a screenshot for something that has none would be worse.
 */
function AppIcon({ item }: { item: Item }) {
  const photo = APP_PHOTOS[item.id];
  if (photo) {
    return <img src={photo.src} alt={photo.alt} className="absolute inset-0 size-full object-cover" />;
  }
  const figure = APP_FIGURES[item.id];
  if (figure) {
    /* Ours, generated from our own content at build time — no user input reaches
       this string. Inline rather than an <img src="data:">, because the fills are
       CSS roles that only resolve when the SVG is part of the document, which is
       what lets the mark follow the theme toggle. */
    return (
      <div
        aria-hidden
        className="absolute inset-0 [&>svg]:size-full [&>svg]:object-cover"
        dangerouslySetInnerHTML={{ __html: figure }}
      />
    );
  }
  return <div className="absolute inset-0" style={{ background: `var(--verde-viz-${toneOf(item.id)})` }} />;
}

/* ── the sections, as items ────────────────────────────────── */

/**
 * `lead: 'role'` puts the role in the title and the organisation in the
 * subtitle. For a work history that is the right way round — "Prophet" is the
 * headline on four of six entries and "Davidson College" on three of four, so
 * the repeating half was dominant and the distinguishing half was set small.
 * Projects keep `lead: 'org'`, where org is the project's name and role is its
 * kind, and the default reading is correct.
 */
const fromEntry = (e: Entry, lead: 'org' | 'role' = 'org'): Item => {
  const byId = new Map((e.evidence ?? []).map((ev) => [ev.id, ev]));
  const cited = new Set<string>();
  const outcomes = (e.outcomes ?? []).map((o) => {
    const proof = (o.evidence ?? []).flatMap((id) => {
      const ev = byId.get(id);
      if (!ev) return [];
      cited.add(id);
      return [toProof(ev)];
    });
    return { claim: o.claim, proof };
  });

  return {
    id: e.id,
    title: lead === 'role' ? e.role : e.org,
    subtitle: lead === 'role' ? e.org : e.role,
    dates: range(e.start, e.end),
    dateRange: { start: e.start, end: e.end },
    summary: e.summary,
    context: e.context,
    actions: e.actions,
    outcomes,
    extraProof: (e.evidence ?? []).filter((ev) => !cited.has(ev.id)).map(toProof),
    skills: e.skills,
    href: openLink(e),
    hrefKind: openEvidence(e)?.type,
  };
};

/* The writing lives in content/ with every other section's, rather than in this
   file. It read as a carousel, then as a grid, and reads as a carousel again —
   but a piece is a thing you open either way, and the pieces themselves should
   not have to be edited in a component to add one. */
/* A piece marked hidden stays in writing.json, title and all, and is left off
   the site until its text is written. */
const WRITING = (writing as (Item & { hidden?: boolean })[]).filter((w) => !w.hidden);

/* The about panel, as one item, so it uses the same detail view every section
   already opens. It opens on its own first paragraph — the tagline that used to
   lead it is gone, and profile.tagline is now unused. */
const ABOUT: Item = about as Item;

const ITEMS: Record<string, Item[]> = {
  work: (work as Entry[]).map((e) => fromEntry(e, 'role')),
  education: (education as Entry[]).map((e) => fromEntry(e, 'role')),
  /* Filtered here rather than in the view, so every index — the overlay's
     arrow-key paging included — counts the same set. */
  built: (projects as Entry[]).filter((p) => !p.placeholder).map((e) => fromEntry(e)),
  writing: WRITING,
};

/* ── the section layouts ───────────────────────────────────── */

/**
 * Each section tiles the landing's exact footprint: four columns, five rows,
 * same row height, so the page never changes size when you open one. The pinned
 * tile keeps the span it had on the landing and the entries fill what is left,
 * which is an L-shape or a split in every case — hence a hand-authored table
 * rather than auto-flow. Auto-placement is what left holes in the landing grid
 * the first time around.
 *
 * Tailwind needs the class to exist as a literal, so these are written out.
 * Every list below sums to exactly the cells the pinned tile does not occupy.
 */
const BASE = 'col-span-1 row-span-2';

const SECTION_LAYOUT: Record<string, string[]> = {
  work: [
    'lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:row-span-2',
    'lg:col-start-3 lg:col-span-2 lg:row-start-1 lg:row-span-2',
    'lg:col-start-1 lg:col-span-1 lg:row-start-3 lg:row-span-3',
    'lg:col-start-2 lg:col-span-1 lg:row-start-3 lg:row-span-3',
    'lg:col-start-3 lg:col-span-1 lg:row-start-3 lg:row-span-3',
    'lg:col-start-4 lg:col-span-1 lg:row-start-3 lg:row-span-3',
  ],
  education: [
    'lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:row-span-3',
    'lg:col-start-3 lg:col-span-2 lg:row-start-1 lg:row-span-3',
    'lg:col-start-1 lg:col-span-2 lg:row-start-4 lg:row-span-2',
    'lg:col-start-3 lg:col-span-2 lg:row-start-4 lg:row-span-2',
  ],
};

const GRID = 'grid auto-rows-[clamp(64px,9vh,92px)] grid-cols-1 gap-3 lg:grid-cols-4';

/* ── hero ──────────────────────────────────────────────────── */

/* ── the landing ───────────────────────────────────────────── */

/**
 * The landing.
 *
 * Two halves that keep their own rhythm rather than one lattice: the left splits
 * near a third of the way down, the right near the middle, and neither lines up
 * with the other. A single row grid would have forced them into step, which is
 * the difference between this and the arrangement it replaces.
 *
 * The statement takes the place the name used to occupy. The name moved to the
 * bar, where it is on every screen instead of only this one.
 */
function LandingTile({
  tile, index, setTab, className,
}: { tile: Tile; index: number; setTab: (t: string) => void; className?: string }) {
  return (
    <motion.button
      type="button"
      layoutId={`media-${index + 1}`}
      transition={{ type: 'spring', stiffness: 340, damping: 34 }}
      onClick={() => setTab(tile.tab!)}
      aria-label={tile.title}
      className={`group relative min-h-[190px] overflow-hidden rounded-2xl text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:min-h-0 ${className ?? ''}`}
    >
      {/* The photograph moves, not the tile. The tile clips, so this reads as a
          push into the frame — and scaling the button itself would fight the
          layoutId flight that carries it into the section. */}
      <img
        src={tile.url}
        alt=""
        className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] group-focus-visible:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none"
      />
      {/* The label is always on. It used to wait for a hover, which meant a
          touch screen never saw it and the landing was five unlabelled
          photographs.

          Hover deepens the scrim rather than lightening it. The old direction
          took it from black/70 to black/55, which dropped the label's contrast
          at exactly the moment someone was reaching for it. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition duration-300 group-hover:from-black/85 group-focus-visible:from-black/85" />
      <span className="t-title-lg absolute bottom-0 left-0 flex items-center gap-1.5 p-5 text-white">
        {tile.title}
        {/* Everything above is atmosphere; this is the part that says the tile
            goes somewhere. Keyboard gets it too — the site had no focus styling
            at all, so a hover-only affordance was invisible to half its users. */}
        <ArrowUpRight
          aria-hidden
          className="size-4 -translate-x-1 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
        />
      </span>
    </motion.button>
  );
}

/**
 * The Many Heads sizzle, the 39 second cut of the film of Dean's essay
 * "Software isn't losing its head. It's growing thousands." The first tile on
 * the landing page, and nothing else in it: no portrait, no arc. The full
 * film's wordmark opens the site (see intro.tsx); this plays, with its score,
 * on request. The essay's article uses the same tile at its head.
 *
 * A poster and a play control until someone asks for it, so nobody downloads
 * four megabytes of film to read a resume. The <video> mounts on the click, and
 * because the click is a user gesture the browser lets it play with sound.
 */
function FilmTile({
  src = 'media/many-heads-sizzle.mp4',
  poster = 'media/many-heads-sizzle-poster.jpg',
  title = "Software isn't losing its head, the sizzle",
  duration = '0:39',
  className = 'rounded-2xl max-h-[75svh] lg:max-h-none',
}: { src?: string; poster?: string; title?: string; duration?: string; className?: string } = {}) {
  const [playing, setPlaying] = React.useState(false);
  return (
    /* Capped below lg, where the tile is the full width: on a phone held
       sideways 16:9 of 800px is taller than the screen, and the landing was
       nothing but the poster. */
    <div className={`relative aspect-video w-full overflow-hidden bg-[#0D0D0D] ${className}`}>
      {playing ? (
        <video
          src={src}
          poster={poster}
          controls
          autoPlay
          playsInline
          className="size-full object-contain"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          /* The tile is 16:9 and the film is 16:9, so the poster shows whole. */
          aria-label={`Play the film ${title}, ${duration}, with sound`}
          className="group/film absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80"
        >
          <img src={poster} alt="" className="size-full object-cover" />
          {/* In the corner, not the centre: the poster's title sits mid-left
              and a centred button covered it. */}
          <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/30 bg-black/55 py-2 pl-3 pr-4 text-white backdrop-blur transition group-hover/film:bg-black/75 motion-reduce:transition-none">
            <Play aria-hidden className="size-4 fill-current" />
            <span className="t-label">Play film</span>
            <span className="t-label tabular-nums opacity-70">{duration}</span>
          </span>
        </button>
      )}
    </div>
  );
}

function Home({ setTab }: { setTab: (t: string) => void }) {
  const by = (key: string) => {
    const i = TILES.findIndex((t) => t.key === key);
    return { tile: TILES[i], index: i };
  };
  const work = by('work'), education = by('education');
  const built = by('built'), writing = by('writing');

  return (
    /* Below lg the reserve under the content is 120px, not 380: the range rises
       over whatever scroll there is (up to 340px), so it still comes up in full,
       and 380 left a phone a screen of blank white before it. pb-[280px] keeps
       the risen range (260px) clear of the last tiles. */
    <div className="min-h-[calc(100svh+120px)] px-4 pb-[280px] pt-20 sm:px-6 lg:min-h-[calc(100vh+380px)] lg:pb-28">
      {/* Sized to the screen. The reserve below is 200px rather than the 272 it
          was: that number was set when the range showed a sliver at rest, and it
          shows nothing now until you scroll, so 72px of it was held back for
          nothing.

          The height only binds from lg. Below it the halves stack, and holding
          them to one screen would leave four tiles about 110px tall.

          110px of reserve, not 200: the grid's top is fixed at 80 under a 64px
          bar, so this lands it 30px above the fold instead of 120. The ceiling
          moved with it — at 840 a tall screen simply re-opened the gap. */}
      <div className="grid grid-cols-1 gap-4 lg:h-[clamp(440px,calc(100vh-110px),920px)] lg:grid-cols-2">
        {/* `auto` then `minmax(0,1fr)`, not two fr shares. An fr row is really
            minmax(auto, Nfr), and that auto floor is what let the statement grow
            its row and push the page down when the contact link was added. Here
            the statement is exactly as tall as it needs, and the photographs —
            which have no height of their own to insist on — absorb the rest. */}
        <div className="grid gap-4 lg:grid-rows-[auto_minmax(0,1fr)]">
          {/* The statement is the way into the about panel now. The contact link
              it used to carry has moved up beside the name in the bar, where it
              is on every screen rather than only this one. */}
          <FilmTile />
          {/* Education alone across the row, now that Volunteering is gone. */}
          <LandingTile {...education} setTab={setTab} />
        </div>

        {/* The same rows as the left column, with Work the film's 16:9,
            so the two columns' gutters line up exactly. */}
        <div className="grid gap-4 lg:grid-rows-[auto_minmax(0,1fr)]">
          <LandingTile {...work} setTab={setTab} className="lg:aspect-video" />
          <div className="grid grid-cols-2 gap-4">
            <LandingTile {...built} setTab={setTab} />
            <LandingTile {...writing} setTab={setTab} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── a section, opened inside the grid ─────────────────────── */

/**
 * The bento stops being navigation the moment you click into it.
 *
 * The tile you clicked holds the exact cell it had on the landing — it is the
 * only thing here that says which section you are in — and everything around it
 * is that section's own contents. No sibling sections, no way back. Getting out
 * is the nav bar's job, and the nav bar is always on screen.
 */
function SectionGrid({ section, onOpen }: { section: string; onOpen: (i: number) => void }) {
  const s: any = screens.find((x: any) => x.id === section);
  const tile = TILES.find((t) => t.key === section)!;
  const pinnedId = TILES.findIndex((t) => t.key === section) + 1;
  const items = ITEMS[section];
  const spans = SECTION_LAYOUT[section];

  return (
    /* The same reserve as the landing: 120px below lg, 380 from it. */
    <div className="min-h-[calc(100svh+120px)] lg:min-h-[calc(100vh+380px)]">
      {/* The tile, promoted.
          It carries the same layoutId the gallery puts on the landing tile, so
          framer flies it from its cell up to here without a line written for the
          purpose. Coming from the sidebar instead there is no tile on screen to
          fly from and it simply appears — an `initial` would fix that case by
          fading the photograph during the flight in the case that matters more. */}
      <section className="px-4 pb-6 pt-20 sm:px-6 sm:pt-24">
        <motion.div
          layoutId={`media-${pinnedId}`}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          className="relative h-40 overflow-hidden rounded-xl sm:h-44"
        >
          <img src={tile.url} alt="" className="absolute inset-0 size-full object-cover grayscale" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <h1 className="t-headline-lg sm:t-display-md text-white">{s?.title}</h1>
            <p className="t-caption mt-2 max-w-[68ch] text-white/80">{s?.blurb}</p>
          </div>
        </motion.div>
      </section>

      <section className="px-4 pb-[280px] sm:px-6 lg:pb-28">
        {section === 'work' ? (
          <WorkSection items={items} onOpen={onOpen} />
        ) : section === 'built' ? (
          /* A shelf of rows, not a grid of names. The icon keeps its place at a
             fixed size and the width that used to be empty — 305px of every
             505px cell — carries the summary, the skills and the way in. */
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {items.map((item, i) => {
              const verb = item.hrefKind ? ACTION_VERB[item.hrefKind] : undefined;
              return (
                <motion.div
                  key={item.id}
                  /* A div, not a button: the action below is a link, and
                     interactive content cannot live inside a <button>. The
                     keyboard handling a button would have given is restored by
                     hand — the same fix the carousel's panels needed. */
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(i)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    onOpen(i);
                  }}
                  aria-label={`${item.title}, ${item.subtitle}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30, delay: 0.04 + i * 0.05 }}
                  className="group grid cursor-pointer grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-2xl border bg-card p-4 text-left sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-x-5 sm:gap-y-0 sm:p-5 outline-none ring-offset-background transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {/* A grid rather than a row, so a phone can put the text under
                      the icon. At 390px a 160px icon beside the text left the
                      text 110px: titles over three lines and one tag a line.
                      There the icon drops to 88px beside the name, and the
                      summary, tags and action run the card's full width. From
                      sm the icon spans both rows and it reads as it did. */}
                  <div className="relative size-[88px] overflow-hidden rounded-xl border transition group-hover:brightness-95 sm:row-span-2 sm:size-40">
                    <AppIcon item={item} />
                  </div>
                  <div className="min-w-0 self-center sm:self-start">
                    <p className="t-title-lg">{item.title}</p>
                    <p className="t-caption text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <div className="col-span-2 flex min-w-0 flex-col sm:col-span-1 sm:col-start-2">
                    {item.summary && (
                      <p className="t-body-sm text-foreground/80 sm:mt-2 sm:line-clamp-3">{item.summary}</p>
                    )}
                    {!!item.skills?.length && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {item.skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="t-caption rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* The way in, named for what it opens. stopPropagation or
                        the card's own handler fires too and the detail panel
                        opens behind the new tab. 44px tall on a phone, the size
                        of a thumb, and the usual 32 with a mouse. */}
                    {item.href && verb && (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="t-label mt-auto inline-flex min-h-11 w-fit items-center gap-1.5 pt-3 underline underline-offset-4 transition hover:opacity-70 fine:min-h-0"
                      >
                        {verb} <ArrowUpRight aria-hidden className="size-3.5" />
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : section === 'writing' ? (
          <>
            {/* Two renderings, swapped on lg with display:none so only one is in
                the tab order and the accessibility tree at a time.

                The squeeze needs room it does not have on a phone: the four
                columns share `100cqi - (16/9)h - 96px`, which at a 468px
                container leaves them about 32 / 16 / 8 wide and stops being a
                carousel at all. Below lg the pieces fall back to the same entry
                tiles every other section shows at that width — and no layout
                table is needed for it, because every span in SECTION_LAYOUT is
                lg:-prefixed and GRID is one column until then. */}
            <div className="hidden lg:block">
              <SqueezeCarousel
                slides={items.map((item, i): SqueezeSlide => {
                  const photo = ENTRY_ART[item.id];
                  const tone = toneOf(item.id);
                  return {
                    id: item.id,
                    title: item.title,
                    description: item.subtitle,
                    image: photo,
                    imageAlt: '',
                    /* The four drafts have no photograph, so they take the tone
                       they already wear as typographic tiles — the same seed, so
                       a piece keeps one colour wherever it appears. */
                    background: photo ? undefined : `var(--verde-viz-${tone})`,
                    /* On the panel, bottom left — photographs included. The
                       open panel names itself rather than depending on a line
                       of copy below it that can sit under the fold. */
                    overlay: <span className="t-title-lg text-white">{item.title}</span>,
                    /* Into the article every time. A published original is the
                       first thing in it, so a piece with a link loses nothing. */
                    action: 'Read',
                    onAction: () => onOpen(i),
                  };
                })}
                height="clamp(240px, 33cqi, 520px)"
                radius={12}
                /* Clicking the open panel opens the article. It used to go
                   straight out to a published original, when the panel had
                   nothing but a title and a link; every piece now opens its own
                   article, with the original linked at its head. */
                onOpen={onOpen}
                /* No arrow row. A slat is the control — click one and it opens —
                   and the arrow keys still step both ways from the open panel.
                   Worth knowing: without the arrows a pointer can only go
                   forward, which is fine because the strip loops. */
                controls={false}
                label="Writing"
              />
            </div>

            <div className={`${GRID} lg:hidden`}>
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => onOpen(i)}
                  aria-label={item.title}
                  initial={{ opacity: 0, scale: 0.94, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30, delay: 0.04 + i * 0.045 }}
                  className={`group relative overflow-hidden rounded-xl text-left ${BASE}`}
                >
                  <TileArt item={item} />
                  {ENTRY_ART[item.id] && (
                    <>
                      {/* Darker through the middle than the wide layouts need. On a phone
                          the text block is a third of the tile's height, so it
                          reaches up into the photograph: a date sat on bright
                          sky and a card on a page of handwriting. */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/5" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="t-caption text-white/75">{item.subtitle}</p>
                        <p className="t-title-md text-white">{item.title}</p>
                      </div>
                    </>
                  )}
                </motion.button>
              ))}
            </div>
          </>
        ) : (
        <div className={GRID}>
          {items.map((item, i) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onOpen(i)}
              /* The contents arrive into the space the other sections left,
                 one after another rather than all at once. The pinned tile is
                 pointedly not part of this: it does not arrive, it was already
                 here. */
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30, delay: 0.04 + i * 0.045 }}
              className={`group relative overflow-hidden rounded-xl text-left ${BASE} ${spans[i] ?? ''}`}
            >
              {/* The photograph, or the tone. Tones are taken by position so
                  neighbours cannot land on the same one, which is what put two
                  identical slate tiles side by side here. */}
              <TileArt item={item} index={i} label={false} />
              {/* One label for both kinds of tile. The tiles were 70-80% empty
                  colour with two lines pinned to a corner; dates and the summary
                  give the space something to carry, and the role leads because
                  "Davidson College" is the line that repeats. */}
              <div className={`absolute inset-0 flex flex-col justify-end p-4 ${
                /* Darker through the middle below lg. There the tile is short and
                   the text fills most of it, so the gradient has to hold behind
                   the top line too: the BA's dates sat on bright sky and the
                   Spanish TA's on a page of handwriting. */
                ENTRY_ART[item.id] ? 'bg-gradient-to-t from-black/90 via-black/65 to-black/20 text-white lg:from-black/85 lg:via-black/45 lg:to-transparent' : ''
              }`}>
                {item.dates && (
                  <p className={`t-caption tabular-nums ${ENTRY_ART[item.id] ? 'text-white/70' : 'opacity-70'}`}>
                    {item.dates}
                  </p>
                )}
                <p className="t-title-md">{item.title}</p>
                <p className={`t-caption ${ENTRY_ART[item.id] ? 'text-white/75' : 'opacity-75'}`}>{item.subtitle}</p>
                {item.summary && (
                  <p className={`t-caption mt-1.5 line-clamp-2 ${ENTRY_ART[item.id] ? 'text-white/80' : 'opacity-80'}`}>
                    {item.summary}
                  </p>
                )}
              </div>
            </motion.button>
          ))}

        </div>
        )}
      </section>
    </div>
  );
}

/**
 * One piece of proof.
 *
 * Withheld evidence renders as text and never as a link. Three of the six items
 * across Work and Education are client-confidential engagements or internal
 * commercial figures; the point is to say the proof exists and why it is not
 * shown, not to find a way to show it.
 */
function ProofLink({ proof }: { proof: Proof }) {
  if (proof.url) {
    return (
      <a
        href={proof.url}
        target="_blank"
        rel="noopener noreferrer"
        title={proof.note || undefined}
        className="t-caption inline-flex items-center gap-1 underline underline-offset-4 transition hover:opacity-70"
      >
        {proof.title} <ArrowUpRight aria-hidden className="size-3" />
      </a>
    );
  }
  return (
    <span className="t-caption text-muted-foreground" title={proof.note || undefined}>
      {proof.title}: <em className="not-italic opacity-80">{proof.withheld}</em>
    </span>
  );
}

/**
 * Work, as a strip you scroll sideways.
 *
 * One layout at every width now. The pinned version needed a vertical fallback
 * for phones and for reduced motion, because it took the scroll over; a native
 * horizontal overflow does neither, and a phone scrolls it with the gesture it
 * already has.
 */
function WorkSection({ items, onOpen }: { items: Item[]; onOpen: (i: number) => void }) {
  /* The run of entries at the head sharing one organisation — five Prophet
     roles today, computed so a sixth joins the band by itself. */
  const lead = items[0]?.subtitle;
  let leadRun = 1;
  while (leadRun < items.length && items[leadRun].subtitle === lead) leadRun++;

  return (
    <WorkTrack
      leadRun={leadRun}
      onOpen={onOpen}
      entries={items.map((item) => {
        const r = item.dateRange;
        return {
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          dates: item.dates ?? '',
          duration: r ? span(r.start, r.end) || undefined : undefined,
          /* label={false}: the card prints its own title over the art. A role
             with no photograph (Cape Resorts) falls back to a tone tile, which
             labels itself by default, and the name came out twice. */
          art: <TileArt item={item} label={false} />,
          mark: item.subtitle === lead
            ? { src: 'media/prophet-mark.png', alt: `${lead} logo` }
            : undefined,
        };
      })}
    />
  );
}

/* ── the detail ────────────────────────────────────────────── */

/**
 * A piece with its own film, opened as an article rather than as an entry.
 *
 * The entry layout puts a 320px image beside the text, which suits a role and
 * not 600 words with eight figures. Here the film runs the full width of the
 * card, the text sets large (21px) in a 780px column, about 75 characters, so
 * the piece fills the page the way an article does rather than sitting in a
 * narrow strip. The width is in px, not ch: a ch width grows with the pull
 * quote's larger type and pushed it out past the column. Each figure sits after
 * the paragraph it illustrates at the card's full width, so a still from a
 * 16:9 film is large enough to read.
 */
/** The link at the head of an article, named for where it goes. */
const hrefLabel = (item: Item) => {
  if (item.hrefLabel) return item.hrefLabel;
  const href = item.href ?? '';
  if (/\.pdf$/i.test(href)) return 'Read the paper (PDF)';
  try {
    return `Read it on ${new URL(href).hostname.replace(/^www\./, '')}`;
  } catch {
    return 'Read the original';
  }
};

function Article({ item }: { item: Item }) {
  const film = item.film;
  const photo = ENTRY_ART[item.id];
  return (
    <article className="overflow-hidden rounded-2xl border bg-card">
      {/* The head of the piece: its film where it has one. Until then its
          photograph, or its tone, in a wide band, so every piece has the same
          shape and gaining a film is one field in writing.json. */}
      {film ? (
        <FilmTile src={film.src} poster={film.poster} title={film.title} duration={film.duration} className="" />
      ) : (
        <div className="relative aspect-[21/9] w-full overflow-hidden">
          {photo
            ? <img src={photo} alt="" className="absolute inset-0 size-full object-cover" />
            : <TileArt item={item} size="large" label={false} />}
        </div>
      )}
      <div className="px-5 pb-12 pt-8 sm:px-12 sm:pb-16 sm:pt-12">
        <header className="mx-auto max-w-[780px]">
          <p className="t-body-md text-muted-foreground">{item.subtitle}</p>
          <h2 className="t-headline-lg sm:t-display-md mt-2 text-balance">{item.title}</h2>
          {item.summary && <p className="mt-4 text-[20px] leading-[30px] text-muted-foreground sm:text-[24px] sm:leading-[34px]">{item.summary}</p>}
          {/* The facts line, without what the label above already says: "Essay"
              over "Essay", "Draft" over "Draft". */}
          {(() => {
            const facts = (item.meta ?? []).map((m) => m.value).filter((v) => !item.subtitle.includes(v));
            return facts.length ? <p className="t-body-sm mt-5 text-muted-foreground">{facts.join('  ·  ')}</p> : null;
          })()}
          {/* Where the piece was published, first, before the text: the
              original is the authority and the text here is the reading copy. */}
          {item.href && (
            <a
              href={asset(item.href)}
              target="_blank"
              rel="noopener noreferrer"
              className="t-label mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border px-5 transition hover:bg-muted"
            >
              {hrefLabel(item)} <ArrowUpRight aria-hidden className="size-4" />
            </a>
          )}
        </header>
        <div className="mt-10 flex flex-col gap-7">
          {(item.essay ?? []).map((section, i) => (
            <React.Fragment key={i}>
              {section.heading && <h3 className="t-headline-md mx-auto w-full max-w-[780px]">{section.heading}</h3>}
              {section.text && (
                <p className={`mx-auto w-full max-w-[780px] ${section.pull ? 'my-4 text-balance text-[26px] font-medium leading-[34px] sm:text-[36px] sm:leading-[46px]' : 'text-[18px] leading-[30px] text-foreground/90 sm:text-[21px] sm:leading-[35px]'}`}>
                  {section.text}
                </p>
              )}
              {!!section.points?.length && (
                <ul className="mx-auto flex w-full max-w-[780px] flex-col gap-4">
                  {section.points.map((point, j) => (
                    <li key={j} className="border-l-2 border-border pl-5 text-[18px] leading-[30px] text-muted-foreground sm:text-[21px] sm:leading-[35px]">
                      {point.lead && <span className="font-medium text-foreground">{point.lead} </span>}
                      {point.text}
                    </li>
                  ))}
                </ul>
              )}
              {section.figure && (
                <figure className="mx-auto my-5 w-full">
                  <img
                    src={section.figure.src}
                    alt={section.figure.alt}
                    loading="lazy"
                    className="aspect-video w-full rounded-lg border bg-[#0D0D0D] object-cover"
                  />
                  {section.figure.caption && (
                    <figcaption className="t-body-sm mt-3 text-muted-foreground">{section.figure.caption}</figcaption>
                  )}
                </figure>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </article>
  );
}

/**
 * Modelled on the gallery's own modal — full backdrop, the art enlarged, a close
 * control, and the draggable strip of siblings along the bottom with its tilt
 * and scale.
 *
 * Built rather than reused, for three reasons that are specific rather than
 * stylistic: that modal renders a single <img> and 18 of these entries have no
 * image; it shows exactly one line of `desc` where these carry dates, a summary,
 * actions, outcomes and a link; and its chrome is hardcoded sky-blue and grey,
 * which does not follow the theme toggle.
 */
function EntryOverlay({
  items, index, onIndex, onClose, body,
}: {
  items: Item[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  body?: React.ReactNode;
}) {
  const item = items[index];
  /* Every piece of writing opens as an article, film or not, so the section
     reads as one publication; the work and education entries keep the card. */
  const isArticle = WRITING.includes(item);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items.length, onIndex, onClose]);

  /* The page behind holds still while a panel is open. Without this a phone
     scrolled the section underneath, and closing the panel left you somewhere
     else. Its own effect, so paging between items does not unlock and relock. */
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div className="fixed inset-0 z-[60]">
      <motion.div
        className="absolute inset-0 bg-background/85 backdrop-blur-lg"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}
      />
      <motion.div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="absolute inset-0 flex items-start justify-center overflow-y-auto p-4 outline-none sm:p-8"
      >
        {/* An article takes the wider card: its text column is fixed, so the
            extra width goes to the film and the figures. */}
        <div className={`my-auto w-full pb-28 ${isArticle && !body ? 'max-w-6xl' : 'max-w-5xl'}`}>
          {body ?? (isArticle ? <Article item={item} /> : (
            <div className="grid gap-6 rounded-2xl border bg-card p-5 sm:p-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl lg:aspect-square">
                <TileArt item={item} size="large" />
              </div>
              <div className="min-w-0">
                <p className="t-body-sm text-muted-foreground">{item.subtitle}</p>
                <h2 className="t-headline-md mt-1">{item.title}</h2>
                {item.dates && <p className="t-caption mt-1 tabular-nums text-muted-foreground">{item.dates}</p>}
                {item.summary && <p className="t-body-md mt-4 text-foreground/90">{item.summary}</p>}
                {item.context && <p className="t-body-sm mt-3 text-muted-foreground">{item.context}</p>}
                {/* The piece itself. Headings carry the one weight above body
                    text on Verde's ladder rather than a second size, and a
                    point's lead sentence is set in the foreground with the rest
                    of it following on — which is how it was written. */}
                {!!item.essay?.length && (
                  <div className="mt-6 space-y-6">
                    {item.essay.map((section, i) => (
                      <section key={i}>
                        {section.heading && <h3 className="t-title-lg">{section.heading}</h3>}
                        {section.text && (
                          <p className="t-body-md mt-2 text-foreground/90">{section.text}</p>
                        )}
                        {!!section.points?.length && (
                          <ul className="mt-3 space-y-3">
                            {section.points.map((point, j) => (
                              <li key={j} className="t-body-md border-l-2 border-border pl-4 text-muted-foreground">
                                {point.lead && <span className="text-foreground">{point.lead} </span>}
                                {point.text}
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    ))}
                  </div>
                )}
                {!!item.actions?.length && (
                  <ul className="t-body-sm mt-4 list-disc space-y-1 pl-5">
                    {item.actions.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                )}
                {/* A claim and what backs it. The evidence was in the content all
                    along — nine outcomes cite it — and was being thrown away one
                    line above this, which left the claims looking unsupported. */}
                {!!item.outcomes?.length && (
                  <ul className="t-body-sm mt-4 space-y-2">
                    {item.outcomes.map((o, i) => (
                      <li key={i} className="rounded-md bg-muted px-3 py-2">
                        {o.claim}
                        {!!o.proof.length && (
                          <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                            {o.proof.map((pr) => <ProofLink key={pr.id} proof={pr} />)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {!!item.extraProof?.length && (
                  <div className="mt-4">
                    <p className="t-caption text-muted-foreground">Also on file</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      {item.extraProof.map((pr) => <ProofLink key={pr.id} proof={pr} />)}
                    </div>
                  </div>
                )}
                {!!item.meta?.length && (
                  <dl className="t-body-sm mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
                    {item.meta.map((m) => (
                      <React.Fragment key={m.label}>
                        <dt className="text-muted-foreground">{m.label}</dt>
                        <dd>{m.value}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                )}
                {!!item.skills?.length && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.skills.map((s) => (
                      <span key={s} className="t-caption rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">{s}</span>
                    ))}
                  </div>
                )}
                {/* No generic "Open" button here. It pointed at the first
                    non-restricted piece of evidence, which the proof list above
                    already renders under its own claim and under its real title
                    — so it was a third copy of a link, labelled in a way that
                    hid where it went. On the entries with two case studies it
                    was worse than redundant: which one it opened came down to
                    array order. */}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 rounded-full border bg-background/80 p-2 backdrop-blur transition hover:bg-muted"
      >
        <X className="size-4" />
      </button>

      {/* The gallery modal's dock — a draggable strip of sibling thumbnails
          pinned to the bottom of the viewport — is gone. It floated 36px crops
          over whatever you were reading, and on the about panel, which has one
          item, it was a single thumbnail of the picture already shown full size
          two inches away. Paging between entries is the arrow keys, which the
          handler above still does. */}
    </div>
  );
}

/* ── app ───────────────────────────────────────────────────── */


const TABS = ['home', 'work', 'education', 'built', 'writing'];

export default function App() {
  const [about, setAbout] = React.useState(false);
  const [tab, setTabState] = React.useState(() => {
    const h = window.location.hash.slice(1);
    return TABS.includes(h) ? h : 'home';
  });
  const [open, setOpen] = React.useState<number | null>(null);

  const setTab = (t: string) => { setOpen(null); window.location.hash = t; setTabState(t); };

  /* Every section opens at its top. The landing's scroll position used to carry
     over, so a tile tapped halfway down the landing opened its section halfway
     down, header and first entries already gone. Coming back to the landing
     returns you to where you were on it, so you are not re-scrolling to the
     tile you came from. A layout effect, so it lands before the first paint
     and the tile's flight goes to a header that is on screen. */
  const homeY = React.useRef(0);
  const prevTab = React.useRef(tab);
  React.useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);
  /* Recorded as you scroll the landing, not read when you leave it: by the time
     the section has rendered, a shorter section has already clamped scrollY to
     its own height, and reading it then saved the wrong place. */
  React.useEffect(() => {
    if (tab !== 'home') return;
    const onScroll = () => { homeY.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [tab]);
  React.useLayoutEffect(() => {
    if (prevTab.current === tab) return;
    prevTab.current = tab;
    if (tab !== 'home') { window.scrollTo(0, 0); return; }
    /* Back on the landing, re-applied for up to half a second until it holds,
       in case the page is not yet its full height on the first frame. */
    const y = homeY.current;
    let frames = 0, raf = 0;
    const restore = () => {
      window.scrollTo(0, y);
      if (Math.abs(window.scrollY - y) > 2 && frames++ < 30) raf = requestAnimationFrame(restore);
    };
    restore();
    return () => cancelAnimationFrame(raf);
  }, [tab]);

  /* A panel is a step in history, so Back closes it, which is how a phone
     closes things. Opening pushes an entry at the same address; closing by any
     other route (the button, Escape, the backdrop) steps back over it, so the
     history never collects dead entries. Paging between items stays one step. */
  const openDetail = (i: number) => {
    if (open === null) window.history.pushState({ panel: true }, '');
    setOpen(i);
  };
  const openAbout = () => {
    window.history.pushState({ panel: true }, '');
    setAbout(true);
  };
  const closePanel = () => {
    if (window.history.state?.panel) window.history.back();
    else { setOpen(null); setAbout(false); }
  };
  React.useEffect(() => {
    const onPop = () => { setOpen(null); setAbout(false); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  React.useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1);
      setOpen(null);
      setTabState(TABS.includes(h) ? h : 'home');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const [dark, setDark] = React.useState(false);
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const dockItems: DockItem[] = NAV_ORDER.map((key) => {
    const t = TILES.find((x) => x.key === key)!;
    return { key: t.key, label: t.title, url: t.url, tab: t.tab! };
  });

  const onHome = tab === 'home';

  return (
    <div className="min-h-screen">
      {/* First, and outside everything else: it covers the page rather than
          replacing it, and it decides for itself whether it belongs on screen
          at all. On every path that is not a first visit to the landing page it
          renders nothing and requests nothing. */}
      <Intro />
      <SectionDock
        items={dockItems}
        active={tab}
        onSelect={setTab}
        contact={(profile.contact.links || [])[0]}
        dark={dark}
        onToggleTheme={() => setDark(!dark)}
        onAbout={openAbout}
      />
      {/* Mounted once, outside the tab switch: the range is the ground the whole
          site stands on, so it must not remount as you move between screens. */}
      <RidgeFooter />

      {onHome ? <Home setTab={setTab} /> : <SectionGrid section={tab} onOpen={openDetail} />}

      {/* One item, so the arrow keys have nowhere to page to — which is right:
          there is one of these, and the same panel a writing piece opens. */}
      {about && (
        <EntryOverlay items={[ABOUT]} index={0} onIndex={() => {}} onClose={closePanel} />
      )}

      {open !== null && !onHome && (
        <EntryOverlay
          items={ITEMS[tab]}
          index={open}
          onIndex={setOpen}
          onClose={closePanel}
        />
      )}
    </div>
  );
}
