import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { SectionDock, type DockItem } from '@/components/ui/section-dock';
import { RidgeFooter } from '@/components/ui/ridge-footer';
import { SqueezeCarousel, type SqueezeSlide } from '@/components/ui/carousel-squeeze';
import { WorkTrack } from '@/components/ui/work-track';
import { APP_PHOTOS, APP_FIGURES } from '@/generated/app-icons';

import profile from '@/content/profile.json';
import screens from '@/content/screens.json';
import work from '@/content/work.json';
import education from '@/content/education.json';
import volunteering from '@/content/volunteering.json';
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
const NAV_ORDER = ['work', 'education', 'volunteering', 'built', 'writing'];

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
  started(start) ? `${fmt(start)} — ${fmt(end)}` : `From ${fmt(start)}`;

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
const ACTION_VERB: Record<string, string> = { app: 'Play', doc: 'Open', repo: 'Code', link: 'Read' };

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
  { key: 'built', title: 'Built', desc: 'Verde, Fed Chair for a Year, MAIA, Course Compass', url: 'media/built-ridges.jpg', tab: 'built',
    span: 'col-span-1 row-span-2 sm:col-span-1 sm:row-span-2 lg:col-start-4 lg:col-span-1 lg:row-start-1 lg:row-span-3' },
  { key: 'education', title: 'Education', desc: '', url: 'media/davidson.jpg', tab: 'education',
    span: 'col-span-1 row-span-2 sm:col-span-2 sm:row-span-2 lg:col-start-2 lg:col-span-2 lg:row-start-1 lg:row-span-3' },
  { key: 'volunteering', title: 'Volunteering', desc: '', url: 'media/costa-rica.jpg', tab: 'volunteering',
    span: 'col-span-1 row-span-2 sm:col-span-1 sm:row-span-2 lg:col-start-2 lg:col-span-1 lg:row-start-4 lg:row-span-2' },
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
  'verde-design-system': 'media/icon-verde-design-system.jpg',
  'fed-chair-for-a-year': 'media/icon-fed-chair-for-a-year.jpg',
  'davidson-course-compass': 'media/icon-davidson-course-compass.jpg',
  maia: 'media/maia.jpg',
  'w-0': 'media/writing.jpg',
  'w-1': 'media/footwear.jpg',
  'w-2': 'media/supply-wisdom.jpg',
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
  essay?: { heading?: string; text?: string; points?: { lead?: string; text: string }[] }[];
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
const WRITING = writing as Item[];

/* The about panel, as one item, so it uses the same detail view every section
   already opens. It opens on its own first paragraph — the tagline that used to
   lead it is gone, and profile.tagline is now unused. */
const ABOUT: Item = about as Item;

const ITEMS: Record<string, Item[]> = {
  work: (work as Entry[]).map((e) => fromEntry(e, 'role')),
  education: (education as Entry[]).map((e) => fromEntry(e, 'role')),
  volunteering: (volunteering as Entry[]).map((e) => fromEntry(e, 'role')),
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
  volunteering: [
    'lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:row-span-5',
    'lg:col-start-3 lg:col-span-2 lg:row-start-1 lg:row-span-3',
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

function Home({ setTab, onAbout }: { setTab: (t: string) => void; onAbout: () => void }) {
  const by = (key: string) => {
    const i = TILES.findIndex((t) => t.key === key);
    return { tile: TILES[i], index: i };
  };
  const work = by('work'), education = by('education');
  const built = by('built'), volunteering = by('volunteering'), writing = by('writing');

  return (
    <div className="min-h-[calc(100vh+380px)] px-4 pb-28 pt-20 sm:px-6">
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
          <button
            type="button"
            onClick={onAbout}
            aria-label="About Dean Dowling"
            aria-haspopup="dialog"
            className="group flex items-center gap-5 rounded-2xl p-6 text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:gap-6 sm:p-8"
            style={{ background: 'var(--verde-viz-forest)', color: 'var(--verde-viz-forest-on)' }}
          >
            <div className="shrink-0">
              {/* portrait.jpg is the original headshot, 400x400 and untouched.
                  It is square, so object-cover crops nothing and the framing is
                  entirely in the file. Do not substitute a taller crop: a square
                  crop centred in one takes the top off the head. */}
              <img src="media/portrait.jpg" alt="Dean Dowling" className="size-24 rounded-full object-cover" />
              {/* Under the portrait rather than after the list, so the identity
                  column carries it and the four lines alone set the tile's
                  height — which is how it stays the height it already was. */}
              <span className="t-label mt-3 inline-flex items-center gap-1.5 whitespace-nowrap underline underline-offset-4 opacity-80 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                About me <ArrowUpRight aria-hidden className="size-3.5" />
              </span>
            </div>
            {/* Four moves rather than a sentence. The left of each is where it
                started and is set back; the right is where it is now. */}
            <ul className="t-headline-md">
              {(profile.arc || []).map(([from, to]: string[]) => (
                <li key={from} className="flex items-center gap-2.5">
                  <span className="opacity-60">{from}</span>
                  <ArrowRight aria-hidden className="size-5 shrink-0 opacity-50" />
                  <span>{to}</span>
                </li>
              ))}
            </ul>
          </button>
          <div className="grid grid-cols-2 gap-4">
            <LandingTile {...work} setTab={setTab} />
            <LandingTile {...education} setTab={setTab} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-rows-[minmax(0,414fr)_minmax(0,408fr)]">
          <LandingTile {...volunteering} setTab={setTab} />
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
    <div className="min-h-[calc(100vh+380px)]">
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

      <section className="px-4 pb-28 sm:px-6">
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
                  aria-label={`${item.title} — ${item.subtitle}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30, delay: 0.04 + i * 0.05 }}
                  className="group flex cursor-pointer gap-5 rounded-2xl border bg-card p-5 text-left outline-none ring-offset-background transition-colors hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="relative size-40 shrink-0 overflow-hidden rounded-xl border transition group-hover:brightness-95">
                    <AppIcon item={item} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="t-title-lg">{item.title}</p>
                    <p className="t-caption text-muted-foreground">{item.subtitle}</p>
                    {item.summary && (
                      <p className="t-body-sm mt-2 line-clamp-3 text-foreground/80">{item.summary}</p>
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
                        opens behind the new tab. */}
                    {item.href && verb && (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="t-label mt-auto inline-flex w-fit items-center gap-1.5 pt-3 underline underline-offset-4 transition hover:opacity-70"
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
                    /* Straight out to the piece where one is published; into the
                       detail overlay where there is nothing yet to link to. */
                    action: item.href ? 'Read' : 'Open',
                    href: item.href,
                    target: item.href ? '_blank' : undefined,
                    onAction: item.href ? undefined : () => onOpen(i),
                  };
                })}
                height="clamp(240px, 33cqi, 520px)"
                radius={12}
                /* Clicking the open panel goes to the piece itself where one is
                   published — the detail panel for those carried a title, a
                   subtitle and a link, so it was a step asking you to take
                   another step. The five with nothing to link to still open it,
                   because it is the only place their detail exists.

                   noopener,noreferrer: the opened page gets no handle back on
                   this one. */
                onOpen={(i) => {
                  const href = items[i]?.href;
                  if (href) window.open(href, '_blank', 'noopener,noreferrer');
                  else onOpen(i);
                }}
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
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
                ENTRY_ART[item.id] ? 'bg-gradient-to-t from-black/85 via-black/45 to-transparent text-white' : ''
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
      {proof.title} — <em className="not-italic opacity-80">{proof.withheld}</em>
    </span>
  );
}

/** Every proof point attached to an entry, cited or not. */
const proofCount = (item: Item) =>
  (item.outcomes ?? []).reduce((n, o) => n + o.proof.length, 0) + (item.extraProof?.length ?? 0);

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
        const n = proofCount(item);
        return {
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          dates: item.dates ?? '',
          duration: r ? span(r.start, r.end) || undefined : undefined,
          footnote: n ? `${n} proof point${n === 1 ? '' : 's'}` : undefined,
          art: <TileArt item={item} />,
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
        <div className="my-auto w-full max-w-5xl pb-28">
          {body ?? (
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
          )}
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


const TABS = ['home', 'work', 'education', 'volunteering', 'built', 'writing'];

export default function App() {
  const [about, setAbout] = React.useState(false);
  const [tab, setTabState] = React.useState(() => {
    const h = window.location.hash.slice(1);
    return TABS.includes(h) ? h : 'home';
  });
  const [open, setOpen] = React.useState<number | null>(null);

  const setTab = (t: string) => { setOpen(null); window.location.hash = t; setTabState(t); };
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
      <SectionDock
        items={dockItems}
        active={tab}
        onSelect={setTab}
        contact={(profile.contact.links || [])[0]}
        dark={dark}
        onToggleTheme={() => setDark(!dark)}
      />
      {/* Mounted once, outside the tab switch: the range is the ground the whole
          site stands on, so it must not remount as you move between screens. */}
      <RidgeFooter />

      {onHome ? <Home setTab={setTab} onAbout={() => setAbout(true)} /> : <SectionGrid section={tab} onOpen={setOpen} />}

      {/* One item, so the arrow keys have nowhere to page to — which is right:
          there is one of these, and the same panel a writing piece opens. */}
      {about && (
        <EntryOverlay items={[ABOUT]} index={0} onIndex={() => {}} onClose={() => setAbout(false)} />
      )}

      {open !== null && !onHome && (
        <EntryOverlay
          items={ITEMS[tab]}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
