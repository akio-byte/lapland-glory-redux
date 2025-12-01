import { FormEvent, useMemo, useState } from 'react';
import { BASE_HEAT_LOSS } from '../engine/tick.js';
import { ANOMALIA_THRESHOLD } from '../engine/checkEnding.js';
import { CompletedTask, Phase, Task } from '../types.js';

type TeletextOverlayProps = {
  day: number;
  phase: Phase;
  anomaly: number;
  energy: number;
  tasks: Task[];
  completedTasks: CompletedTask[];
  onClose: () => void;
  onNavigateCost: (note?: string, exhaustedNote?: string) => boolean;
  onSetFlag: (key: string, value: boolean) => void;
};

const START_DATE = new Date('1995-11-26T00:00:00Z');
const AVAILABLE_PAGES = [100, 202, 333] as const;
const ANOMALY_PAGE = 899;

const formatDateForPage = (day: number) => {
  const date = new Date(START_DATE);
  date.setUTCDate(START_DATE.getUTCDate() + (day - 1));
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const yy = String(date.getUTCFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
};

const predictTemperature = (phase: Phase) => {
  const baseLoss = phase === 'NIGHT' ? BASE_HEAT_LOSS * 2 : BASE_HEAT_LOSS;
  const predicted = Math.round(baseLoss * 15); // Amplify abstract loss into a Celsius-like forecast.

  if (predicted <= -30) return `PAKKASET KIRISTYVÄT ${predicted}C`;
  if (predicted <= -20) return `VIIMA PUREE ${predicted}C`;
  if (predicted <= -10) return `SUMU NIELAISEE ${predicted}C`;
  return `LEUTOA HÄMYÄ ${predicted}C`;
};

const TeletextPageContent = ({
  page,
  anomaly,
  phase,
  tasks,
  completedTasks,
}: {
  page: number;
  anomaly: number;
  phase: Phase;
  tasks: Task[];
  completedTasks: CompletedTask[];
}) => {
  if (page === 202) {
    return (
      <div className="teletext-body">
        <div className="teletext-line">YLE SÄÄ 202</div>
        <div className="teletext-line highlight">{predictTemperature(phase)}</div>
        <div className="teletext-line">PERUSLÄMPÖ TULEVALLE VUOROLLE.</div>
      </div>
    );
  }

  if (page === 333) {
    const hasTasks = tasks.length > 0;
    const hasCompleted = completedTasks.length > 0;

    return (
      <div className="teletext-body">
        <div className="teletext-line">MTV3 TYÖT 333</div>
        <div className="teletext-line highlight">TEHTÄVÄT</div>
        {hasTasks ? (
          tasks
            .filter(Boolean)
            .map((task, index) => (
              <div key={task.id ?? `task-${index}`} className="teletext-line">
                • {task.description ?? 'Tuntematon tehtävä'}
              </div>
            ))
        ) : (
          <div className="teletext-line">Ei aktiivisia tehtäviä.</div>
        )}
        <div className="teletext-line highlight">VALMISTUNUT</div>
        {hasCompleted ? (
          completedTasks.slice(-3).map((task, index) => (
            <div key={task.id ?? `completed-${index}`} className="teletext-line">
              ✓ {task.description ?? 'Tehtävä'} (Päivä {task.completedOnDay ?? '?'})
            </div>
          ))
        ) : (
          <div className="teletext-line">Odottaa ensimmäistä suoritusta.</div>
        )}
      </div>
    );
  }

  if (page === ANOMALY_PAGE) {
    if (anomaly <= 50) {
      return (
        <div className="teletext-body">
          <div className="teletext-line">P{ANOMALY_PAGE} ANOMALIA</div>
          <div className="teletext-line highlight">----</div>
          <div className="teletext-line">SIGNaALI PUUTTUU.</div>
          <div className="teletext-line">Huhu anomalian heräämisestä pysyy toistaiseksi hiljaa.</div>
        </div>
      );
    }

    return (
      <div className="teletext-body glitch">
        <div className="teletext-line">P{ANOMALY_PAGE} ANOMALIA</div>
        <div className="teletext-line highlight">SILMÄT RUUDUN TAKANA.</div>
        <div className="teletext-line">LUMI HUUTAA NIMESI.</div>
        <div className="teletext-line">ANOMALIAN HERÄÄMINEN ON JO ALKANUT.</div>
      </div>
    );
  }

  // Default index
  return (
      <div className="teletext-body">
        <div className="teletext-line">P100 ALKU</div>
        <div className="teletext-line highlight">[100] ALKU</div>
        <div className="teletext-line">[202] SÄÄ</div>
        <div className="teletext-line">[333] TYÖT &amp; TEHTÄVÄT</div>
        <div className="teletext-line">[899] ANOMALIA (HERÄÄMINEN?)</div>
      </div>
  );
};

export const TeletextOverlay = ({
  day,
  phase,
  anomaly,
  energy,
  tasks,
  completedTasks,
  onClose,
  onNavigateCost,
  onSetFlag,
}: TeletextOverlayProps) => {
  const [page, setPage] = useState<number>(100);
  const [pageInput, setPageInput] = useState<string>('100');
  const [status, setStatus] = useState<string>('Energia -1 per sivu');

  const dateString = useMemo(() => formatDateForPage(day), [day]);
  const header = useMemo(() => `P${page} 100 ALKU ${dateString}`, [dateString, page]);

  const goToPage = (target: number) => {
    if (target === page) return;

    const exhaustedNote = 'Liian väsynyt selaamaan Teksti-TV:tä.';
    if (!onNavigateCost('Teksti-TV sivu vaihtuu.', exhaustedNote)) {
      setStatus('ENERGIA LOPPUI');
      return;
    }

    setPage(target);
    setPageInput(String(target));
    setStatus(`SIVU ${target} (-1 energia)`);

    if (target === 202) {
      onSetFlag('forecast_read', true);
    } else if (target === 333) {
      onSetFlag('job_market_checked', true);
      onSetFlag('paperwar_rumor', true);
    } else if (target === ANOMALY_PAGE && anomaly >= ANOMALIA_THRESHOLD - 5) {
      onSetFlag('anomaly_awakening', true);
    }
  };

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    const target = parseInt(pageInput, 10);
    if (Number.isNaN(target)) return;

    const knownPages = [...AVAILABLE_PAGES, ANOMALY_PAGE];
    if (!knownPages.includes(target)) {
      setStatus('SIVUA EI LÖYDY');
      return;
    }

    goToPage(target);
  };

  return (
    <div className="teletext-overlay" role="dialog" aria-modal="true">
      <div className="teletext-panel">
        <div className="teletext-header">
          <div className="teletext-title">{header}</div>
          <button className="teletext-close" onClick={onClose} aria-label="Sulje Teksti-TV">
            ✕
          </button>
        </div>

        <div className="teletext-energy-hint">
          📺 Teksti-TV kuluttaa 1 energiaa per sivu. Energia: {Math.max(0, energy)}
        </div>

        <TeletextPageContent
          page={page}
          anomaly={anomaly}
          phase={phase}
          tasks={tasks}
          completedTasks={completedTasks}
        />

        <form className="teletext-nav" onSubmit={handleSubmit}>
          <label className="teletext-line" htmlFor="teletext-page-input">
            Kirjoita sivu:
          </label>
          <div className="teletext-nav-row">
            <input
              id="teletext-page-input"
              className="teletext-input"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              aria-label="Teksti-TV sivunumero"
            />
            <button type="submit" className="teletext-button" disabled={energy <= 0}>
              Hae
            </button>
            <button type="button" className="teletext-button" onClick={() => goToPage(100)}>
              [100]
            </button>
            <button type="button" className="teletext-button" onClick={() => goToPage(202)}>
              [202]
            </button>
            <button type="button" className="teletext-button" onClick={() => goToPage(333)}>
              [333]
            </button>
            <button type="button" className="teletext-button" onClick={() => goToPage(899)}>
              [899]
            </button>
          </div>
          <div className="teletext-status">{status}</div>
        </form>
      </div>
    </div>
  );
};
