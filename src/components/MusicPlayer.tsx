import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, X, SkipBack, SkipForward } from 'lucide-react';

interface Track {
  title: string;
  artist: string;
  src: string;
  cover: string;
  startAt?: number;
}

const tracks: Track[] = [
  {
    title: "JoviTools No Topo",
    artist: "JoviTools",
    src: "/audio/jovitools-no-topo.mp3",
    cover: "/images/album-cover.jpg",
  },
];

const MusicPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [volume, setVolume] = useState(0.4);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [hasSetStart, setHasSetStart] = useState(false);

  const currentTrack = tracks[currentTrackIndex];

  const switchTrack = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const wasPlaying = isPlaying;
    audio.pause();
    setCurrentTrackIndex(index);
    setHasSetStart(false);
    setCurrentTime(0);
    setDuration(0);

    // Load new track after state update
    setTimeout(() => {
      const a = audioRef.current;
      if (!a) return;
      a.load();
      a.onloadedmetadata = () => {
        const track = tracks[index];
        if (track.startAt) {
          a.currentTime = track.startAt;
        }
        setDuration(a.duration);
        setHasSetStart(true);
        if (wasPlaying) {
          a.play();
          setIsPlaying(true);
        }
      };
    }, 0);
  }, [isPlaying]);

  const nextTrack = useCallback(() => {
    switchTrack((currentTrackIndex + 1) % tracks.length);
  }, [currentTrackIndex, switchTrack]);

  const prevTrack = useCallback(() => {
    switchTrack((currentTrackIndex - 1 + tracks.length) % tracks.length);
  }, [currentTrackIndex, switchTrack]);

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

  // Set up audio event listeners once
  // Autoplay muted, then unmute on first user interaction
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => {
      setDuration(audio.duration);
      // Start muted to bypass autoplay policy
      audio.volume = 0.4;
      audio.muted = true;
      setIsMuted(true);
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    };
    const onEnded = () => {
      audio.currentTime = 0;
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);

    // Unmute on first user interaction anywhere on the page
    const unmute = () => {
      if (audio.muted) {
        audio.muted = false;
        audio.volume = 0.4;
        setVolume(0.4);
        setIsMuted(false);
      }
      document.removeEventListener('click', unmute);
      document.removeEventListener('touchstart', unmute);
      document.removeEventListener('keydown', unmute);
    };
    document.addEventListener('click', unmute);
    document.addEventListener('touchstart', unmute);
    document.addEventListener('keydown', unmute);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
      document.removeEventListener('click', unmute);
      document.removeEventListener('touchstart', unmute);
      document.removeEventListener('keydown', unmute);
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
      audio.volume = volume || 0.4;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <audio ref={audioRef} src={currentTrack.src} preload="metadata" />
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
            src={currentTrack.cover}
            alt="Album cover"
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-primary/20 shadow-[0_0_15px_hsl(220_90%_56%/0.15)]"
          />

          {/* Info + Controls */}
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-semibold truncate font-display">{currentTrack.title}</p>
            <p className="text-muted-foreground text-xs truncate">{currentTrack.artist}</p>

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

          {/* Playback controls */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              onClick={prevTrack}
              className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <SkipBack className="w-3.5 h-3.5 text-foreground fill-foreground" />
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_20px_hsl(220_90%_56%/0.4)] hover:shadow-[0_0_30px_hsl(220_90%_56%/0.6)]"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
              ) : (
                <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
              )}
            </button>
            <button
              onClick={nextTrack}
              className="w-7 h-7 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5 text-foreground fill-foreground" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MusicPlayer;
