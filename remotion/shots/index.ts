import { ShotClose, ShotOpen, ShotQuestion } from './open';
import { ShotFoundry, ShotSystem } from './ai';
import { ShotLiving, ShotProjects } from './deliverables';
import { ShotDavidson, ShotGame, ShotGuidance } from './policy';

/**
 * Storyboard v2, in order. `frames` is each shot's time on screen and adds to
 * 840 (28 seconds). `key` is the frame its review still is taken from: late
 * enough that the shot's diagram has finished drawing.
 *
 * Every diagram holds at least two seconds after it finishes drawing; the
 * timings inside each shot are set against these lengths.
 */
export const SHOTS = [
  { id: 'S01-Open', component: ShotOpen, frames: 54, key: 46 },
  { id: 'S02-Question', component: ShotQuestion, frames: 60, key: 56 },
  { id: 'S03-System', component: ShotSystem, frames: 156, key: 120 },
  { id: 'S04-Foundry', component: ShotFoundry, frames: 108, key: 90 },
  { id: 'S05-Living', component: ShotLiving, frames: 99, key: 92 },
  { id: 'S06-Projects', component: ShotProjects, frames: 66, key: 60 },
  { id: 'S07-Guidance', component: ShotGuidance, frames: 126, key: 110 },
  { id: 'S08-Game', component: ShotGame, frames: 48, key: 44 },
  { id: 'S09-Davidson', component: ShotDavidson, frames: 81, key: 72 },
  { id: 'S10-Close', component: ShotClose, frames: 42, key: 41 },
] as const;
