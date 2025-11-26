import { Event } from '../types.js';

type Props = {
  event: Event;
  onChoose: (index: number) => void;
};

export const EventView = ({ event, onChoose }: Props) => (
  <div className="panel event">
    <div className="eyebrow">{event.family}</div>
    <h2>{event.title}</h2>
    <p className="muted">{event.description}</p>

    <div className="choices">
      {event.choices.map((choice, idx) => (
        <button key={choice.text} className="choice" onClick={() => onChoose(idx)}>
          <div className="choice-title">{choice.text}</div>
          <div className="choice-effects">
            {Object.entries(choice.effects).map(([resource, delta]) => {
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
      ))}
    </div>
  </div>
);
