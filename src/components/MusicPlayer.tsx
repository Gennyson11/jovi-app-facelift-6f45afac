import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

const MusicPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

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

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
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

  if (!isVisible) return null;

  return (
    <>
      <audio ref={audioRef} src="/audio/no-role-modelz.mp3" preload="metadata" />
      <div className="fixed bottom-24 right-4 z-50 w-[340px] rounded-2xl bg-[#2a2a2a]/95 backdrop-blur-md shadow-2xl border border-white/10 p-3 select-none">
        <div className="flex items-center gap-3">
          {/* Album Cover */}
          <img
            src="/images/album-cover.jpg"
            alt="Album cover"
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />

          {/* Info + Controls */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">No Role Modelz</p>
            <p className="text-white/50 text-xs truncate">J. Cole</p>

            {/* Progress bar */}
            <div
              className="mt-2 h-1 bg-white/20 rounded-full cursor-pointer group"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-white/70 rounded-full relative transition-all duration-150"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            <div className="flex justify-between mt-1">
              <span className="text-white/40 text-[10px]">{formatTime(currentTime)}</span>
              <span className="text-white/40 text-[10px]">-{formatTime(remaining)}</span>
            </div>
          </div>

          {/* Play button */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-black fill-black" />
            ) : (
              <Play className="w-5 h-5 text-black fill-black ml-0.5" />
            )}
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={() => {
            audioRef.current?.pause();
            setIsPlaying(false);
            setIsVisible(false);
          }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white/20 text-white/60 hover:bg-white/30 text-xs flex items-center justify-center"
        >
          ✕
        </button>
      </div>
    </>
  );
};

export default MusicPlayer;
