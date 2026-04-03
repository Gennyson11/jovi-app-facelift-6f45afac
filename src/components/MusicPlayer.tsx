import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react';

const MusicPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);

    audio.volume = 0.5;
    audio.muted = false;
    const tryPlay = audio.play();
    if (tryPlay) {
      tryPlay.then(() => {
        setIsPlaying(true);
        setIsMuted(false);
      }).catch(() => {
        audio.muted = true;
        audio.volume = 0;
        audio.play().then(() => {
          setIsPlaying(true);
          setIsMuted(true);
        }).catch(() => {});
      });
    }

    const unmuteOnClick = () => {
      if (audio.muted && !audio.paused) {
        audio.muted = false;
        audio.volume = 0.5;
        setIsMuted(false);
      }
      document.removeEventListener('click', unmuteOnClick);
    };
    document.addEventListener('click', unmuteOnClick);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
      document.removeEventListener('click', unmuteOnClick);
    };
  }, []);

  const formatTime = (t: number) => {
    if (!isFinite(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const remaining = duration - currentTime;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * duration;
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(pct);
    audio.volume = pct;
    setIsMuted(pct === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <audio ref={audioRef} src="/audio/no-role-modelz.mp3" preload="metadata" />
      <div className="fixed bottom-24 right-4 z-50 w-[340px] rounded-xl card-glass-blue border border-primary/30 p-3 select-none shadow-[0_0_30px_hsl(220_90%_56%/0.2)]">
        {/* Close button */}
        <button
          onClick={() => {
            audioRef.current?.pause();
            setIsPlaying(false);
            setIsVisible(false);
          }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary/30 border border-primary/50 text-primary-foreground hover:bg-primary/50 text-xs flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3" />
        </button>

        <div className="flex items-center gap-3">
          {/* Album Cover */}
          <img
            src="/images/album-cover.jpg"
            alt="Album cover"
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-primary/20 shadow-[0_0_15px_hsl(220_90%_56%/0.15)]"
          />

          {/* Info + Controls */}
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-semibold truncate font-display">No Role Modelz</p>
            <p className="text-muted-foreground text-xs truncate">J. Cole</p>

            {/* Progress bar */}
            <div
              className="mt-2 h-1 bg-secondary rounded-full cursor-pointer group"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-primary rounded-full relative transition-all duration-150 shadow-[0_0_8px_hsl(220_90%_56%/0.5)]"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_6px_hsl(220_90%_56%/0.8)]" />
              </div>
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className="text-muted-foreground text-[10px]">{formatTime(currentTime)}</span>
              <span className="text-muted-foreground text-[10px]">-{formatTime(remaining)}</span>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-1.5 mt-1">
              <button onClick={toggleMute} className="text-muted-foreground hover:text-primary transition-colors">
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
              <div
                className="flex-1 h-1 bg-secondary rounded-full cursor-pointer group"
                onClick={handleVolumeChange}
              >
                <div
                  className="h-full bg-primary/60 rounded-full transition-all duration-150"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Play button */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 hover:scale-105 transition-all shadow-[0_0_20px_hsl(220_90%_56%/0.4)] hover:shadow-[0_0_30px_hsl(220_90%_56%/0.6)]"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
            ) : (
              <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default MusicPlayer;
