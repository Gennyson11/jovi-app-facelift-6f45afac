import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

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
    const onLoaded = () => {
      setDuration(audio.duration);
      // Autoplay on load
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    };
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

            <div className="flex items-center justify-between mt-1">
              <span className="text-white/40 text-[10px]">{formatTime(currentTime)}</span>
              <span className="text-white/40 text-[10px]">-{formatTime(remaining)}</span>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-1.5 mt-1">
              <button onClick={toggleMute} className="text-white/50 hover:text-white/80 transition-colors">
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
              <div
                className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer group"
                onClick={handleVolumeChange}
              >
                <div
                  className="h-full bg-white/50 rounded-full transition-all duration-150"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>
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
