import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import MapScreen from "./components/MapScreen";
import MarketScreen from "./components/MarketScreen";
import EventPopup from "./components/EventPopup";
import "./App.css";

function App() {
  const [currentScreen, setCurrentScreen] = useState<"map" | "market">("map");
  const { cash, location, currentDay, maxDays, reputation } = useSelector(
    (state: RootState) => state.player
  );

  useEffect(() => {
    localStorage.setItem(
      "boganHustler",
      JSON.stringify({ cash, location, currentDay, reputation })
    );
  }, [cash, location, currentDay, reputation]);

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
          <img src="/assets/cash.png" alt="Cash Icon" className="status-icon" />
          <span>Cash: ${cash}</span>
        </div>
        <div className="status-item">
          <img src="/assets/location.png" alt="Location Icon" className="status-icon" />
          <span>Location: {location}</span>
        </div>
        <div className="status-item">
          <img src="/assets/day.png" alt="Day Icon" className="status-icon" />
          <span>Day: {currentDay}/{maxDays}</span>
        </div>
        <div className="status-item">
          <img src="/assets/rep.png" alt="Rep Icon" className="status-icon" />
          <span>Rep: {reputation}</span>
        </div>
      </div>

      <div className="nav-buttons">
        <button onClick={() => setCurrentScreen("map")}>Travel</button>
        <button onClick={() => setCurrentScreen("market")}>Market</button>
      </div>

      {currentScreen === "map" && <MapScreen />}
      {currentScreen === "market" && <MarketScreen />}
      <EventPopup />
    </div>
  );
}

export default App;
