type BackgroundVideoProps = {
  anomaly: number;
};

import { assetPath } from '../utils/assetPath.js';

export const BackgroundVideo = ({ anomaly }: BackgroundVideoProps) => {
  const source =
    anomaly > 50
      ? assetPath('assets/videos/Glitchy_Northern_Lights_VHS_Loop.mp4')
      : assetPath('assets/videos/Lapland_Snow_Cinemagraph_VHS.mp4');

  return (
    <div className="background-video" aria-hidden>
      <video
        className="background-video__media"
        src={source}
        autoPlay
        loop
        muted
        playsInline
      />
    </div>
  );
};
