import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause, 
  faForward, 
  faBackward,
  faVolumeUp,
  faVolumeMute
} from '@fortawesome/free-solid-svg-icons';

interface Track {
  title: string;
  file: string;
}

const TRACKS: Track[] = [
  { title: "Bogan Hustler", file: "./themesong.mp3" },
  { title: "Dust of the Damned", file: "./Dust of the Damned.mp3" },
  { title: "Grave of the Outcast", file: "./Grave of the Outcast.mp3" },
  { title: "Hustler's Last Run", file: "./Hustler's Last Run.mp3" },
  { title: "Junkie's Jig", file: "./Junkie's Jig.mp3" },
  { title: "Phantom Love", file: "./Phantom Love.mp3" },
  { title: "Shadows in the Scrub", file: "./Shadows in the Scrub.mp3" },
  { title: "Wraith of the Wastes", file: "./Wraith of the Wastes.mp3" },
];

export const AudioPlayer = () => {
  const [audio] = useState(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const loadAudio = async () => {
      try {
        const baseUrl = window.location.hostname === 'boganhustler.deanlofts.xyz' 
          ? '.'
          : '/bogan_hustler';
        
        audio.src = `${baseUrl}${TRACKS[currentTrackIndex].file.replace('./', '/')}`;
        audio.loop = true;
        audio.volume = volume;
        
        if (isPlaying) {
          await audio.play();
        }
      } catch (err) {
        console.error('Failed to load audio:', err);
        setIsPlaying(false);
      }
    };

    loadAudio();
  }, [currentTrackIndex, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      playAudio();
    }
    localStorage.setItem('boganHustlerCurrentTrack', String(currentTrackIndex));
  }, [currentTrackIndex]);

  useEffect(() => {
    audio.volume = isMuted ? 0 : volume;
    localStorage.setItem('boganHustlerVolume', String(volume));
  }, [volume, isMuted]);

  useEffect(() => {
    const timeUpdateHandler = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', timeUpdateHandler);
    audio.addEventListener('loadedmetadata', timeUpdateHandler);

    return () => {
      audio.removeEventListener('timeupdate', timeUpdateHandler);
      audio.removeEventListener('loadedmetadata', timeUpdateHandler);
    };
  }, [audio]);

  const playAudio = async () => {
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Audio playback failed:', err);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      playAudio();
    }
    localStorage.setItem('boganHustlerAudioPlaying', String(!isPlaying));
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const previousTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 bg-surface/50 rounded-lg p-2">
      <div className="flex items-center gap-1">
        <button
          onClick={previousTrack}
          className="btn btn-ghost btn-sm"
          aria-label="Previous track"
        >
          <FontAwesomeIcon icon={faBackward} />
        </button>

        <button
          onClick={togglePlay}
          className="btn btn-primary btn-sm"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        </button>

        <button
          onClick={nextTrack}
          className="btn btn-ghost btn-sm"
          aria-label="Next track"
        >
          <FontAwesomeIcon icon={faForward} />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">
          {TRACKS[currentTrackIndex].title}
        </p>
        <div className="flex items-center gap-1 text-xs text-text/70">
          <span className="hidden xs:inline">{formatTime(currentTime)}</span>
          <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary"
              style={{ width: `${(currentTime / duration) * 100}%` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={(currentTime / duration) * 100}
            />
          </div>
          <span className="hidden xs:inline">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleMute}
          className="btn btn-ghost btn-sm"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-12 xs:w-20"
          aria-label="Volume control"
        />
      </div>
    </div>
  );
}; 