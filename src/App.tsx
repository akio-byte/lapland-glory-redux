import { useMemo } from 'react';
import { StatsBar } from './ui/StatsBar.js';
import { EventView } from './ui/EventView.js';
import { EndingOverlay } from './ui/EndingOverlay.js';
import { useGameLoop } from './engine/useGameLoop.js';

const App = () => {
  const { state, currentEvent, currentEnding, lastMessage, startNewGame, chooseOption } = useGameLoop();

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
  }, [chooseOption, currentEnding, currentEvent, startNewGame]);

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <div className="eyebrow">Päivä {state.time.day}</div>
          <div className="phase">{state.time.phase}</div>
        </div>
        <StatsBar resources={state.resources} />
      </header>

      <main className="content">{content}</main>

      <footer className="footer">
        <span className="muted">{lastMessage}</span>
      </footer>
    </div>
  );
};

export default App;
