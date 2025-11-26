const words = ['LUOVUTA', 'KYLMÄ', 'KELA', 'SUMU', 'TYHJIÖ'];

// UI-only subliminal helper: anomaly gates rare hallucination words without touching logic or CLI.
export const getSubliminalWord = (anomaly: number): string | null => {
  if (anomaly < 50) return null;

  const anomalyLevel = Math.min(Math.max(anomaly / 100, 0, 1), 1);
  const chance = anomalyLevel > 0.8 ? 0.1 : 0.06;

  return Math.random() < chance ? words[Math.floor(Math.random() * words.length)] : null;
};
