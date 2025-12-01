import { WeatherType } from '../types.js';

const WEATHER_LABELS: Record<WeatherType, string> = {
  CLEAR: 'Kirkas',
  SNOWSTORM: 'Lumimyrsky',
  FOG: 'Sumu',
  MILD: 'Leuto',
};

const WEATHER_ICONS: Partial<Record<WeatherType, string>> = {
  CLEAR: '☀️',
  SNOWSTORM: '🌨️',
  FOG: '🌫️',
  MILD: '🌤️',
};

export const getWeatherLabel = (weather: WeatherType): string => WEATHER_LABELS[weather] ?? weather;

export const getWeatherIcon = (weather: WeatherType): string | undefined => WEATHER_ICONS[weather];

export const getWeatherDisplay = (weather: WeatherType): string => {
  const label = getWeatherLabel(weather);
  const icon = getWeatherIcon(weather);
  return icon ? `${icon} ${label}` : label;
};
