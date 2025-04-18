import { useDispatch, useSelector } from "react-redux";
import { travel } from "../store/playerSlice";
import { updatePricesWithLocation } from "../store/marketSlice";
import { triggerRandomEvent } from "../store/eventSlice";
import { RootState, AppDispatch } from "../store/store";

// Group locations by region for better organization
export const locationsByRegion = {
  "New South Wales": [
    // Hardcore Areas
    "Kings Cross", // Major drug hub, nightlife district
    "Redfern", // Historical drug area, gang presence
    "Cabramatta", // Former heroin capital, Asian crime networks
    "Mount Druitt", // Gang territory, high drug activity
    "Merrylands", // Middle Eastern crime networks
    "Auburn", // Gang conflicts, drug distribution
    "Bankstown", // Gang territory, drug trade
    "Liverpool", // Drug distribution hub
    "Blacktown", // Street-level dealing
    "Nimbin", // Cannabis culture, party drugs
    "Penrith", // Western Sydney drug market
    "Campbelltown", // Gang presence
    "Wollongong", // Coastal drug route
    "Newcastle", // Port city drug entry
    "Sydney CBD", // Nightlife drug scene
    "Parramatta", // Western hub
    "Byron Bay", // Party drug scene
    "Lismore", // Northern Rivers drug route
    "Dubbo", // Rural drug distribution
    "Fairfield", // Gang territory
    "Woolloomooloo", // Inner city drug zone
  ],
  "Victoria": [
    "Frankston", // Coastal drug route
    "Broadmeadows", // Gang territory
    "Dandenong", // Major drug hub
    "Sunshine", // Gang presence
    "Craigieburn", // Emerging drug zone
    "Springvale", // Asian crime networks
    "Werribee", // Western drug market
    "Norlane", // High drug activity
    "Moe", // Rural drug distribution
    "Melbourne CBD", // Nightlife scene
    "St Kilda", // Historical drug area
    "Footscray", // Asian heroin trade history
    "Geelong", // Port city route
    "Bendigo", // Regional distribution
    "Richmond", // Historical heroin zone
    "Sunbury", // Outer suburban market
    "Collingwood", // Inner city drug scene
    "Braybrook", // Western suburbs trade
  ],
  "Queensland": [
    "Logan Central", // Major drug hub
    "Inala", // Gang territory
    "Woodridge", // High drug activity
    "Southport", // Gold Coast drug scene
    "Marsden", // Gang presence
    "Beenleigh", // Distribution hub
    "Surfers Paradise", // Party drug market
    "Kingston", // Drug activity zone
    "Caboolture", // Northern corridor
    "Ipswich", // Western drug route
    "Toowoomba", // Regional distribution
    "Cairns", // Northern drug entry
    "Townsville", // Northern hub
    "Fortitude Valley", // Nightlife drug scene
    "Palm Beach", // Gold Coast market
  ],
  "Western Australia": [
    "Rockingham",
    "Armadale",
    "Mandurah",
    "Midland",
    "Balga",
    "Gosnells",
    "Kalgoorlie-Boulder",
    "Port Hedland",
  ],
  "Northern Territory": [
    "Palmerston",
    "Katherine",
    "Tennant Creek",
    "Karama",
    "Malak",
  ],
  "South Australia": [
    "Elizabeth",
    "Salisbury",
    "Davoren Park",
    "Christie Downs",
    "Hackham West",
    "Port Adelaide",
  ],
  "Tasmania": [
    "Hobart",
    "Launceston",
    "Devonport",
    "Burnie",
    "Glenorchy",
    "Bridgewater",
  ],
  "Australian Capital Territory": [
    "Civic",
    "Belconnen",
    "Tuggeranong",
    "Gungahlin",
    "Woden",
  ],
};

const MapScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { location: currentLocation, policeEvasion, reputation, adultMode, marketIntel } = useSelector((state: RootState) => state.player);
  const isDebugMode = window.location.search.includes('debug=true');
  
  // Check if we're on mobile to increase event frequency
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleTravel = (location: string) => {
    if (location !== currentLocation) {
      dispatch(travel(location));
      dispatch(updatePricesWithLocation({ 
        reputation, 
        location, 
        adultMode,
        prevLocation: currentLocation,
        marketIntel: marketIntel
      }));

      // Get last event time from localStorage
      const lastEventTime = Number(localStorage.getItem('lastEventTime')) || 0;
      const currentTime = Date.now();
      
      // Reduce cooldown period to increase event frequency
      // Even shorter cooldown on mobile
      const cooldownPeriod = isMobileDevice ? 5000 : 10000; // 5 seconds on mobile, 10 seconds otherwise
      
      // Police risk is reduced by player's evasion skill
      // Increase base risk significantly to trigger more events
      // Higher base chance on mobile
      const baseRisk = isMobileDevice ? 0.8 : 0.6; // 80% on mobile, 60% otherwise
      const modifiedRisk = baseRisk * (1 - policeEvasion / 200); // Less reduction from evasion
      
      if (isDebugMode) {
        console.log(`Event chance: ${modifiedRisk.toFixed(2)}, Cooldown passed: ${currentTime - lastEventTime > cooldownPeriod}`);
        console.log(`Is mobile: ${isMobileDevice}, Last event time: ${new Date(lastEventTime).toLocaleTimeString()}`);
      }
      
      // Only trigger event if enough time has passed
      if (Math.random() < modifiedRisk && currentTime - lastEventTime > cooldownPeriod) {
        if (isDebugMode) {
          console.log("Triggering random event!");
        }
        dispatch(triggerRandomEvent(location));
        // Save the current time to localStorage for cooldown
        localStorage.setItem('lastEventTime', currentTime.toString());
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">{adultMode ? "Straya Drug Map" : "Straya Market Map"}</h2>
      </div>

      <div className="grid gap-6">
        {Object.entries(locationsByRegion).map(([region, locations]) => (
          <div key={region} className="bg-surface rounded-xl p-4 shadow-lg border border-border/50">
            <h3 className="text-lg font-semibold mb-3 px-1 flex items-center gap-2">
              {region}
              <span className="text-sm font-normal text-text/60">
                ({locations.length} locations)
              </span>
            </h3>
            
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
              {locations.map((loc) => {
                return (
                  <button
                    key={loc}
                    onClick={() => handleTravel(loc)}
                    disabled={loc === currentLocation}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between gap-1 
                      ${loc === currentLocation ? 'bg-primary text-white shadow-md' : 'bg-background hover:bg-primary/10'}`}
                  >
                    <span className="truncate">{loc}</span>
                    {loc === currentLocation && <span className="text-xs opacity-90 shrink-0">📍 Here</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapScreen;