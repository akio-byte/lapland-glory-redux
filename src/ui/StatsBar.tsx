import { useEffect, useMemo, useRef, useState } from 'react';
import { Phase, Resources } from '../types.js';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type Props = {
  resources: Resources;
  phase: Phase;
  anomaly: number;
};

const ResourceBar = ({ label, value, danger }: { label: string; value: number; danger?: boolean }) => (
  <div className="resource">
    <div className="resource-label">
      <span>{label}</span>
      <span className="resource-value">{Math.round(value)}</span>
    </div>
    <div className="bar">
      <div className={`bar-fill ${danger ? 'danger' : ''}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  </div>
);

export const StatsBar = ({ resources, phase, anomaly }: Props) => {
  const [fakeStat, setFakeStat] = useState<{ field: keyof Resources; value: number } | null>(null);
  const prevPhase = useRef<string | null>(null);

  const anomalyLevel = useMemo(() => clamp(anomaly / 100, 0, 1), [anomaly]);

  useEffect(() => {
    if (phase !== prevPhase.current) {
      prevPhase.current = phase;

      if (anomalyLevel > 0.45 && Math.random() < 0.45) {
        const field: keyof Resources = Math.random() > 0.5 ? 'money' : 'sanity';
        // Briefly flash a false value without touching real state to mimic unreliable readouts.
        const value = field === 'money' ? 9999 : 0;
        setFakeStat({ field, value });

        const timer = setTimeout(() => setFakeStat(null), 200 + Math.random() * 220);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [phase, anomalyLevel]);

  const pickValue = (field: keyof Resources) => (fakeStat?.field === field ? fakeStat.value : resources[field]);

  return (
    <div className="stats">
      <ResourceBar label="Raha" value={pickValue('money')} danger={resources.money <= 10} />
      <ResourceBar label="Mieli" value={pickValue('sanity')} danger={resources.sanity <= 20} />
      <ResourceBar label="Energia" value={resources.energy} danger={resources.energy <= 20} />
      <ResourceBar label="Lämpö" value={resources.heat} danger={resources.heat <= 20} />
    </div>
  );
};
