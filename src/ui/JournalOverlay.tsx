import { LogEntry } from '../types.js';

const formatPhase = (phase: LogEntry['phase']) => (phase === 'DAY' ? 'PÄIVÄ' : phase === 'NIGHT' ? 'YÖ' : phase);

const formatEntryLabel = (entry: LogEntry) => `Päivä ${entry.day} · ${formatPhase(entry.phase)}`;

type JournalOverlayProps = {
  log: LogEntry[];
  onClose: () => void;
};

export const JournalOverlay = ({ log, onClose }: JournalOverlayProps) => {
  const entries = [...log].reverse();

  return (
    <div className="teletext-overlay" role="dialog" aria-modal="true">
      <div className="teletext-panel journal-panel">
        <div className="teletext-header">
          <div className="teletext-title">LOGI · VIIMEISIMMÄT TAPAHTUMAT</div>
          <button className="teletext-close" onClick={onClose} aria-label="Sulje loki">
            ✕
          </button>
        </div>

        <div className="teletext-body journal-body">
          {entries.length === 0 ? (
            <div className="journal-empty">Ei kirjauksia vielä.</div>
          ) : (
            entries.map((entry, idx) => (
              <div key={`${entry.day}-${entry.phase}-${idx}`} className="journal-entry">
                <div className="journal-meta">{formatEntryLabel(entry)}</div>
                <div className="journal-title">{entry.title}</div>
                <div className="journal-outcome">{entry.outcome}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
