// StartScreen gates the UI before the main game mounts.
// Use it at the top level (e.g. in App) when you want players to pick between
// continuing an existing save or launching a fresh run. Provide `onStartNew`
// and `onContinue` callbacks; the component handles disabling the continue
// button when no save is available.
import type { FC } from 'react';
import type { Difficulty } from '../types.js';

type StartScreenProps = {
  hasSave: boolean;
  difficulty: Difficulty;
  onDifficultyChange: (value: Difficulty) => void;
  onStartNew: () => void;
  onContinue: () => void;
};

export const StartScreen: FC<StartScreenProps> = ({
  hasSave,
  difficulty,
  onDifficultyChange,
  onStartNew,
  onContinue,
}) => (
  <div className="app-shell start-screen">
    <div className="panel">
      <h1>Lapland Glory 1995 – Redux</h1>
      <p className="muted">"Selviydy kaamoksesta, kuuntele lumen kuisketta ja löydä tiesi kotiin."</p>

      <fieldset className="start-screen-difficulty">
        <legend>Vaikeustaso</legend>
        {(
          [
            { label: 'Helppo', value: 'EASY' },
            { label: 'Normaali', value: 'NORMAL' },
            { label: 'Haastava', value: 'HARD' },
          ] as const
        ).map(({ label, value }) => (
          <label key={value}>
            <input
              type="radio"
              name="difficulty"
              value={value}
              checked={difficulty === value}
              onChange={() => onDifficultyChange(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="start-screen-actions">
        <button className="teletext-toggle" onClick={onStartNew}>
          Aloita uusi peli
        </button>
        <button className="teletext-toggle" onClick={onContinue} disabled={!hasSave}>
          Jatka
        </button>
      </div>

      {!hasSave && <p className="muted">Tallennusta ei löytynyt.</p>}
    </div>
  </div>
);
