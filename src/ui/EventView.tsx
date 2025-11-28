import { useMemo } from 'react';
import { adaptChoiceLabel, decorateEventDescription, maybeDistortText } from '../narrative/narrativeUtils.js';
import { Event, GameState } from '../types.js';
import { SlotsGame } from './minigames/SlotsGame.js';
import { TypewriterText } from './TypewriterText.js';

type Props = {
  event: Event;
  state: GameState;
  onChoose: (index: number) => void;
  onAdjustMoney: (delta: number, note?: string) => void;
};

export const EventView = ({ event, state, onChoose, onAdjustMoney }: Props) => {
  const { anomaly } = state.resources;
  const title = maybeDistortText(event.title, anomaly);
  const description = maybeDistortText(decorateEventDescription(event.description, state), anomaly);
  const slipperyBias = useMemo(() => anomaly / 100 > 0.5 && Math.random() < 0.35, [anomaly]);
  const isSlotsGame = event.minigame === 'slots';

  return (
    <div className="panel event">
      <div className="eyebrow">{event.family}</div>
      <h2>{title}</h2>
      {isSlotsGame ? (
        <SlotsGame
          money={state.resources.money}
          onAdjustMoney={onAdjustMoney}
          onExit={() => onChoose(0)}
        />
      ) : (
        <>
          {/* Energy influences how quickly the description is surfaced to the player. */}
          <p className="muted">
            <TypewriterText text={description} energy={state.resources.energy} />
          </p>

          <div className="choices">
            {event.choices.map((choice, idx) => {
              const adapted = maybeDistortText(adaptChoiceLabel(choice.text, state), anomaly);
              const effects = Object.entries(choice.effects);
              const xpGains = Object.entries(choice.xp ?? {});

              return (
                <button
                  key={choice.text}
                  className={`choice ${slipperyBias ? 'slippery' : ''}`}
                  onClick={() => onChoose(idx)}
                >
                  <div className="choice-title">{adapted}</div>
                  <div className="choice-effects">
                    {effects.map(([resource, delta]) => {
                      const amount = delta ?? 0;
                      return (
                        <span key={resource}>
                          {resource}: {amount > 0 ? '+' : ''}
                          {amount}
                        </span>
                      );
                    })}
                    {xpGains.map(([path, xp]) => {
                      const amount = xp ?? 0;
                      if (amount === 0) return null;
                      const formattedPath = `${path.charAt(0).toUpperCase()}${path.slice(1)}`;
                      return (
                        <span key={`xp-${path}`} className="xp-gain">
                          {formattedPath}: {amount > 0 ? '+' : ''}
                          {amount} XP
                        </span>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
