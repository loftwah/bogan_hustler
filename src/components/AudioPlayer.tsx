import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause, 
  faForward, 
  faBackward,
  faVolumeUp,
  faVolumeMute,
  faShuffle,
  faRepeat
} from '@fortawesome/free-solid-svg-icons';

interface Track {
  title: string;
  file: string;
}

const TRACKS: Track[] = [
  { title: "Bogan Hustler", file: "./themesong.mp3" },
  { title: "Shadows in the Scrub", file: "./Shadows in the Scrub.mp3" },
  { title: "Hustler's Last Run", file: "./Hustlers Last Run.mp3" },
  { title: "Junkie's Jig", file: "./Junkies Jig.mp3" },
  { title: "Phantom Love", file: "./Phantom Love.mp3" },
  { title: "Dust of the Damned", file: "./Dust of the Damned.mp3" },
  { title: "Grave of the Outcast", file: "./Grave of the Outcast.mp3" },
  { title: "Wraith of the Wastes", file: "./Wraith of the Wastes.mp3" },
];

export const AudioPlayer = () => {
  const audioRef = useRef(new Audio());
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackMode, setPlaybackMode] = useState<'normal' | 'shuffle' | 'repeat'>('normal');

  // Load saved state from localStorage on component mount
  useEffect(() => {
    // Load saved track index
    const savedTrackIndex = localStorage.getItem('boganHustlerCurrentTrack');
    if (savedTrackIndex) {
      setCurrentTrackIndex(parseInt(savedTrackIndex, 10));
    }

    // Load saved volume
    const savedVolume = localStorage.getItem('boganHustlerVolume');
    if (savedVolume) {
      setVolume(parseFloat(savedVolume));
    }

    // Load saved playback mode
    const savedPlaybackMode = localStorage.getItem('boganHustlerPlaybackMode');
    if (savedPlaybackMode && ['normal', 'shuffle', 'repeat'].includes(savedPlaybackMode)) {
      setPlaybackMode(savedPlaybackMode as 'normal' | 'shuffle' | 'repeat');
    }

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
        
        // Set loop property based on repeat mode
        audioRef.current.loop = playbackMode === 'repeat';
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
  }, [currentTrackIndex, isPlaying, playbackMode, volume]);

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

  // Save playback mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('boganHustlerPlaybackMode', playbackMode);
    // Update loop property when playback mode changes
    audioRef.current.loop = playbackMode === 'repeat';
  }, [playbackMode]);

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

  useEffect(() => {
    const handleTrackEnd = () => {
      // For repeat mode, we rely on the audio element's loop property
      // which is set in the loadAudio function
      if (playbackMode === 'repeat') {
        return;
      }
      
      if (playbackMode === 'shuffle') {
        let nextIndex;
        if (TRACKS.length > 1) {
          do {
            nextIndex = Math.floor(Math.random() * TRACKS.length);
          } while (nextIndex === currentTrackIndex);
        } else {
          nextIndex = 0;
        }
        
        setCurrentTrackIndex(nextIndex);
      } else {
        // Normal mode - play next track in sequence
        setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
      }
    };

    audioRef.current.addEventListener('ended', handleTrackEnd);
    
    return () => {
      audioRef.current.removeEventListener('ended', handleTrackEnd);
    };
  }, [currentTrackIndex, playbackMode]);

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
    if (playbackMode === 'shuffle') {
      // Get random track that's not the current one
      let nextIndex;
      if (TRACKS.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * TRACKS.length);
        } while (nextIndex === currentTrackIndex);
      } else {
        nextIndex = 0;
      }
      setCurrentTrackIndex(nextIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    }
  };

  const previousTrack = () => {
    if (playbackMode === 'shuffle') {
      // Get random track that's not the current one
      let prevIndex;
      if (TRACKS.length > 1) {
        do {
          prevIndex = Math.floor(Math.random() * TRACKS.length);
        } while (prevIndex === currentTrackIndex);
      } else {
        prevIndex = 0;
      }
      setCurrentTrackIndex(prevIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleShuffle = () => {
    const newMode = playbackMode === 'shuffle' ? 'normal' : 'shuffle';
    setPlaybackMode(newMode);
  };

  const toggleRepeat = () => {
    const newMode = playbackMode === 'repeat' ? 'normal' : 'repeat';
    setPlaybackMode(newMode);
  };

  const formatTime = (time: number) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle seeking when clicking on the progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    
    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    
    if (!isNaN(duration) && isFinite(duration) && duration > 0) {
      const newTime = clickPosition * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  return (
    <div className="flex flex-col gap-2 bg-surface/50 rounded-lg p-2 text-sm w-full xs:w-auto">
      <p className="text-xs text-center truncate px-1">
        {TRACKS[currentTrackIndex].title}
      </p>

      <div className="flex flex-col xs:flex-row items-center justify-center xs:justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={previousTrack}
            className="btn btn-ghost btn-sm xs:btn-xs"
            aria-label="Previous track"
          >
            <FontAwesomeIcon icon={faBackward} />
          </button>

          <button
            onClick={togglePlay}
            className="btn btn-primary btn-sm xs:btn-xs"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
          </button>

          <button
            onClick={nextTrack}
            className="btn btn-ghost btn-sm xs:btn-xs"
            aria-label="Next track"
          >
            <FontAwesomeIcon icon={faForward} />
          </button>
        </div>

        <div className="flex-1 min-w-0 w-full px-2">
          <div className="flex items-center gap-1 text-xs text-text/70">
            <span className="w-8 text-right text-[10px]">{formatTime(currentTime)}</span>
            <div 
              ref={progressBarRef}
              onClick={handleProgressBarClick}
              className="flex-1 h-2 xs:h-1 bg-surface rounded-full overflow-hidden cursor-pointer"
            >
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

        <div className="flex items-center gap-2 mt-1 xs:mt-0">
          <button
            onClick={toggleShuffle}
            className={`btn btn-ghost btn-sm xs:btn-xs ${playbackMode === 'shuffle' ? 'text-primary' : ''}`}
            aria-label={playbackMode === 'shuffle' ? "Shuffle On" : "Shuffle Off"}
            title={playbackMode === 'shuffle' ? "Shuffle On" : "Shuffle Off"}
          >
            <FontAwesomeIcon icon={faShuffle} />
          </button>

          <button
            onClick={toggleRepeat}
            className={`btn btn-ghost btn-sm xs:btn-xs ${playbackMode === 'repeat' ? 'text-primary' : ''}`}
            aria-label={playbackMode === 'repeat' ? "Repeat On" : "Repeat Off"}
            title={playbackMode === 'repeat' ? "Repeat On" : "Repeat Off"}
          >
            <FontAwesomeIcon icon={faRepeat} />
          </button>

          <button
            onClick={toggleMute}
            className="btn btn-ghost btn-sm xs:btn-xs"
            aria-label={isMuted ? "Unmute" : "Mute"}
            title={isMuted ? "Unmute" : "Mute"}
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