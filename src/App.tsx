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
import bannerImage from './assets/banner.jpg'
import squareImage from './assets/square.jpg'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faVolumeUp, 
  faVolumeMute, 
  faShieldAlt, 
  faChild,
  faMap,
  faStore,
  faLandmark,
  faBolt
} from '@fortawesome/free-solid-svg-icons';

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

  useEffect(() => {
    const savedPlayingState = localStorage.getItem('boganHustlerAudioPlaying');
    if (savedPlayingState === 'true') {
      audio.loop = true;
      audio.play().catch(err => console.error('Audio playback failed:', err));
      setIsPlaying(true);
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

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
        {/* Banner Image at the top */}
        <img 
          src={bannerImage} 
          alt="Bogan Hustler Banner" 
          className="w-full h-32 object-cover rounded-lg mb-6"
        />

        {/* Game Header */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            {/* Square logo image */}
            <div className="flex items-center gap-4">
              <img 
                src={squareImage} 
                alt="Bogan Hustler Logo" 
                className="w-12 h-12 rounded-lg"
              />
              <h1 className="text-4xl font-bold text-primary">Bogan Hustler</h1>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Add Music Toggle Button */}
              <button
                onClick={toggleAudio}
                className="px-3 py-1 rounded-md text-sm bg-surface hover:bg-surface/80"
                aria-label={isPlaying ? "Mute music" : "Play music"}
              >
                <FontAwesomeIcon icon={isPlaying ? faVolumeUp : faVolumeMute} className="mr-2" />
                {isPlaying ? 'Mute' : 'Play'}
              </button>
              
              {/* Add Adult Mode Toggle */}
              <button
                onClick={() => dispatch(toggleAdultMode())}
                className={`px-3 py-1 rounded-md text-sm ${
                  adultMode 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                aria-label="Toggle adult mode"
              >
                <FontAwesomeIcon icon={adultMode ? faShieldAlt : faChild} className="mr-2" />
                {adultMode ? '18+ Mode On' : 'Family Friendly'}
              </button>
            </div>
          </div>
          
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
          <div className="max-w-7xl mx-auto grid grid-cols-4 gap-2">
            {[
              { id: "map", icon: faMap, label: "Map" },
              { id: "market", icon: faStore, label: "Market" },
              { id: "loan", icon: faLandmark, label: "Loan" },
              { id: "upgrades", icon: faBolt, label: "Upgrades" }
            ].map((screen) => (
              <button
                key={screen.id}
                onClick={() => setCurrentScreen(screen.id as Screen)}
                className={`btn px-2 sm:px-4 py-2 text-xs sm:text-base ${
                  currentScreen === screen.id ? 'btn-primary' : 'btn-surface'
                }`}
              >
                <span className="hidden sm:inline">
                  <FontAwesomeIcon icon={screen.icon} className="mr-2" />
                  {screen.label}
                </span>
                <span className="sm:hidden text-base">
                  <FontAwesomeIcon icon={screen.icon} />
                </span>
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
