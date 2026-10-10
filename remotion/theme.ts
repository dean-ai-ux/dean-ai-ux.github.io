/**
 * Verde, restated as literal values for the film.
 *
 * The site gets these from CSS custom properties in src/index.css, resolved at
 * paint time so the theme toggle works. Remotion renders in its own headless
 * Chrome with none of that stylesheet loaded, so `var(--verde-viz-forest)`
 * would resolve to nothing and every fill would come out transparent. These are
 * copies, and the comment on each is the name it is copied from.
 *
 * If a token changes in index.css it has to change here too. There are six of
 * them and they have not moved in the life of the project, which is why this is
 * a copy rather than a build step that parses the CSS.
 */
import { loadVariableFont } from '@remotion/google-fonts/Archivo';

/* Archivo with both axes, matching index.html. The site's display tiers set
   `font-variation-settings: 'wdth'`, so loading weight alone would render the
   large type at the wrong width and the final frame would not line up with the
   landing tile it is supposed to become. */
export const { fontFamily } = loadVariableFont('normal', { subsets: ['latin'] });

export const verde = {
  slate: '#4A5A6A',
  moss: '#7A8B4F',
  brass: '#B8863B',
  clay: '#C97046',
  sage: '#4A7C59',
  forest: '#12352A',
  onForest: '#FFFFFF',
  ink: '#1A1815',
} as const;

/**
 * The site's type tiers, scaled up.
 *
 * index.css sizes these for a page read at arm's length. The film is 1920 wide
 * and watched as a whole, so the same ladder is multiplied by SCALE. The ratios
 * between tiers, the weights and the width axis all carry over unchanged, which
 * is what keeps the closing frame recognisable as the landing tile.
 */
const SCALE = 2.4;

const tier = (size: number, height: number, tracking: number, weight: number, wdth: number) => ({
  fontFamily,
  fontSize: size * SCALE,
  lineHeight: `${height * SCALE}px`,
  letterSpacing: `${tracking * SCALE}px`,
  fontWeight: weight,
  fontVariationSettings: `'wdth' ${wdth}`,
});

export const type = {
  displayLg: tier(57, 62, -1.5, 300, 110),
  displayMd: tier(45, 50, -1, 300, 105),
  headlineLg: tier(36, 44, -0.5, 400, 100),
  headlineMd: tier(28, 36, -0.25, 400, 100),
  titleLg: tier(20, 28, 0, 500, 100),
  titleMd: tier(16, 24, 0, 500, 100),
  bodyMd: tier(16, 26, 0, 400, 100),
  label: tier(14, 20, 0.2, 500, 100),
  caption: tier(12, 16, 0.2, 400, 100),
} as const;

/** The landing tile's own scale, which the closing frame has to match exactly. */
export const TILE_SCALE = SCALE;

export const FPS = 30;
export const DURATION = 720; // 24 seconds
export const WIDTH = 1920;
export const HEIGHT = 1080;
