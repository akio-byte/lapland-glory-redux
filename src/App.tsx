// Codex recovery pass:
// - Fixed TypeScript/Vite/React wiring
// - Restored CLI + UI entry points
// - Preserved TASO 1–3 visual and narrative layers
import { useEffect, useMemo, useRef, useState } from 'react';
import { EndingOverlay } from './ui/EndingOverlay.js';
import { EventView } from './ui/EventView.js';
import { StatsBar } from './ui/StatsBar.js';
import { SubliminalWhisper } from './ui/SubliminalWhisper.js';
import { TeletextOverlay } from './ui/TeletextOverlay.js';
import { ShopOverlay } from './ui/ShopOverlay.js';
import { useThemeVars } from './ui/useThemeVars.js';
import { useGameLoop } from './engine/useGameLoop.js';
import { DebugPanel } from './ui/DebugPanel.js';
import { BackgroundVideo } from './ui/BackgroundVideo.js';
import { WeatherType, type GameState } from './types.js';
import { useSound } from './hooks/useSound.js';
import { SoundManager } from './engine/sound.js';
import { loadGame, clearSavedGame } from './engine/storage.js';
import { StartScreen } from './ui/StartScreen.js';

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
    continueFromSave,
    startNewGame,
    chooseOption,
    spendEnergy,
    adjustMoney,
    setFlag,
    buyItem,
    useItem,
    debug,
  } = useGameLoop({ autoStart: false });
  const theme = useThemeVars(state);
  const [teletextOpen, setTeletextOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  // Track whether we detected an existing save to gate the main UI behind the start screen.
  const [pendingSavedGame, setPendingSavedGame] = useState<GameState | null>(null);
  const [showStartScreen, setShowStartScreen] = useState(false);
  const [hasCheckedSave, setHasCheckedSave] = useState(false);
  const teletextDisabled = state.resources.energy <= 0;
  const shopDisabled = state.time.phase !== 'DAY';
  const weatherLabel = WEATHER_LABELS[state.time.weather] ?? state.time.weather;
  const weatherIcon = WEATHER_ICONS[state.time.weather];
  const weatherDisplay = weatherIcon ? `${weatherIcon} ${weatherLabel}` : weatherLabel;
  const { play } = useSound(state.flags.sound_muted ?? false);
  const previousPhaseRef = useRef(state.time.phase);

  useEffect(() => {
    // On load, check for a saved game to decide whether to show the start screen.
    const savedState = loadGame();
    if (savedState) {
      setPendingSavedGame(savedState);
      setShowStartScreen(true);
    } else {
      startNewGame();
    }

    setHasCheckedSave(true);
    // We intentionally skip the hook dependencies to keep this boot check one-off.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartNewGame = () => {
    clearSavedGame();
    setPendingSavedGame(null);
    setShowStartScreen(false);
    startNewGame();
  };

  const handleContinueGame = () => {
    if (!pendingSavedGame) return;

    setShowStartScreen(false);
    continueFromSave(pendingSavedGame);
  };

  useEffect(() => {
    const handleFirstClick = () => {
      SoundManager.resumeContext();
      window.removeEventListener('click', handleFirstClick, true);
    };

    window.addEventListener('click', handleFirstClick, true);

    return () => window.removeEventListener('click', handleFirstClick, true);
  }, []);

  useEffect(() => {
    if (shopDisabled && shopOpen) {
      setShopOpen(false);
    }
  }, [shopDisabled, shopOpen]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('button')) {
        play('click');
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [play]);

  useEffect(() => {
    if (previousPhaseRef.current !== state.time.phase) {
      play('wind');
      previousPhaseRef.current = state.time.phase;
    }
  }, [play, state.time.phase]);

  const content = useMemo(() => {
    if (currentEnding) {
      return <EndingOverlay ending={currentEnding} onRestart={startNewGame} />;
    }

    if (currentEvent) {
      return (
        <EventView
          key={currentEvent.id}
          event={currentEvent}
          state={state}
          onChoose={chooseOption}
          onAdjustMoney={adjustMoney}
        />
      );
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

  const handleBuy = (itemId: string) => {
    const success = buyItem(itemId);
    if (success) {
      play('cash');
    }
  };

  if (!hasCheckedSave) {
    return null;
  }

  if (showStartScreen) {
    return (
      <StartScreen
        hasSave={Boolean(pendingSavedGame)}
        onStartNew={handleStartNewGame}
        onContinue={handleContinueGame}
      />
    );
  }

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
      <BackgroundVideo anomaly={state.resources.anomaly} />
      <header className="top-bar">
        <div>
          <div className="eyebrow">Päivä {state.time.day} ({weatherDisplay})</div>
          <div className="phase">{state.time.phase}</div>
        </div>
        <div className="top-bar-actions">
          <div className="action-with-help">
            <button
              className="teletext-toggle"
              onClick={() => setShopOpen(true)}
              disabled={shopDisabled}
              aria-label="Avaa kioski"
              title={shopDisabled ? 'Kioski kiinni' : undefined}
            >
              {shopDisabled ? '🥶 KIOSKI KIINNI' : '🧺 KIOSKI'}
            </button>
            <div className="inline-help">
              <button
                type="button"
                className="tooltip-trigger"
                aria-describedby="tooltip-shop"
                aria-label="Mikä on kioski"
              >
                ?
              </button>
              <span id="tooltip-shop" className="tooltip-bubble" role="tooltip">
                Kioski on kauppa: osta tavaroita rahalla ja täytä reppu.
              </span>
            </div>
          </div>
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
        <button
          className="teletext-toggle"
          onClick={() => setFlag('sound_muted', !state.flags.sound_muted)}
          aria-pressed={state.flags.sound_muted}
        >
          {state.flags.sound_muted ? 'Unmute Audio' : 'Mute Audio'}
        </button>
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
          onBuy={(itemId) => handleBuy(itemId)}
          onClose={() => setShopOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
