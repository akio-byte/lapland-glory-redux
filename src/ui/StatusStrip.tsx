import { Phase } from '../types.js';

type StatusStripProps = {
  day: number;
  phase: Phase;
  message: string;
  onDismissTask?: () => void;
};

export const StatusStrip = ({ day, phase, message, onDismissTask }: StatusStripProps) => (
  <div className="status-strip" role="status" aria-live="polite">
    <div className="status-strip__meta">🗓 Päivä {day} • {phase}</div>
    <div className="status-strip__message">{message}</div>
    {onDismissTask && (
      <button type="button" className="status-strip__action" onClick={onDismissTask}>
        OK
      </button>
    )}
  </div>
);
