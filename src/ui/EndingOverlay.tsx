import { Ending } from '../types.js';

type Props = {
  ending: Ending;
  onRestart: () => void;
};

export const EndingOverlay = ({ ending, onRestart }: Props) => (
  <div className="ending-overlay">
    <div className="ending-card">
      <div className="eyebrow">Loppu</div>
      <h2>{ending.title}</h2>
      <p className="muted">{ending.description}</p>
      <button className="primary" onClick={onRestart}>
        Aloita alusta
      </button>
    </div>
  </div>
);
