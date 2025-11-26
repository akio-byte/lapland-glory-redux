import { EndingMeta } from '../ending/endingMeta.js';

type Props = {
  ending: EndingMeta;
  onRestart: () => void;
};

export const EndingOverlay = ({ ending, onRestart }: Props) => (
  <div className="ending-overlay" data-ending={ending.visualKey}>
    <div className="ending-card">
      <div className="eyebrow">Loppu</div>
      <h2>{ending.title}</h2>
      <p className="muted">{ending.description}</p>
      <button className="primary" onClick={onRestart}>
        Aloita alusta
      </button>
    </div>
    {/* Ending visuals are TASO 3 presentation only; state is already final. */}
    <div className="crt-cursor" aria-hidden />
  </div>
);
