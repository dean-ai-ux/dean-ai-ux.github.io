import { ShotClose, ShotOpen } from './bookends';
import { ShotLiving, ShotNeeds, ShotThresholds, ShotUseful } from './thoughts';
import { ShotEco, ShotFoundry, ShotLive } from './proofs';

/**
 * The approved storyboard, in order. `frames` is each shot's length on screen
 * and adds to 720; `key` is the frame its storyboard still was taken from, so
 * the review stills can be re-rendered at any time with the same framing.
 */
export const SHOTS = [
  { id: 'Shot1-Open', component: ShotOpen, frames: 60, key: 46 },
  { id: 'Shot2-Useful', component: ShotUseful, frames: 90, key: 72 },
  { id: 'Shot3-Needs', component: ShotNeeds, frames: 90, key: 82 },
  { id: 'Shot4-Foundry', component: ShotFoundry, frames: 105, key: 90 },
  { id: 'Shot5-Living', component: ShotLiving, frames: 75, key: 68 },
  { id: 'Shot6-Live', component: ShotLive, frames: 105, key: 66 },
  { id: 'Shot7-Thresholds', component: ShotThresholds, frames: 75, key: 70 },
  { id: 'Shot8-Eco', component: ShotEco, frames: 75, key: 70 },
  { id: 'Shot9-Close', component: ShotClose, frames: 45, key: 44 },
] as const;
