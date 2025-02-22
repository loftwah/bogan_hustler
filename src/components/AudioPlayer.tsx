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

  useEffect(() => {
    audio.src = TRACKS[currentTrackIndex].file;
    audio.loop = true;
    audio.volume = volume;

    const savedPlayingState = localStorage.getItem('boganHustlerAudioPlaying');
    const savedTrackIndex = localStorage.getItem('boganHustlerCurrentTrack');
    const savedVolume = localStorage.getItem('boganHustlerVolume');

    if (savedPlayingState === 'true') {
      playAudio();
    }
    if (savedTrackIndex) {
      setCurrentTrackIndex(Number(savedTrackIndex));
    }
    if (savedVolume) {
      setVolume(Number(savedVolume));
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    audio.src = TRACKS[currentTrackIndex].file;
    if (isPlaying) {
      playAudio();
    }
    localStorage.setItem('boganHustlerCurrentTrack', String(currentTrackIndex));
  }, [currentTrackIndex]);

  useEffect(() => {
    audio.volume = isMuted ? 0 : volume;
    localStorage.setItem('boganHustlerVolume', String(volume));
  }, [volume, isMuted]);

  const playAudio = () => {
    audio.play().catch(err => {
      console.error('Audio playback failed:', err);
      setIsPlaying(false);
    });
    setIsPlaying(true);
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

  return (
    <div className="flex items-center gap-2 bg-surface/50 rounded-lg p-2">
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

      <div className="hidden sm:block flex-1 min-w-0">
        <p className="text-sm truncate">
          {TRACKS[currentTrackIndex].title}
        </p>
      </div>

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
        className="w-20 hidden sm:block"
        aria-label="Volume control"
      />
    </div>
  );
}; 