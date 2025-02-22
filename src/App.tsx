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
  faShieldAlt, 
  faChild,
  faMap,
  faStore,
  faLandmark,
  faBolt,
  faLink
} from '@fortawesome/free-solid-svg-icons';
import { faGithub, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MetaTags } from './components/MetaTags'
import { AudioPlayer } from './components/AudioPlayer'

type Screen = "map" | "market" | "loan" | "upgrades";

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("map");
  const { cash, location, currentDay, maxDays, reputation, debt, debtInterest, policeEvasion, marketIntel } = useSelector(
    (state: RootState) => state.player
  );
  const { inventory, inventorySpace } = useSelector((state: RootState) => state.player);
  const dispatch = useDispatch();
  const adultMode = useSelector((state: RootState) => state.player.adultMode);
  const [showTips, setShowTips] = useState(true);

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
    document.documentElement.setAttribute('data-user-interacted', 'true');
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I') {
        // Use the globally accessible toggle function
        const toggleInventory = (window as any).__toggleInventory;
        if (typeof toggleInventory === 'function') {
          toggleInventory();
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        setCurrentScreen('market');
      }
      // Add more shortcuts as needed
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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
    <>
      <MetaTags />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4">
          {/* Banner Image with Overlay */}
          <div className="relative mb-6">
            <img 
              src={bannerImage} 
              alt="Bogan Hustler Banner" 
              className="w-full h-48 object-cover rounded-lg shadow-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent rounded-lg" />
          </div>

          {/* Game Header Card */}
          <div className="card mb-6 -mt-20 relative z-10 shadow-xl border-t-4 border-t-primary">
            {/* Top Section with Logo and Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              {/* Logo and Title */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={squareImage} 
                    alt="Bogan Hustler Logo" 
                    className="w-16 h-16 rounded-lg shadow-md border-2 border-border"
                  />
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs font-bold">
                    AU
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-0">Bogan Hustler</h1>
                  <p className="text-sm text-text/70">Your Underground Empire Awaits</p>
                </div>
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center gap-3">
                <AudioPlayer />
                
                <button
                  onClick={() => dispatch(toggleAdultMode())}
                  className={`btn flex items-center gap-2 hover:scale-105 transform transition-all ${
                    adultMode 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  aria-label="Toggle adult mode"
                >
                  <FontAwesomeIcon icon={adultMode ? faShieldAlt : faChild} />
                  <span className="hidden sm:inline">{adultMode ? '18+ Mode' : 'Family'}</span>
                </button>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="text-sm text-text/70">Cash</div>
                <div className="text-xl font-bold">${cash.toLocaleString()}</div>
              </div>
              <div className="stat-card">
                <div className="text-sm text-text/70">Location</div>
                <div className="text-xl font-bold line-clamp-1 hover:line-clamp-none transition-all">
                  {location}
                </div>
              </div>
              <div className="stat-card">
                <div className="text-sm text-text/70">Day</div>
                <div className="text-xl font-bold">{currentDay}/{maxDays}</div>
              </div>
              <div className="stat-card">
                <div className="text-sm text-text/70">Reputation</div>
                <div className="text-xl font-bold">{reputation}</div>
              </div>
              {debt > 0 && (
                <div className="col-span-2 sm:col-span-4">
                  <div className="stat-card bg-red-900/20 border-red-500/20">
                    <div className="text-sm text-red-400">Outstanding Debt</div>
                    <div className="text-xl font-bold text-red-400">${debt.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <main className="card mb-20">
            {showTips && (
              <div className="card mb-4 bg-primary/10 border-primary/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Quick Tips</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Press 'I' to toggle the floating inventory</li>
                      <li>Press 'M' to open the market screen</li>
                      <li>Watch for market trends before buying</li>
                      <li>Higher reputation means better prices</li>
                      <li>Keep an eye on your debt interest!</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => setShowTips(false)}
                    className="text-sm opacity-70 hover:opacity-100"
                  >
                    Got it
                  </button>
                </div>
              </div>
            )}
            {currentScreen === "map" && <MapScreen />}
            {currentScreen === "market" && <MarketScreen />}
            {currentScreen === "loan" && <LoanScreen />}
            {currentScreen === "upgrades" && <UpgradesScreen />}
          </main>

          {/* Add Footer */}
          <footer className="text-center mb-24 text-sm text-text/70 space-y-4">
            <p>Made with ❤️ in Australia</p>
            <div className="flex justify-center gap-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface/50 rounded-full hover:bg-surface/80 transition-colors">
                <FontAwesomeIcon icon={faGithub} />
                <a 
                  href="https://github.com/loftwah/bogan_hustler"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                >
                  Open Source on GitHub
                </a>
              </div>
              <a 
                href="https://x.com/loftwah"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface/50 rounded-full hover:bg-surface/80 transition-colors text-primary hover:text-primary/80"
              >
                <FontAwesomeIcon icon={faXTwitter} />
                @loftwah
              </a>
              <a 
                href="https://linkarooie.com/loftwah"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface/50 rounded-full hover:bg-surface/80 transition-colors text-primary hover:text-primary/80"
              >
                <FontAwesomeIcon icon={faLink} />
                More Links
              </a>
            </div>
          </footer>

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
                  className={`btn px-2 sm:px-4 py-2 text-xs sm:text-base transform transition-all duration-200 hover:scale-105 ${
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
        <ToastContainer
          position="bottom-left"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </>
  );
}

export default App;
