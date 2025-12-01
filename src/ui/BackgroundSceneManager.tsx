import { useMemo } from 'react';
import type { Phase, WeatherType } from '../types.js';
import { bgPath } from '../utils/assetPath.js';

// Syväjää background assets expected under public/assets/bg/:
// - bg_syvajaa_city_night.jpg (city night street, "BAARI" sign, bus stop)
// - bg_syvajaa_ounasjoki.jpg (frozen river with aurora)
// - bg_syvajaa_ratapiha.jpg (abandoned VR rail yard at night)
// - bg_syvajaa_tori_midnight.jpg (empty market square, police car, glitch aurora)
//
// Update the deriveSceneKey logic below when new scenes or location hints are added.

const BACKGROUNDS = {
  cityNight: 'bg_syvajaa_city_night.jpg',
  ounasjoki: 'bg_syvajaa_ounasjoki.jpg',
  railYard: 'bg_syvajaa_ratapiha.jpg',
  toriMidnight: 'bg_syvajaa_tori_midnight.jpg',
} as const;

type SceneKey = keyof typeof BACKGROUNDS;

export type BackgroundSceneManagerProps = {
  day: number;
  phase: Phase;
  anomaly: number;
  weather: WeatherType;
  /** Optional hint from the current scene/location, e.g. "ounasjoki" or "tori". */
  locationHint?: 'city' | 'ounasjoki' | 'ratapiha' | 'tori';
};

const deriveSceneKey = ({
  day,
  phase,
  anomaly,
  weather,
  locationHint,
}: BackgroundSceneManagerProps): SceneKey => {
  const anomalyHigh = anomaly >= 75;
  const lateGame = day >= 10;
  const midGame = day >= 5;
  const coldFront = weather === 'SNOWSTORM' || weather === 'FOG';
  const deepNight = phase === 'NIGHT';

  if (locationHint === 'tori') return 'toriMidnight';
  if (locationHint === 'ratapiha') return 'railYard';
  if (locationHint === 'ounasjoki') return 'ounasjoki';

  if (anomalyHigh || lateGame || (deepNight && anomaly >= 50)) {
    return 'toriMidnight';
  }

  if (midGame && deepNight) {
    return 'railYard';
  }

  if (coldFront || day >= 3) {
    return 'ounasjoki';
  }

  return 'cityNight';
};

export const BackgroundSceneManager = (props: BackgroundSceneManagerProps) => {
  const { anomaly, day, phase, weather, locationHint } = props;
  const sceneKey = useMemo(
    () => deriveSceneKey({ anomaly, day, phase, weather, locationHint }),
    [anomaly, day, phase, weather, locationHint]
  );
  const selectedBackground = bgPath(BACKGROUNDS[sceneKey]);

  return (
    <div className="background-scene" aria-hidden>
      <div
        className="background-scene__image"
        style={{ backgroundImage: `url(${selectedBackground})` }}
      />
      <div className="background-scene__overlay" />
    </div>
  );
};
