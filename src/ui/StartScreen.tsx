// StartScreen gates the UI before the main game mounts.
// Use it at the top level (e.g. in App) when you want players to pick between
// continuing an existing save or launching a fresh run. Provide `onStartNew`
// and `onContinue` callbacks; the component handles disabling the continue
// button when no save is available.
import type { FC } from 'react';

type StartScreenProps = {
  hasSave: boolean;
  onStartNew: () => void;
  onContinue: () => void;
};

export const StartScreen: FC<StartScreenProps> = ({ hasSave, onStartNew, onContinue }) => (
  <div className="app-shell start-screen">
    <div className="panel">
      <h1>Lapland Glory 1995 – Redux</h1>
      <p className="muted">"Selviydy kaamoksesta, kuuntele lumen kuisketta ja löydä tiesi kotiin."</p>

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
