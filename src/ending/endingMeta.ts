export type EndingId = 'freeze' | 'bankrupt' | 'breakdown' | 'spring';

export interface EndingMeta {
  id: EndingId;
  title: string;
  description: string;
  visualKey: 'FREEZE' | 'BANKRUPT' | 'BREAKDOWN' | 'SPRING';
}

export const ENDINGS: Record<EndingId, EndingMeta> = {
  freeze: {
    id: 'freeze',
    title: 'Jäätyminen',
    description: 'Lämpö laski nollaan ja kylmä otti vallan. Liike pysähtyy valkoiseen.',
    visualKey: 'FREEZE',
  },
  bankrupt: {
    id: 'bankrupt',
    title: 'Vararikko',
    description: 'Rahasi loppuivat. Valot sammuvat ja ruutu supistuu pisteeseen.',
    visualKey: 'BANKRUPT',
  },
  breakdown: {
    id: 'breakdown',
    title: 'Romahdus',
    description: 'Järki murtuu. Paneelit liukuvat irti ja värit kääntyvät nurin.',
    visualKey: 'BREAKDOWN',
  },
  spring: {
    id: 'spring',
    title: 'Keväänkoitto',
    description: 'Selvisit Lapin talvesta. Ensimmäinen lämmin valo murtaa jään.',
    visualKey: 'SPRING',
  },
};
