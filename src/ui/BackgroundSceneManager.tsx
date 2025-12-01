import { useMemo } from 'react';
import type { Phase } from '../types.js';

// Syväjää background stills bundled in src/assets/images:
// - bg_syvajaa_city_night.jpg (city street at night, neon "BAARI" sign, bus stop shelter)
// - bg_syvajaa_ounasjoki.jpg (frozen Ounasjoki river under aurora)
// - bg_syvajaa_ratapiha.jpg (abandoned VR rail yard at night)
// - bg_syvajaa_tori_midnight.jpg (empty market square, glitchy aurora, lone police car)
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
  const isNight = phase === 'NIGHT';
  const isLateGame = day >= 8;

  if (normalizedLocation.includes('ouna')) return 'ounasjoki';
  if (normalizedLocation.includes('ratapiha') || normalizedLocation.includes('yard')) return 'ratapiha';
  if (normalizedLocation.includes('tori') || normalizedLocation.includes('market')) return 'toriMidnight';

  if (anomalyBand === 'rift' || isLateGame) {
    return 'toriMidnight';
  }

  if (isNight) {
    return 'ratapiha';
  }

  if (anomalyBand === 'odd') {
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
