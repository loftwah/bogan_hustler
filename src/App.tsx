import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import MapScreen from "./components/MapScreen";
import MarketScreen from "./components/MarketScreen";
import "./App.css";

function App() {
  const [currentScreen, setCurrentScreen] = useState<"map" | "market">("map");
  const { cash, location, currentDay, maxDays } = useSelector(
    (state: RootState) => state.player
  );

  useEffect(() => {
    // Save game state to localStorage
    localStorage.setItem(
      "boganHustler",
      JSON.stringify({ cash, location, currentDay })
    );
  }, [cash, location, currentDay]);

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
        <img src="/banner.jpg" alt="Bogan Hustler Banner" className="banner-image" />
      </div>
      <h1>Bogan Hustler</h1>
      
      <div className="status-bar">
        <div className="status-item">
          <img src="/square.jpg" alt="Status Icon" className="status-icon" />
          <span>Cash: ${cash}</span>
        </div>
        <div className="status-item">
          <img src="/square.jpg" alt="Location Icon" className="status-icon" />
          <span>Location: {location}</span>
        </div>
        <div className="status-item">
          <img src="/square.jpg" alt="Day Icon" className="status-icon" />
          <span>Day: {currentDay}/{maxDays}</span>
        </div>
      </div>

      <div className="nav-buttons">
        <button onClick={() => setCurrentScreen("map")}>Travel</button>
        <button onClick={() => setCurrentScreen("market")}>Market</button>
      </div>

      {currentScreen === "map" && <MapScreen />}
      {currentScreen === "market" && <MarketScreen />}
    </div>
  );
}

export default App;
