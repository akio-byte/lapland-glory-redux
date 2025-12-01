export type EndingId =
  | 'freeze'
  | 'bankrupt'
  | 'breakdown'
  | 'spring'
  | 'anomalia'
  | 'bureaucrat'
  | 'trial_victory'
  | 'data_exhausted';

export interface EndingMeta {
  id: EndingId;
  title: string;
  description: string;
  visualKey:
    | 'FREEZE'
    | 'BANKRUPT'
    | 'BREAKDOWN'
    | 'SPRING'
    | 'ANOMALIA'
    | 'BUREAUCRAT';
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
  anomalia: {
    id: 'anomalia',
    title: 'Anomalian herääminen',
    description: 'Kaupunki repeää hiljalleen. Ruutu sulaa, lumessa liikkuu jokin ääniisi vastaava.',
    visualKey: 'ANOMALIA',
  },
  bureaucrat: {
    id: 'bureaucrat',
    title: 'Byrokratian kruunu',
    description: 'Selvisit papereiden läpi ja keräsit kaiken. Kela-ninja katoaa arkistojen halki.',
    visualKey: 'BUREAUCRAT',
  },
  trial_victory: {
    id: 'trial_victory',
    title: 'Koeajo selvitetty',
    description: 'Kolme päivää Lapin anomaliassa ilman romahdusta. Ovi seuraavaan versioon avautuu.',
    visualKey: 'SPRING',
  },
  data_exhausted: {
    id: 'data_exhausted',
    title: 'Hiljaisuus linjoilla',
    description: 'Tapahtumia ei löytynyt tälle vaiheelle. Palaa päävalikkoon ja aloita uusi runi.',
    visualKey: 'BREAKDOWN',
  },
};
