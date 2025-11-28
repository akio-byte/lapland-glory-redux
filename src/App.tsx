// Codex recovery pass:
// - Fixed TypeScript/Vite/React wiring
// - Restored CLI + UI entry points
// - Preserved TASO 1–3 visual and narrative layers
import { useEffect, useMemo, useState } from 'react';
import { EndingOverlay } from './ui/EndingOverlay.js';
import { EventView } from './ui/EventView.js';
import { StatsBar } from './ui/StatsBar.js';
import { SubliminalWhisper } from './ui/SubliminalWhisper.js';
import { TeletextOverlay } from './ui/TeletextOverlay.js';
import { ShopOverlay } from './ui/ShopOverlay.js';
import { useThemeVars } from './ui/useThemeVars.js';
import { useGameLoop } from './engine/useGameLoop.js';
import { DebugPanel } from './ui/DebugPanel.js';
import { WeatherType } from './types.js';

const WEATHER_LABELS: Record<WeatherType, string> = {
  CLEAR: 'Kirkas',
  SNOWSTORM: 'Lumimyrsky',
  FOG: 'Sumu',
  MILD: 'Leuto',
};
const WEATHER_ICONS: Partial<Record<WeatherType, string>> = {
  CLEAR: '☀️',
  SNOWSTORM: '🌨️',
  FOG: '🌫️',
  MILD: '🌤️',
};

const App = () => {
  const {
    state,
    currentEvent,
    currentEnding,
    lastMessage,
    startNewGame,
    chooseOption,
    spendEnergy,
    setFlag,
    buyItem,
    useItem,
    debug,
  } = useGameLoop();
  const theme = useThemeVars(state);
  const [teletextOpen, setTeletextOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const teletextDisabled = state.resources.energy <= 0;
  const shopDisabled = state.time.phase !== 'DAY';
  const weatherLabel = WEATHER_LABELS[state.time.weather] ?? state.time.weather;
  const weatherIcon = WEATHER_ICONS[state.time.weather];
  const weatherDisplay = weatherIcon ? `${weatherIcon} ${weatherLabel}` : weatherLabel;

  useEffect(() => {
    if (shopDisabled && shopOpen) {
      setShopOpen(false);
    }
  }, [shopDisabled, shopOpen]);

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

  const openTeletext = () => {
    if (teletextOpen) return;

    const opened = spendEnergy(
      1,
      'Teksti-TV kahisee auki.',
      'Liian väsynyt Teksti-TV:n pariin.'
    );

    if (opened) setTeletextOpen(true);
  };

  const navigateTeletext = (note?: string, exhaustedNote?: string) =>
    spendEnergy(1, note, exhaustedNote ?? 'Liian väsynyt selaamaan Teksti-TV:tä.');

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
          <div className="eyebrow">Päivä {state.time.day} ({weatherDisplay})</div>
          <div className="phase">{state.time.phase}</div>
        </div>
        <div className="top-bar-actions">
          <button
            className="teletext-toggle"
            onClick={() => setShopOpen(true)}
            disabled={shopDisabled}
            aria-label="Avaa kioski"
            title={shopDisabled ? 'Kioski kiinni' : undefined}
          >
            {shopDisabled ? '🥶 KIOSKI KIINNI' : '🧺 KIOSKI'}
          </button>
          <button
            className="teletext-toggle"
            onClick={openTeletext}
            disabled={teletextDisabled}
            aria-label="Avaa Teksti-TV"
            title={teletextDisabled ? 'Liian väsynyt' : undefined}
          >
            {teletextDisabled ? '📺 TEKSTI-TV (Liian väsynyt)' : '📺 TEKSTI-TV'}
          </button>
        </div>
        <StatsBar
          resources={state.resources}
          phase={state.time.phase}
          anomaly={state.resources.anomaly}
          inventory={state.inventory}
          onUseItem={useItem}
        />
      </header>

      <main className="content">{content}</main>

      <footer className="footer">
        <span className="muted">{lastMessage}</span>
      </footer>

      <SubliminalWhisper anomaly={state.resources.anomaly} phase={state.time.phase} />
      <DebugPanel state={state} actions={debug} />
      {teletextOpen && (
        <TeletextOverlay
          day={state.time.day}
          phase={state.time.phase}
          anomaly={state.resources.anomaly}
          energy={state.resources.energy}
          onClose={() => setTeletextOpen(false)}
          onNavigateCost={navigateTeletext}
          onSetFlag={setFlag}
        />
      )}
      {shopOpen && (
        <ShopOverlay
          money={state.resources.money}
          inventory={state.inventory}
          onBuy={(itemId) => buyItem(itemId)}
          onClose={() => setShopOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
