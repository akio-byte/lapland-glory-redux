type BackgroundVideoProps = {
  anomaly: number;
};

export const BackgroundVideo = ({ anomaly }: BackgroundVideoProps) => {
  const source =
    anomaly > 50
      ? '/assets/videos/Glitchy_Northern_Lights_VHS_Loop.mp4'
      : '/assets/videos/Lapland_Snow_Cinemagraph_VHS.mp4';

  return (
    <video
      className="background-video"
      src={source}
      autoPlay
      loop
      muted
      playsInline
      style={{
        position: 'fixed',
        zIndex: -1,
        objectFit: 'cover',
        width: '100vw',
        height: '100vh',
        opacity: 0.6,
        filter: 'contrast(1.1)',
      }}
    />
  );
};
