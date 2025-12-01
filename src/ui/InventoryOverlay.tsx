import items from '../data/items.json' with { type: 'json' };
import { INVENTORY_CAPACITY } from '../engine/resources.js';
import { Item, Resources } from '../types.js';

const RESOURCE_LABELS: Record<keyof Resources, string> = {
  money: 'Raha',
  sanity: 'Mieli',
  energy: 'Energia',
  heat: 'Lämpö',
  anomaly: 'Anomalia',
};

type InventoryOverlayProps = {
  inventory: string[];
  onUseItem: (itemId: string) => void;
  onClose: () => void;
};

const formatEffects = (item: Item) => {
  const effects = Object.entries(item.onUse?.effects ?? {});
  if (effects.length === 0) return null;

  return (
    <div className="inventory-card-effects">
      {effects.map(([resource, delta]) => {
        const amount = delta ?? 0;
        if (amount === 0) return null;
        return (
          <span key={resource} className="inventory-card-effect">
            {RESOURCE_LABELS[resource as keyof Resources]} {amount > 0 ? '+' : ''}
            {amount}
          </span>
        );
      })}
    </div>
  );
};

const groupInventory = (inventory: string[], lookup: Record<string, Item>) => {
  const grouped: { item: Item; count: number }[] = [];

  for (const entry of inventory) {
    const item = lookup[entry];
    if (!item) continue;

    const existing = grouped.find((row) => row.item.id === entry);
    if (existing) {
      existing.count += 1;
    } else {
      grouped.push({ item, count: 1 });
    }
  }

  return grouped;
};

export const InventoryOverlay = ({ inventory, onUseItem, onClose }: InventoryOverlayProps) => {
  const lookup = (items as Item[]).reduce<Record<string, Item>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  const grouped = groupInventory(inventory, lookup);
  const availableSlots = INVENTORY_CAPACITY - inventory.length;

  return (
    <div className="inventory-overlay" role="dialog" aria-modal="true">
      <div className="panel inventory-panel">
        <div className="inventory-header">
          <div>
            <div className="eyebrow">Varasto</div>
            <div className="muted">
              Esineet mukana · Tilaa {inventory.length}/{INVENTORY_CAPACITY}
              {availableSlots > 0 ? ` (vapaana ${availableSlots})` : ' (täynnä)'}
            </div>
          </div>
          <button className="teletext-close" onClick={onClose} aria-label="Sulje varasto">
            ✕
          </button>
        </div>

        {grouped.length === 0 ? (
          <p className="muted">Reppu on tyhjä. Käy kioskilla täyttämässä se.</p>
        ) : (
          <div className="inventory-cards" role="list">
            {grouped.map(({ item, count }) => (
              <div key={item.id} className="inventory-card" role="listitem">
                <div className="inventory-card-body">
                  <div className="inventory-card-title">
                    <span>{item.name}</span>
                    {count > 1 && <span className="inventory-count">x{count}</span>}
                  </div>
                  <div className="inventory-card-desc">{item.description}</div>
                  {formatEffects(item)}
                </div>
                <div className="inventory-card-actions">
                  <button type="button" className="teletext-button" onClick={() => onUseItem(item.id)}>
                    Käytä
                  </button>
                  <div className="inventory-card-type" aria-label="Esinetyyppi">
                    {item.type === 'tool' ? 'Työkalu' : 'Kulutettava'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
