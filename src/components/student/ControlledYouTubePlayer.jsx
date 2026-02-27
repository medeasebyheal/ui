import { useEffect, useState, useRef } from 'react';
import { Play, Pause, Maximize, Minimize } from 'lucide-react';
import { getYouTubeVideoId } from '../../utils/youtube';

const YT_PLAYING = 1;
const YT_PAUSED = 2;

export default function ControlledYouTubePlayer({ youtubeUrl, videoId: videoIdProp, title, className = '' }) {
  const videoId = videoIdProp || (youtubeUrl ? getYouTubeVideoId(youtubeUrl) : null);
  const [ytApiReady, setYtApiReady] = useState(!!(typeof window !== 'undefined' && window.YT?.Player));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const wrapperRef = useRef(null);
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
        onReady: (e) => {
          e.target.playVideo();
          setIsPlaying(true);
        },
        onStateChange: (e) => {
          const state = e.data;
          if (state === YT_PLAYING) setIsPlaying(true);
          if (state === YT_PAUSED) setIsPlaying(false);
        },
      },
    };
    const player = new window.YT.Player(containerRef.current, opts);
    playerRef.current = player;
    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [ytApiReady, videoId]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const full = !!document.fullscreenElement;
      setIsFullscreen(full);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handlePlayPause = () => {
    const player = playerRef.current;
    if (!player?.getPlayerState) return;
    const state = player.getPlayerState();
    if (state === YT_PLAYING) {
      player.pauseVideo();
      setIsPlaying(false);
    } else {
      player.playVideo();
      setIsPlaying(true);
    }
  };

  const handleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        el.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen not supported', err);
    }
  };

  if (!videoId) return null;

  return (
    <div
      ref={wrapperRef}
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
          onClick={handlePlayPause}
          className="p-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
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
