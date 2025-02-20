import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./store/store";
import MapScreen from "./components/MapScreen";
import MarketScreen from "./components/MarketScreen";
import LoanScreen from "./components/LoanScreen";
import UpgradesScreen from "./components/UpgradesScreen";
import EventPopup from "./components/EventPopup";
import "./App.css";
import bannerImage from '../public/banner.jpg';
import squareImage from '../public/square.jpg';
import { toggleAdultMode } from "./store/playerSlice";

type Screen = "map" | "market" | "loan" | "upgrades";

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("map");
  const { cash, location, currentDay, maxDays, reputation, debt } = useSelector(
    (state: RootState) => state.player
  );
  const dispatch = useDispatch();
  const adultMode = useSelector((state: RootState) => state.player.adultMode);
  const [audio] = useState(new Audio('./themesong.mp3'));
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      "boganHustler",
      JSON.stringify({ cash, location, currentDay, reputation })
    );
  }, [cash, location, currentDay, reputation]);

  useEffect(() => {
    const savedMode = localStorage.getItem("boganHustlerAdultMode");
    if (savedMode !== null) {
      const isAdult = JSON.parse(savedMode);
      if (isAdult !== adultMode) {
        dispatch(toggleAdultMode());
      }
    }
  }, []);

  const toggleAudio = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.volume = 0.2;
      audio.loop = true;
      audio.play().catch(err => console.log('Audio playback failed:', err));
    }
    setIsPlaying(!isPlaying);
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
        <button 
          onClick={toggleAudio}
          title={isPlaying ? "Mute Music" : "Play Music"}
        >
          {isPlaying ? "🔊 Mute" : "🔈 Play"}
        </button>
      </nav>

      <main>
        {currentScreen === "map" && <MapScreen />}
        {currentScreen === "market" && <MarketScreen />}
        {currentScreen === "loan" && <LoanScreen />}
        {currentScreen === "upgrades" && <UpgradesScreen />}
      </main>

      <EventPopup />
    </div>
  );
}

export default App;
