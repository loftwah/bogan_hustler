import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./store/store";
import MapScreen from "./components/MapScreen";
import MarketScreen from "./components/MarketScreen";
import LoanScreen from "./components/LoanScreen";
import UpgradesScreen from "./components/UpgradesScreen";
import EventPopup from "./components/EventPopup";
import FloatingInventory from './components/FloatingInventory';
import { toggleAdultMode } from "./store/playerSlice";

type Screen = "map" | "market" | "loan" | "upgrades";

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("map");
  const { cash, location, currentDay, maxDays, reputation, debt, debtInterest, policeEvasion, marketIntel } = useSelector(
    (state: RootState) => state.player
  );
  const { inventory, inventorySpace } = useSelector((state: RootState) => state.player);
  const dispatch = useDispatch();
  const adultMode = useSelector((state: RootState) => state.player.adultMode);
  const [audio] = useState(new Audio('./themesong.mp3'));
  const [isPlaying, setIsPlaying] = useState(false);

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

  const toggleAudio = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.loop = true;
      audio.play().catch(err => {
        console.error('Audio playback failed:', err);
        alert('Audio playback failed. Please check your browser settings.');
      });
    }
    setIsPlaying(!isPlaying);
    localStorage.setItem('boganHustlerAudioPlaying', String(!isPlaying));
  };

  if (currentDay > maxDays) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Game Over, Mate!</h1>
        <p className="text-xl mb-4">Final Cash: ${cash}</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4">
        {/* Game Header */}
        <div className="card mb-6">
          <h1 className="text-4xl font-bold text-primary text-center mb-4">Bogan Hustler</h1>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background/50 p-3 rounded-lg">
              <span className="font-medium">Cash:</span> ${cash}
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <span className="font-medium">Location:</span> {location}
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <span className="font-medium">Day:</span> {currentDay}/{maxDays}
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <span className="font-medium">Rep:</span> {reputation}
            </div>
            {debt > 0 && (
              <div className="bg-background/50 p-3 rounded-lg text-red-400">
                <span className="font-medium">Debt:</span> ${debt.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <main className="card mb-20">
          {currentScreen === "map" && <MapScreen />}
          {currentScreen === "market" && <MarketScreen />}
          {currentScreen === "loan" && <LoanScreen />}
          {currentScreen === "upgrades" && <UpgradesScreen />}
        </main>

        {/* Fixed Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="max-w-7xl mx-auto grid grid-cols-4 gap-4">
            {["map", "market", "loan", "upgrades"].map((screen) => (
              <button
                key={screen}
                onClick={() => setCurrentScreen(screen as Screen)}
                className={`btn ${currentScreen === screen ? 'btn-primary' : 'btn-surface'}`}
              >
                {screen.charAt(0).toUpperCase() + screen.slice(1)}
              </button>
            ))}
          </div>
        </nav>

        <EventPopup />
        <FloatingInventory />
      </div>
    </div>
  );
}

export default App;
