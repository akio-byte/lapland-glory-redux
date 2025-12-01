import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import items from '../data/items.json' with { type: 'json' };
import { INVENTORY_CAPACITY } from '../engine/resources.js';
import { Item, Phase, ResourceDelta, Resources } from '../types.js';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getDangerLevel = (value: number, warningThreshold = 20) => {
  if (value <= 10) return 'critical' as const;
  if (value <= warningThreshold) return 'warning' as const;
  return undefined;
};

type Props = {
  resources: Resources;
  phase: Phase;
  anomaly: number;
  inventory: string[];
  delta?: ResourceDelta;
  onUseItem: (itemId: string) => void;
};

type DangerLevel = ReturnType<typeof getDangerLevel>;

const ResourceBar = ({
  label,
  value,
  dangerLevel,
  tooltip,
  tooltipId,
  deltaValue = 0,
  showDelta = false,
  deltaFading = false,
  icon,
}: {
  label: string;
  value: number;
  dangerLevel?: DangerLevel;
  tooltip: string;
  tooltipId: string;
  deltaValue?: number;
  showDelta?: boolean;
  deltaFading?: boolean;
  icon: ReactNode;
}) => {
  const changeClass = showDelta ? (deltaValue > 0 ? 'positive' : 'negative') : '';
  const deltaStateClass = showDelta ? `visible ${deltaFading ? 'fade-out' : ''}` : '';
  const dangerClass = dangerLevel ? `danger danger-${dangerLevel}` : '';
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
          {dangerLevel && <span className="danger-pill">⚠</span>}
        </div>
        <div className="resource-value-wrap">
          <span className="resource-value">{Math.round(value)}</span>
          {showDelta && deltaValue !== 0 && (
            <span className={`resource-delta-bubble ${changeClass} ${deltaStateClass}`}>
              {deltaValue > 0 ? '+' : ''}
              {Math.round(deltaValue)}
            </span>
          )}
        </div>
      </div>
      <div className="bar">
        <div className={`bar-fill ${dangerClass}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
};

export const StatsBar = ({ resources, phase, anomaly, inventory, delta, onUseItem }: Props) => {
  const [fakeStat, setFakeStat] = useState<{ field: keyof Resources; value: number } | null>(null);
  const [visibleDelta, setVisibleDelta] = useState<{ value: ResourceDelta | null; fading: boolean }>(
    {
      value: null,
      fading: false,
    }
  );
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
      setVisibleDelta({ value: null, fading: false });
      return undefined;
    }

    const hasChange = Object.values(delta).some((value) => value !== 0);
    if (!hasChange) {
      setVisibleDelta({ value: null, fading: false });
      return undefined;
    }

    setVisibleDelta({ value: delta, fading: false });

    const fadeTimer = setTimeout(
      () => setVisibleDelta((prev) => (prev.value ? { ...prev, fading: true } : prev)),
      1200
    );
    const clearTimer = setTimeout(() => setVisibleDelta({ value: null, fading: false }), 1700);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
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

  const pickDelta = (field: keyof Resources) => visibleDelta.value?.[field] ?? 0;
  const showDeltaFor = (field: keyof Resources) => Boolean(visibleDelta.value) && pickDelta(field) !== 0;

  return (
    <div className="stats-area">
      <div className="stats">
        <ResourceBar
          label="Raha"
          value={pickValue('money')}
          dangerLevel={getDangerLevel(resources.money, 10)}
          tooltip="Raha kertoo, selviätkö vuokrasta ja arjen menoista."
          tooltipId="tooltip-raha"
          deltaValue={pickDelta('money')}
          showDelta={showDeltaFor('money')}
          deltaFading={visibleDelta.fading}
          icon="💶"
        />
        <ResourceBar
          label="Mieli"
          value={pickValue('sanity')}
          dangerLevel={getDangerLevel(resources.sanity)}
          tooltip="Mielenrauha. Jos se putoaa nollaan, romahdat."
          tooltipId="tooltip-mieli"
          deltaValue={pickDelta('sanity')}
          showDelta={showDeltaFor('sanity')}
          deltaFading={visibleDelta.fading}
          icon="🧠"
        />
        <ResourceBar
          label="Energia"
          value={resources.energy}
          dangerLevel={getDangerLevel(resources.energy)}
          tooltip="Jaksaminen. Päivän ja yön toiminnot kuluttavat energiaa."
          tooltipId="tooltip-energia"
          deltaValue={pickDelta('energy')}
          showDelta={showDeltaFor('energy')}
          deltaFading={visibleDelta.fading}
          icon="⚡"
        />
        <ResourceBar
          label="Lämpö"
          value={resources.heat}
          dangerLevel={getDangerLevel(resources.heat)}
          tooltip="Keho lämpimänä. Nolla tarkoittaa jäätymistä."
          tooltipId="tooltip-lampo"
          deltaValue={pickDelta('heat')}
          showDelta={showDeltaFor('heat')}
          deltaFading={visibleDelta.fading}
          icon="🔥"
        />
        <ResourceBar
          label="Anomalia"
          value={pickValue('anomaly')}
          tooltip="Lapin anomalian taso. Mitä korkeampi, sitä oudommaksi maailma käy."
          tooltipId="tooltip-anomalia"
          deltaValue={pickDelta('anomaly')}
          showDelta={showDeltaFor('anomaly')}
          deltaFading={visibleDelta.fading}
          icon="✦"
        />
      </div>

      <div className="stats-legend" aria-label="Selite muutoksille ja vaaralle">
        <div className="legend-item">
          <span className="legend-swatch positive" aria-hidden>
            +
          </span>
          <span>vihreä = nousu</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch negative" aria-hidden>
            -
          </span>
          <span>punainen = lasku</span>
        </div>
        <div className="legend-item">
          <span className="legend-swatch danger" aria-hidden>
            ⚠
          </span>
          <span>⚠ näkyy, kun mieli/lämpö/energia uhkaavat loppua</span>
        </div>
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
