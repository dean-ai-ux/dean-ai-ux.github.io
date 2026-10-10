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

### The intro film

A 28 second film that plays over the landing page on a first visit and gets out
of the way on the first scroll, click, key press or when it ends. Apple keynote
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
