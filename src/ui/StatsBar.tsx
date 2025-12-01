import { useEffect, useMemo, useRef, useState } from 'react';
import items from '../data/items.json' with { type: 'json' };
import { INVENTORY_CAPACITY } from '../engine/resources.js';
import { Item, Phase, Resources } from '../types.js';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type Props = {
  resources: Resources;
  phase: Phase;
  anomaly: number;
  inventory: string[];
  onUseItem: (itemId: string) => void;
};

const ResourceBar = ({
  label,
  value,
  danger,
  tooltip,
  tooltipId,
}: {
  label: string;
  value: number;
  danger?: boolean;
  tooltip: string;
  tooltipId: string;
}) => (
  <div className="resource">
    <div className="resource-label">
      <div className="resource-label-text">
        <span>{label}</span>
        <button
          type="button"
          className="tooltip-trigger"
          aria-label={`${label} selite`}
          aria-describedby={tooltipId}
        >
          ?
        </button>
        <span id={tooltipId} className="tooltip-bubble" role="tooltip">
          {tooltip}
        </span>
      </div>
      <span className="resource-value">{Math.round(value)}</span>
    </div>
    <div className="bar">
      <div className={`bar-fill ${danger ? 'danger' : ''}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  </div>
);

export const StatsBar = ({ resources, phase, anomaly, inventory, onUseItem }: Props) => {
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

  const itemLookup = useMemo(
    () =>
      (items as Item[]).reduce<Record<string, Item>>((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {}),
    []
  );

  const slots = useMemo(
    () => Array.from({ length: INVENTORY_CAPACITY }, (_, idx) => inventory[idx] ?? null),
    [inventory]
  );

  return (
    <div className="stats-area">
      <div className="stats">
        <ResourceBar
          label="Raha"
          value={pickValue('money')}
          danger={resources.money <= 10}
          tooltip="Raha kertoo, selviätkö vuokrasta ja arjen menoista."
          tooltipId="tooltip-raha"
        />
        <ResourceBar
          label="Mieli"
          value={pickValue('sanity')}
          danger={resources.sanity <= 20}
          tooltip="Mielenrauha. Jos se putoaa nollaan, romahdat."
          tooltipId="tooltip-mieli"
        />
        <ResourceBar
          label="Energia"
          value={resources.energy}
          danger={resources.energy <= 20}
          tooltip="Jaksaminen. Päivän ja yön toiminnot kuluttavat energiaa."
          tooltipId="tooltip-energia"
        />
        <ResourceBar
          label="Lämpö"
          value={resources.heat}
          danger={resources.heat <= 20}
          tooltip="Keho lämpimänä. Nolla tarkoittaa jäätymistä."
          tooltipId="tooltip-lampo"
        />
        <ResourceBar
          label="Anomalia"
          value={pickValue('anomaly')}
          tooltip="Lapin anomalian taso. Mitä korkeampi, sitä oudommaksi maailma käy."
          tooltipId="tooltip-anomalia"
        />
      </div>

      <div className="inventory">
        <div className="inventory-header">
          <div className="inventory-label">Varasto</div>
          <div className="inline-help">
            <button
              type="button"
              className="tooltip-trigger"
              aria-describedby="tooltip-inventory"
              aria-label="Mikä on varasto"
            >
              ?
            </button>
            <span id="tooltip-inventory" className="tooltip-bubble" role="tooltip">
              Varasto pitää taskussa olevat esineet. Käytä nappia hyödyntääksesi niitä.
            </span>
          </div>
        </div>
        <div className="inventory-slots" aria-label="Varaston sisältö">
          {slots.map((itemId, idx) => {
            const item = itemId ? itemLookup[itemId] : undefined;
            return (
              <button
                key={`${itemId ?? 'tyhjä'}-${idx}`}
                className={`inventory-slot ${item ? 'filled' : 'empty'}`}
                title={item?.description ?? 'Tyhjä paikka'}
                type="button"
                disabled={!item}
                onClick={item ? () => onUseItem(item.id) : undefined}
                aria-label={item ? `${item.name} (${item.type === 'tool' ? 'työkalu' : 'kulutus'})` : 'Tyhjä paikka'}
              >
                <span className="inventory-bracket">[</span>
                <span className="inventory-slot-text">{item?.name ?? ' '}</span>
                <span className="inventory-bracket">]</span>
                <span className="inventory-slot-type">{item ? (item.type === 'tool' ? 'työkalu' : 'kulutus') : ''}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
