import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./store/store";
import MapScreen from "./components/MapScreen";
import MarketScreen from "./components/MarketScreen";
import LoanScreen from "./components/LoanScreen";
import UpgradesScreen from "./components/UpgradesScreen";
import EventPopup from "./components/EventPopup";
import FloatingInventory from './components/FloatingInventory';
import "./App.css";
import bannerImage from './assets/banner.jpg';
import squareImage from './assets/square.jpg';
import { toggleAdultMode } from "./store/playerSlice";

type Screen = "map" | "market" | "loan" | "upgrades";

// Add proper type definition for AudioContext
interface AudioContextType {
  AudioContext: typeof AudioContext;
  webkitAudioContext: typeof AudioContext;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("map");
  const { cash, location, currentDay, maxDays, reputation, debt, debtInterest, policeEvasion, marketIntel } = useSelector(
    (state: RootState) => state.player
  );
  const { inventory, inventorySpace } = useSelector((state: RootState) => state.player);
  const dispatch = useDispatch();
  const adultMode = useSelector((state: RootState) => state.player.adultMode);
  const [audio] = useState(new Audio('/bogan_hustler/themesong.mp3'));
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);
  const [volume, setVolume] = useState(() => 
    parseFloat(localStorage.getItem('boganHustlerVolume') || '0.2')
  );

  useEffect(() => {
    localStorage.setItem(
      "boganHustler",
      JSON.stringify({
        cash,
        location,
        currentDay,
        reputation,
        inventory,
        inventorySpace,
        debt,
        debtInterest,
        policeEvasion,
        marketIntel,
        adultMode
      })
    );
  }, [cash, location, currentDay, reputation, inventory, inventorySpace, debt, debtInterest, policeEvasion, marketIntel, adultMode]);

  useEffect(() => {
    const savedMode = localStorage.getItem("boganHustlerAdultMode");
    if (savedMode !== null) {
      const isAdult = JSON.parse(savedMode);
      if (isAdult !== adultMode) {
        dispatch(toggleAdultMode());
      }
    }
  }, []);

  useEffect(() => {
    // Initialize audio context
    const ctx = new (window.AudioContext || ((window as unknown as AudioContextType).webkitAudioContext))();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = volume;
    
    setAudioContext(ctx);
    setGainNode(gain);

    // Cleanup on unmount
    return () => {
      ctx.close();
      audio.pause();
      audio.src = '';
    };
  }, []);

  const toggleAudio = () => {
    try {
      if (!audioContext || !gainNode) return;

      if (isPlaying) {
        audio.pause();
      } else {
        audio.volume = volume;
        audio.loop = true;
        
        // Connect audio to gain node
        const source = audioContext.createMediaElementSource(audio);
        source.connect(gainNode);
        
        audio.play().catch(err => {
          console.error('Audio playback failed:', err);
          // Show user-friendly error message
          alert('Audio playback failed. Please check your browser settings.');
        });
      }
      setIsPlaying(!isPlaying);
      localStorage.setItem('boganHustlerAudioPlaying', String(!isPlaying));
    } catch (err) {
      console.error('Audio system error:', err);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!gainNode) return;
    setVolume(newVolume);
    gainNode.gain.value = newVolume;
    localStorage.setItem('boganHustlerVolume', String(newVolume));
  };

  if (currentDay > maxDays) {
    return (
      <div className="app">
        <h1>Game Over, Mate!</h1>
        <p>Final Cash: ${cash}</p>
        <button onClick={() => window.location.reload()}>Play Again</button>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="banner">
        <img 
          src={bannerImage} 
          alt="Bogan Hustler Banner" 
          className="banner-image"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.parentElement?.classList.add('banner-fallback');
            if (target.parentElement) {
              target.parentElement.innerHTML = 'Welcome to Bogan Hustler!';
            }
          }}
        />
      </div>
      <header>
        <h1>Bogan Hustler</h1>
        <div className="status-bar">
          <div className="status-item">
            <img src={squareImage} alt="Cash Icon" className="status-icon" />
            <span>Cash: ${cash}</span>
          </div>
          <div className="status-item">
            <img src={squareImage} alt="Location Icon" className="status-icon" />
            <span>Location: {location}</span>
          </div>
          <div className="status-item">
            <img src={squareImage} alt="Day Icon" className="status-icon" />
            <span>Day: {currentDay}/{maxDays}</span>
          </div>
          <div className="status-item">
            <img src={squareImage} alt="Reputation Icon" className="status-icon" />
            <span>Rep: {reputation}</span>
          </div>
          {debt > 0 && (
            <div className="status-item">
              <img src={squareImage} alt="Debt Icon" className="status-icon" />
              <span>Debt: ${debt.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="adult-mode-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={adultMode}
              onChange={() => dispatch(toggleAdultMode())}
            />
            18+ Mode
          </label>
        </div>
      </header>

      <nav className="nav-buttons">
        <button onClick={() => setCurrentScreen("map")}>Map</button>
        <button onClick={() => setCurrentScreen("market")}>Market</button>
        <button onClick={() => setCurrentScreen("loan")}>Loan Shark</button>
        <button onClick={() => setCurrentScreen("upgrades")}>Upgrades</button>
        <div className="audio-controls">
          <button 
            onClick={toggleAudio}
            title={isPlaying ? "Mute Music" : "Play Music"}
          >
            {isPlaying ? "🔊 Mute" : "🔈 Play"}
          </button>
          {isPlaying && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              title="Volume"
            />
          )}
        </div>
      </nav>

      <main>
        {currentScreen === "map" && <MapScreen />}
        {currentScreen === "market" && <MarketScreen />}
        {currentScreen === "loan" && <LoanScreen />}
        {currentScreen === "upgrades" && <UpgradesScreen />}
      </main>

      <EventPopup />
      <FloatingInventory />
    </div>
  );
}

export default App;
