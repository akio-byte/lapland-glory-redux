import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import items from '../data/items.json' with { type: 'json' };
import { INVENTORY_CAPACITY } from '../engine/resources.js';
import { Item, Phase, ResourceDelta, Resources } from '../types.js';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type Props = {
  resources: Resources;
  phase: Phase;
  anomaly: number;
  inventory: string[];
  delta?: ResourceDelta;
  onUseItem: (itemId: string) => void;
};

const ResourceBar = ({
  label,
  value,
  danger,
  tooltip,
  tooltipId,
  deltaValue = 0,
  showDelta = false,
  icon,
}: {
  label: string;
  value: number;
  danger?: boolean;
  tooltip: string;
  tooltipId: string;
  deltaValue?: number;
  showDelta?: boolean;
  icon: ReactNode;
}) => {
  const changeClass = showDelta ? (deltaValue > 0 ? 'positive' : 'negative') : '';
  return (
    <div className={`resource ${changeClass ? `resource-${changeClass}` : ''}`}>
      <div className="resource-label">
        <div className="resource-label-text">
          <span className="resource-icon" aria-hidden="true">
            {icon}
          </span>
          <span className="resource-name">{label}</span>
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
        <div className="resource-value-wrap">
          <span className="resource-value">{Math.round(value)}</span>
          {showDelta && deltaValue !== 0 && (
            <span className={`resource-delta-bubble ${changeClass}`}>
              {deltaValue > 0 ? '+' : ''}
              {Math.round(deltaValue)}
            </span>
          )}
        </div>
      </div>
      <div className="bar">
        <div className={`bar-fill ${danger ? 'danger' : ''}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
};

export const StatsBar = ({ resources, phase, anomaly, inventory, delta, onUseItem }: Props) => {
  const [fakeStat, setFakeStat] = useState<{ field: keyof Resources; value: number } | null>(null);
  const [visibleDelta, setVisibleDelta] = useState<ResourceDelta | null>(null);
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

  useEffect(() => {
    if (!delta) {
      setVisibleDelta(null);
      return undefined;
    }

    const hasChange = Object.values(delta).some((value) => value !== 0);
    if (!hasChange) {
      setVisibleDelta(null);
      return undefined;
    }

    setVisibleDelta(delta);
    const timer = setTimeout(() => setVisibleDelta(null), 1700);
    return () => clearTimeout(timer);
  }, [delta]);

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

  const pickDelta = (field: keyof Resources) => visibleDelta?.[field] ?? 0;

  return (
    <div className="stats-area">
      <div className="stats">
        <ResourceBar
          label="Raha"
          value={pickValue('money')}
          danger={resources.money <= 10}
          tooltip="Raha kertoo, selviätkö vuokrasta ja arjen menoista."
          tooltipId="tooltip-raha"
          deltaValue={pickDelta('money')}
          showDelta={Boolean(visibleDelta) && pickDelta('money') !== 0}
          icon="💶"
        />
        <ResourceBar
          label="Mieli"
          value={pickValue('sanity')}
          danger={resources.sanity <= 20}
          tooltip="Mielenrauha. Jos se putoaa nollaan, romahdat."
          tooltipId="tooltip-mieli"
          deltaValue={pickDelta('sanity')}
          showDelta={Boolean(visibleDelta) && pickDelta('sanity') !== 0}
          icon="🧠"
        />
        <ResourceBar
          label="Energia"
          value={resources.energy}
          danger={resources.energy <= 20}
          tooltip="Jaksaminen. Päivän ja yön toiminnot kuluttavat energiaa."
          tooltipId="tooltip-energia"
          deltaValue={pickDelta('energy')}
          showDelta={Boolean(visibleDelta) && pickDelta('energy') !== 0}
          icon="⚡"
        />
        <ResourceBar
          label="Lämpö"
          value={resources.heat}
          danger={resources.heat <= 20}
          tooltip="Keho lämpimänä. Nolla tarkoittaa jäätymistä."
          tooltipId="tooltip-lampo"
          deltaValue={pickDelta('heat')}
          showDelta={Boolean(visibleDelta) && pickDelta('heat') !== 0}
          icon="🔥"
        />
        <ResourceBar
          label="Anomalia"
          value={pickValue('anomaly')}
          tooltip="Lapin anomalian taso. Mitä korkeampi, sitä oudommaksi maailma käy."
          tooltipId="tooltip-anomalia"
          deltaValue={pickDelta('anomaly')}
          showDelta={Boolean(visibleDelta) && pickDelta('anomaly') !== 0}
          icon="✦"
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
