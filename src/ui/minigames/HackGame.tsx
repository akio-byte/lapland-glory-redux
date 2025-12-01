import { useMemo, useState } from 'react';
import { Resources } from '../../types.js';

type HackNode = {
  id: string;
  label: string;
  description: string;
};

const HACK_NODES: HackNode[] = [
  {
    id: '201',
    label: 'Teksti-TV:n säe',
    description: 'Vaimea lumisade täyttää ruudun. Ehkä piiloviesti löytyy riviltä 17.',
  },
  {
    id: '310',
    label: 'Puhelinlinjan äänisilta',
    description: 'Kuulet modemien piippauksen. Vanha keskuksenhoitaja naputtaa rytmiä.',
  },
  {
    id: '512',
    label: 'Rovaniemen paikkasivu',
    description: 'Joku on piilottanut salasanan lämpötilakäyrän taakse.',
  },
  {
    id: '640',
    label: 'LapLink-dumppi',
    description: 'Nippu merkkejä, joka näyttää viestintäviraston tunnukselta.',
  },
  {
    id: '777',
    label: 'Salainen tekstikanava',
    description: 'Kaukaa kuuluu humina. Tämä voisi olla järjestelmän ydin.',
  },
];

type HackGameProps = {
  resources: Resources;
  onAdjustMoney: (delta: number, note?: string) => void;
  onAdjustResources: (delta: Partial<Resources>, note?: string) => void;
  onExit: () => void;
};

export const HackGame = ({ resources, onAdjustMoney, onAdjustResources, onExit }: HackGameProps) => {
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [resolved, setResolved] = useState(false);
  const [status, setStatus] = useState('Kytket Teksti-TV:n testikanavaan. Valitse oikea solmu.');

  const targetIndex = useMemo(() => Math.floor(Math.random() * HACK_NODES.length), []);
  const reward = useMemo(() => 16 + Math.floor(Math.random() * 12), []);
  const sanityGain = 3;

  const probeNode = (node: HackNode) => {
    if (resolved || attemptsLeft <= 0) return;

    const success = node.id === HACK_NODES[targetIndex].id;
    if (success) {
      onAdjustMoney(reward);
      onAdjustResources(
        { sanity: sanityGain, anomaly: -1 },
        `Onnistuit murtautumaan solmuun ${node.id}. ${reward} mk kulkee linjan kautta, mieli kirkastuu.`
      );
      setStatus(`Solmu ${node.id} avautuu! Saat ${reward} mk ja rauhoitut hetkeksi.`);
      setResolved(true);
      return;
    }

    const nextAttempts = attemptsLeft - 1;
    setAttemptsLeft(nextAttempts);

    if (nextAttempts <= 0) {
      onAdjustMoney(-6);
      onAdjustResources(
        { sanity: -4, anomaly: 2 },
        'Ylläpito huomaa kaappauksesi. Linja katkeaa, päässä humisee.'
      );
      setStatus('Väärä koodi! Linja menee poikki ja maksullinen häly maksetaan.');
      setResolved(true);
      return;
    }

    setStatus(
      `Solmu ${node.id} on umpikuja. Jäljellä ${nextAttempts} yritystä kikkailla 90-luvun modeemilla.`
    );
  };

  return (
    <div className="hack-game">
      <p className="muted">
        Vuosi on 1995 ja väännät puhelinlinjan kautta Teksti-TV:n piilotettuun solmuun. Energiaa {Math.max(
          0,
          resources.energy
        )}
        % ja käteistä {resources.money} mk.
      </p>

      <div className="choices">
        {HACK_NODES.map((node) => (
          <button
            key={node.id}
            className="choice"
            onClick={() => probeNode(node)}
            disabled={resolved}
          >
            <div className="choice-title">
              {node.id} — {node.label}
            </div>
            <div className="choice-effects">{node.description}</div>
          </button>
        ))}
      </div>

      <div className="hack-status" aria-live="polite">
        {status} Yrityksiä jäljellä: {Math.max(0, attemptsLeft)}.
      </div>

      <div className="slots-actions">
        <button className="choice secondary" onClick={onExit}>
          Katkaise linja
        </button>
      </div>
    </div>
  );
};
