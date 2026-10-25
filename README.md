# verdevista

Dean Dowling's living resume. Vite, React, TypeScript and Tailwind, built on the
Verde design system.

Live at <https://dean-ai-ux.github.io/>. Pushing to `main` builds and deploys it
through `.github/workflows/deploy.yml`.

```
npm run dev      # local dev server
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## Content

Everything the site says lives in `src/content/*.json`. The components read it;
none of it is written into the components themselves. Claims carry their own
evidence, and evidence marked `restricted` renders as a withheld note rather
than as a link.

## Generated assets

Four generators produce committed output, so a clean checkout builds without
running any of them. Re-run one only when its inputs change.

| Command | Produces | Needs |
|---|---|---|
| `node scripts/gen-ridge.mjs` | `src/generated/ridge.ts` | the Verde checkout, `VERDE=` to override |
| `node scripts/gen-app-icons.mjs` | `src/generated/app-icons.ts`, project marks | nothing |
| `node scripts/gen-work-crops.mjs` | `public/media/work-*.jpg` | the source photographs, `SOURCES=` to override |
| `npm run video:captures` | `public/media/film-*.jpg` | a built `dist/`, Chrome |
| `npm run video:render` | `public/media/intro.mp4` | Remotion, which downloads its own headless Chrome |

### Checking it on a phone

```
npm run build && npm run check:mobile
```

`scripts/check-mobile.mjs` serves `dist/` and replays what a phone visitor does,
in the Chrome already on this machine (`CHROME=` to point elsewhere). It fails
on: anything wider than the screen, text under 13px or a tap target under 44px
at 360, 390 and 430 wide and held sideways; a section that opens with its header
off screen, from a tile or the menu; Back to the landing not returning to where
you were; a Work swipe that does not settle on a card; a detail panel that lets
the page behind scroll, or that Back does not close. It is not run in CI.

### The landing films

The landing page opens on the Vista intro: the VISTA wordmark that opens
**Vista: Many Heads**, the brand film of Dean's essay
"Software isn't losing its head. It's growing thousands.", made with his Vista
video toolkit (a separate, private repo). It plays silently over the page on a
first visit, about two seconds, then the landing page shows; a scroll, click
or key press ends it early. The clip is the film's first 2.45 seconds with the
fade-up played at double speed and nothing after the fade-out. The whole film, with its piano score, is the top left tile of the landing
grid, and is only downloaded when someone presses play.

Both files are cut from the toolkit's render, `Vista-Many-Heads-v3.mp4`:

```
ffmpeg -i Vista-Many-Heads-v3.mp4 -filter_complex \
  "[0:v]trim=0:0.9,setpts=0.5*(PTS-STARTPTS)[a];[0:v]trim=0.9:2.45,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1,fps=30[v]" \
  -map "[v]" -an -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p -movflags +faststart public/media/vista-intro.mp4
ffmpeg -i Vista-Many-Heads-v3.mp4 -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart public/media/many-heads.mp4
ffmpeg -ss 0.3 -i Vista-Many-Heads-v3.mp4 -frames:v 1 -q:v 3 public/media/vista-intro-poster.jpg
ffmpeg -ss 7.5 -i Vista-Many-Heads-v3.mp4 -frames:v 1 -vf scale=960:-1 -q:v 3 public/media/many-heads-poster.jpg
```

### The Remotion film (not in use)

The film below played over the landing page until October 2026. The site no
longer loads it; the source stays so it can be rendered again.

A 28 second film, Apple keynote
style with liquid glass, in three chapters taken from the bio, each followed by
the work behind it, with diagrams where there is information to show. It ends on
the landing tile.

Two cuts from one set of shots: `Intro` (1920x1080) for laptops and
`IntroPortrait` (1080x1920) for phones. `src/components/ui/intro.tsx` picks one
before the video element mounts, so each device downloads only its own file.
Shots live in `remotion/shots/`, listed in `remotion/shots/index.ts`; each is also
its own composition in both orientations for previewing.

Type has a floor in `remotion/layout.ts`: nothing under 44px in the laptop cut or
48px in the phone cut, so text never renders below about 17px on a phone. Glass
that frames words is sized from their measured width. The forward guidance chart
is drawn from `remotion/data/unrate-2012-2014.json` (BLS via FRED) and the FOMC
statements of December 2012 and March 2014.

```
npm run video:studio    # preview and iterate
npm run video:captures  # re-photograph the site and the game
npm run video:all       # both cuts and both posters
npm run video:render    # public/media/intro.mp4 (laptop)
npm run video:render:portrait  # public/media/intro-portrait.mp4 (phone)
```

The film shows the real site and the real game, photographed from `dist/` by
`scripts/gen-film-captures.mjs`. Run `npm run build` before the captures, and
re-run them whenever the site's appearance changes, or the film will keep
showing an older design.

Every transition is DOM-based on purpose. The shader presentations in
`@remotion/transitions` render at roughly five seconds a frame here against
0.2 for everything else, which turns a one-minute render into six.

The composition reads the same `src/content/*.json` the site does, so the film
cannot contradict the page. It does go stale: re-render after changing content
that appears in it. CI does not render the film.

Remotion is free for individuals and for companies of up to three people, and
needs a paid Company License above that.

---

The notes below are from the Vite template this started as.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
