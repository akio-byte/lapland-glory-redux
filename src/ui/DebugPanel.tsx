import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { GameState } from '../types.js';

export type DebugActions = {
  addMoney: () => void;
  restoreSanity: () => void;
  triggerFreeze: () => void;
  skipDay: () => void;
};

type DebugPanelProps = {
  state: GameState;
  actions: DebugActions;
};

export const DebugPanel = ({ state, actions }: DebugPanelProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'd') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const rows = useMemo(
    () => [
      { label: 'Money', value: state.resources.money },
      { label: 'Sanity', value: state.resources.sanity },
      { label: 'Energy', value: state.resources.energy },
      { label: 'Heat', value: state.resources.heat },
      { label: 'Anomaly', value: state.resources.anomaly },
    ],
    [state.resources.anomaly, state.resources.energy, state.resources.heat, state.resources.money, state.resources.sanity]
  );

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: '1rem',
        bottom: '1rem',
        zIndex: 2000,
        background: 'rgba(12, 12, 12, 0.9)',
        border: '1px solid #444',
        borderRadius: '6px',
        padding: '12px',
        color: '#e6e6e6',
        width: '260px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '12px', opacity: 0.75 }}>Debug</div>
          <div style={{ fontWeight: 700 }}>Day {state.time.day}</div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            border: '1px solid #555',
            background: '#222',
            color: '#e6e6e6',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px', marginBottom: '10px' }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.8 }}>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
        <div style={{ gridColumn: '1 / span 2', opacity: 0.75, fontSize: '12px' }}>Phase: {state.time.phase}</div>
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        <button type="button" onClick={actions.addMoney} style={buttonStyle}>
          Add Money +50
        </button>
        <button type="button" onClick={actions.restoreSanity} style={buttonStyle}>
          Restore Sanity
        </button>
        <button type="button" onClick={actions.triggerFreeze} style={buttonStyle}>
          Trigger Game Over (Freeze)
        </button>
        <button type="button" onClick={actions.skipDay} style={buttonStyle}>
          Skip Day
        </button>
      </div>
    </div>
  );
};

const buttonStyle: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '4px',
  border: '1px solid #555',
  background: '#1d1d1d',
  color: '#f1f1f1',
  cursor: 'pointer',
  textAlign: 'left',
};
