import { EndingMeta } from '../ending/endingMeta.js';
import { clearSavedGame } from '../engine/storage.js';

type Props = {
  ending: EndingMeta;
  onRestart: () => void;
  onReturnToMenu?: () => void;
};

export const EndingOverlay = ({ ending, onRestart, onReturnToMenu }: Props) => {
  const handleRestart = () => {
    clearSavedGame();
    onRestart();
  };

  return (
    <div className="ending-overlay" data-ending={ending.visualKey}>
      <div className="ending-card">
        <div className="eyebrow">Loppu</div>
        <h2>{ending.title}</h2>
        <p className="muted">{ending.description}</p>
        <div className="ending-actions">
          {onReturnToMenu && (
            <button className="secondary" onClick={onReturnToMenu}>
              Palaa päävalikkoon
            </button>
          )}
          <button className="primary" onClick={handleRestart}>
            Aloita uusi runi
          </button>
        </div>
      </div>
      {/* Ending visuals are TASO 3 presentation only; state is already final. */}
      <div className="crt-cursor" aria-hidden />
    </div>
  );
};
