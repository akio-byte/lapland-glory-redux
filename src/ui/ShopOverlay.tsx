import items from '../data/items.json' with { type: 'json' };
import { INVENTORY_CAPACITY } from '../engine/resources.js';
import { Item } from '../types.js';

type ShopOverlayProps = {
  money: number;
  inventory: string[];
  onBuy: (itemId: string) => void;
  onClose: () => void;
};

const formatPrice = (price: number) => `${price} mk`;

export const ShopOverlay = ({ money, inventory, onBuy, onClose }: ShopOverlayProps) => {
  const isInventoryFull = inventory.length >= INVENTORY_CAPACITY;

  return (
    <div className="shop-overlay" role="dialog" aria-modal="true">
      <div className="panel shop-panel">
        <div className="shop-header">
          <div>
            <div className="eyebrow">Kioski</div>
            <div className="muted">Raha: {formatPrice(money)} · Tilaa repussa {inventory.length}/{INVENTORY_CAPACITY}</div>
          </div>
          <button className="teletext-close" onClick={onClose} aria-label="Sulje kioski">
            ✕
          </button>
        </div>

        <div className="shop-items" role="list">
          {(items as Item[]).map((item) => {
            const affordable = money >= item.price;
            const disabled = !affordable || isInventoryFull;

            return (
              <div key={item.id} className="shop-item" role="listitem">
                <div>
                  <div className="shop-item-name">{item.name}</div>
                  <div className="shop-item-desc">{item.description}</div>
                </div>
                <div className="shop-item-actions">
                  <div className="shop-item-price">{formatPrice(item.price)}</div>
                  <button
                    type="button"
                    className="teletext-button"
                    onClick={() => onBuy(item.id)}
                    disabled={disabled}
                    title={!affordable ? 'Ei varaa' : isInventoryFull ? 'Reppu on täynnä' : undefined}
                  >
                    Osta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
