import { useMemo } from 'react';
import type { Phase } from '../types.js';

// Syväjää background stills bundled in src/assets/images:
// - bg_syvajaa_city_night.jpg → Centre of Rovaniemi at night; neon "BAARI" sign and a bus stop shelter.
// - bg_syvajaa_ounasjoki.jpg → Frozen Ounasjoki river and aurora glow; exploration and cold exposure beats.
// - bg_syvajaa_ratapiha.jpg → VR rail yard with idle freight cars; industrial, shift-work, or heavy labour scenes.
// - bg_syvajaa_tori_midnight.jpg → Tori market square at midnight; glitching aurora and a lone police car.
//
// To add a new scene later: place the JPG/PNG in src/assets/images and extend the
// BACKGROUNDS map plus the deriveSceneKey logic below.
import cityNightBg from '../assets/images/bg_syvajaa_city_night.jpg';
import ounasjokiBg from '../assets/images/bg_syvajaa_ounasjoki.jpg';
import ratapihaBg from '../assets/images/bg_syvajaa_ratapiha.jpg';
import toriMidnightBg from '../assets/images/bg_syvajaa_tori_midnight.jpg';

const BACKGROUNDS = {
  cityNight: cityNightBg,
  ounasjoki: ounasjokiBg,
  ratapiha: ratapihaBg,
  toriMidnight: toriMidnightBg,
} as const;

type SceneKey = keyof typeof BACKGROUNDS;

export type BackgroundSceneManagerProps = {
  day: number;
  phase: Phase;
  anomalyBand?: 'calm' | 'odd' | 'rift';
  /** Optional location identifier, e.g. "ounasjoki", "ratapiha", "tori". */
  locationId?: string;
};

const deriveSceneKey = ({ day, phase, anomalyBand, locationId }: BackgroundSceneManagerProps): SceneKey => {
  const normalizedLocation = locationId?.toLowerCase() ?? '';
  const matches = (needles: string[]) => needles.some((needle) => normalizedLocation.includes(needle));

  const isLatePhase = phase === 'NIGHT' || phase === 'SLEEP';
  const highAnomaly = anomalyBand === 'rift';
  const exploratoryChill = anomalyBand === 'odd';
  const deepRun = day >= 8; // Later days lean into the midnight square.

  if (highAnomaly || isLatePhase || deepRun) {
    return 'toriMidnight';
  }

  if (matches(['ouna', 'joki', 'river', 'frost', 'cold', 'aurora'])) {
    return 'ounasjoki';
  }

  if (matches(['ratapiha', 'rail', 'yard', 'factory', 'work'])) {
    return 'ratapiha';
  }

  if (exploratoryChill) {
    return 'ounasjoki';
  }

  return 'cityNight';
};

export function BackgroundSceneManager(props: BackgroundSceneManagerProps) {
  const { day, phase, anomalyBand, locationId } = props;
  const sceneKey = useMemo(
    () => deriveSceneKey({ day, phase, anomalyBand, locationId }),
    [day, phase, anomalyBand, locationId]
  );
  const backgroundUrl = BACKGROUNDS[sceneKey];

  return (
    <div className="bg-scene-root" aria-hidden>
      <div className="bg-scene-image" style={{ backgroundImage: `url(${backgroundUrl})` }} />
      <div className="bg-scene-overlay" />
    </div>
  );
}
