import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import MapScreen from "./components/MapScreen";
import MarketScreen from "./components/MarketScreen";
import LoanScreen from "./components/LoanScreen";
import UpgradesScreen from "./components/UpgradesScreen";
import EventPopup from "./components/EventPopup";
import "./App.css";

type Screen = "map" | "market" | "loan" | "upgrades";

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("map");
  const { cash, location, currentDay, maxDays, reputation, debt } = useSelector(
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
      <header>
        <h1>Bogan Hustler</h1>
        <div className="status-bar">
          <div>Cash: ${cash}</div>
          <div>Location: {location}</div>
          <div>Day: {currentDay}/{maxDays}</div>
          <div>Rep: {reputation}</div>
          {debt > 0 && <div>Debt: ${debt.toFixed(2)}</div>}
        </div>
      </header>

      <nav className="nav-buttons">
        <button onClick={() => setCurrentScreen("map")}>Map</button>
        <button onClick={() => setCurrentScreen("market")}>Market</button>
        <button onClick={() => setCurrentScreen("loan")}>Loan Shark</button>
        <button onClick={() => setCurrentScreen("upgrades")}>Upgrades</button>
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
