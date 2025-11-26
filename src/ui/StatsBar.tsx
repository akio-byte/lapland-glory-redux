import { Resources } from '../types.js';

type Props = {
  resources: Resources;
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

export const StatsBar = ({ resources }: Props) => (
  <div className="stats">
    <ResourceBar label="Raha" value={resources.money} danger={resources.money <= 10} />
    <ResourceBar label="Mieli" value={resources.sanity} danger={resources.sanity <= 20} />
    <ResourceBar label="Energia" value={resources.energy} danger={resources.energy <= 20} />
    <ResourceBar label="Lämpö" value={resources.heat} danger={resources.heat <= 20} />
  </div>
);
