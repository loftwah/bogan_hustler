import { useState, useEffect, useRef } from 'react';
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
  { title: "Hustler's Last Run", file: "./Hustlers Last Run.mp3" },
  { title: "Junkie's Jig", file: "./Junkies Jig.mp3" },
  { title: "Phantom Love", file: "./Phantom Love.mp3" },
  { title: "Shadows in the Scrub", file: "./Shadows in the Scrub.mp3" },
  { title: "Wraith of the Wastes", file: "./Wraith of the Wastes.mp3" },
];

export const AudioPlayer = () => {
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    console.log('Current environment:', {
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      href: window.location.href
    });
    console.log('Available tracks:', TRACKS);
  }, []);

  useEffect(() => {
    const loadAudio = async () => {
      try {
        let basePath = '';
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          basePath = '/';
        } else if (window.location.hostname === 'loftwah.github.io') {
          basePath = '/bogan_hustler/';
        } else {
          basePath = './';
        }

        const trackPath = TRACKS[currentTrackIndex].file.replace('./', '');
        audioRef.current.src = `${basePath}${trackPath}`;
        
        console.log('Loading audio from:', audioRef.current.src);
        
        audioRef.current.loop = true;
        audioRef.current.volume = volume;
        
        if (isPlaying) {
          await audioRef.current.play();
        }
      } catch (err) {
        console.error('Failed to load audio:', err, {
          hostname: window.location.hostname,
          audioSrc: audioRef.current.src,
          trackIndex: currentTrackIndex
        });
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
    audioRef.current.volume = isMuted ? 0 : volume;
    localStorage.setItem('boganHustlerVolume', String(volume));
  }, [volume, isMuted]);

  useEffect(() => {
    const timeUpdateHandler = () => {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    };

    audioRef.current.addEventListener('timeupdate', timeUpdateHandler);
    audioRef.current.addEventListener('loadedmetadata', timeUpdateHandler);

    return () => {
      audioRef.current.removeEventListener('timeupdate', timeUpdateHandler);
      audioRef.current.removeEventListener('loadedmetadata', timeUpdateHandler);
    };
  }, []);

  const playAudio = async () => {
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Audio playback failed:', err);
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
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
    <div className="flex flex-col gap-2 bg-surface/50 rounded-lg p-2 text-sm w-full xs:w-auto">
      <p className="text-xs text-center truncate px-1">
        {TRACKS[currentTrackIndex].title}
      </p>

      <div className="flex items-center justify-center xs:justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={previousTrack}
            className="btn btn-ghost btn-xs"
            aria-label="Previous track"
          >
            <FontAwesomeIcon icon={faBackward} />
          </button>

          <button
            onClick={togglePlay}
            className="btn btn-primary btn-xs"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
          </button>

          <button
            onClick={nextTrack}
            className="btn btn-ghost btn-xs"
            aria-label="Next track"
          >
            <FontAwesomeIcon icon={faForward} />
          </button>
        </div>

        <div className="flex-1 min-w-0 mx-2">
          <div className="flex items-center gap-1 text-xs text-text/70">
            <span className="w-8 text-right text-[10px]">{formatTime(currentTime)}</span>
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
            <span className="w-8 text-left text-[10px]">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            className="btn btn-ghost btn-xs"
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
            className="w-12 sm:w-16 hidden xs:block"
            aria-label="Volume control"
          />
        </div>
      </div>
    </div>
  );
}; 