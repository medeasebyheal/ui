import { useEffect, useState, useRef } from 'react';
import { Play, Pause, Maximize, Minimize } from 'lucide-react';
import { getYouTubeVideoId } from '../../utils/youtube';

export default function ControlledYouTubePlayer({ youtubeUrl, videoId: videoIdProp, title, className = '' }) {
  const videoId = videoIdProp || (youtubeUrl ? getYouTubeVideoId(youtubeUrl) : null);
  const [ytApiReady, setYtApiReady] = useState(!!(typeof window !== 'undefined' && window.YT?.Player));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.YT?.Player) {
      setYtApiReady(true);
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript?.parentNode?.insertBefore(tag, firstScript);
    window.onYouTubeIframeAPIReady = () => setYtApiReady(true);
    return () => { window.onYouTubeIframeAPIReady = null; };
  }, []);

  useEffect(() => {
    if (!ytApiReady || !videoId || !containerRef.current) return;
    const opts = {
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: (e) => { e.target.playVideo(); },
      },
    };
    playerRef.current = new window.YT.Player(containerRef.current, opts);
    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [ytApiReady, videoId]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handlePlay = () => playerRef.current?.playVideo?.();
  const handlePause = () => playerRef.current?.pauseVideo?.();
  const handleFullscreen = () => {
    const el = containerRef.current?.closest('.aspect-video');
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.();
  };

  if (!videoId) return null;

  return (
    <div
      className={`aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative ${className}`}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full" title={title || 'Video'} />
      <div
        className="absolute inset-0 z-10"
        style={{ pointerEvents: 'auto' }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        aria-hidden
      />
      <div className="absolute left-0 right-0 bottom-0 h-14 z-20 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
        <button
          type="button"
          onClick={handlePlay}
          className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          aria-label="Play"
        >
          <Play className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={handlePause}
          className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          aria-label="Pause"
        >
          <Pause className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={handleFullscreen}
          className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
