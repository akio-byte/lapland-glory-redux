import { useMemo } from 'react';
import { EndingOverlay } from './ui/EndingOverlay.js';
import { EventView } from './ui/EventView.js';
import { StatsBar } from './ui/StatsBar.js';
import { SubliminalWhisper } from './ui/SubliminalWhisper.js';
import { useThemeVars } from './ui/useThemeVars.js';
import { useGameLoop } from './engine/useGameLoop.js';

const App = () => {
  const { state, currentEvent, currentEnding, lastMessage, startNewGame, chooseOption } = useGameLoop();
  const theme = useThemeVars(state);

  const content = useMemo(() => {
    if (currentEnding) {
      return <EndingOverlay ending={currentEnding} onRestart={startNewGame} />;
    }

    if (currentEvent) {
      return <EventView event={currentEvent} state={state} onChoose={chooseOption} />;
    }

    return (
      <div className="panel">
        <p className="muted">Ei tapahtumia tässä vaiheessa. Odota seuraavaa hetkeä.</p>
      </div>
    );
  }, [chooseOption, currentEnding, currentEvent, startNewGame, state]);

  return (
    <div
      className="app-shell"
      data-phase={theme.phase}
      style={{
        '--entropy': theme.entropy,
        '--fatigue': theme.fatigue,
        '--frost': theme.frost,
        '--shiver': theme.shiver,
        '--anomaly': theme.anomalyLevel,
      }}
    >
      <header className="top-bar">
        <div>
          <div className="eyebrow">Päivä {state.time.day}</div>
          <div className="phase">{state.time.phase}</div>
        </div>
        <StatsBar resources={state.resources} phase={state.time.phase} anomaly={state.resources.anomaly} />
      </header>

      <main className="content">{content}</main>

      <footer className="footer">
        <span className="muted">{lastMessage}</span>
      </footer>

      <SubliminalWhisper anomaly={state.resources.anomaly} phase={state.time.phase} />
    </div>
  );
};

export default App;
