import { adaptChoiceLabel, decorateEventDescription, maybeDistortText } from '../narrative/narrativeUtils.js';
import { Event, GameState } from '../types.js';

type Props = {
  event: Event;
  state: GameState;
  onChoose: (index: number) => void;
};

export const EventView = ({ event, state, onChoose }: Props) => {
  const { anomaly } = state.resources;
  const title = maybeDistortText(event.title, anomaly);
  const description = maybeDistortText(decorateEventDescription(event.description, state), anomaly);

  return (
    <div className="panel event">
      <div className="eyebrow">{event.family}</div>
      <h2>{title}</h2>
      {/* Invisible progression is applied to descriptions before any anomaly distortion. */}
      <p className="muted">{description}</p>

      <div className="choices">
        {event.choices.map((choice, idx) => {
          const adapted = maybeDistortText(adaptChoiceLabel(choice.text, state), anomaly);
          const effects = Object.entries(choice.effects);

          return (
            <button key={choice.text} className="choice" onClick={() => onChoose(idx)}>
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
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
