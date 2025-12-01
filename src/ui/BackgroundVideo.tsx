type BackgroundVideoProps = {
  anomaly: number;
};

export const BackgroundVideo = ({ anomaly }: BackgroundVideoProps) => {
  const source =
    anomaly > 50
      ? '/assets/videos/Glitchy_Northern_Lights_VHS_Loop.mp4'
      : '/assets/videos/Lapland_Snow_Cinemagraph_VHS.mp4';

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
