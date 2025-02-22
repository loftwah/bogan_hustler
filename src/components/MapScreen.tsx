import { useDispatch, useSelector } from "react-redux";
import { travel } from "../store/playerSlice";
import { updatePricesWithLocation } from "../store/marketSlice";
import { triggerRandomEvent } from "../store/eventSlice";
import { RootState, AppDispatch } from "../store/store";

// Group locations by region for better organization
export const locationsByRegion = {
  "New South Wales": [
    "Kings Cross",
    "Redfern",
    "Cabramatta",
    "Mount Druitt",
    "Merrylands",
    "Auburn",
    "Bankstown",
    "Liverpool",
    "Blacktown",
    "Nimbin",
    "Penrith",
    "Campbelltown",
    "Wollongong",
    "Newcastle",
    "Sydney CBD",
    "Parramatta",
    "Byron Bay",
    "Lismore",
    "Dubbo",
    "Fairfield",
    "Woolloomooloo",
  ],
  "Victoria": [
    "Frankston",
    "Broadmeadows",
    "Dandenong",
    "Sunshine",
    "Craigieburn",
    "Springvale",
    "Werribee",
    "Norlane",
    "Moe",
    "Melbourne CBD",
    "St Kilda",
    "Footscray",
    "Geelong",
    "Bendigo",
    "Richmond",
    "Sunbury",
    "Collingwood",
    "Braybrook",
  ],
  "Queensland": [
    "Logan Central",
    "Inala",
    "Woodridge",
    "Southport",
    "Marsden",
    "Beenleigh",
    "Surfers Paradise",
    "Kingston",
    "Caboolture",
    "Ipswich",
    "Toowoomba",
    "Cairns",
    "Townsville",
    "Fortitude Valley",
    "Palm Beach",
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
  const { location: currentLocation, policeEvasion, reputation, adultMode } = useSelector((state: RootState) => state.player);

  const handleTravel = (location: string) => {
    if (location !== currentLocation) {
      dispatch(travel(location));
      dispatch(updatePricesWithLocation({ 
        reputation, 
        location, 
        adultMode,
        prevLocation: currentLocation 
      }));

      // Get last event time from localStorage or default to 0
      const lastEventTime = Number(localStorage.getItem('lastEventTime')) || 0;
      const currentTime = Date.now();
      const cooldownPeriod = 30000; // 30 seconds cooldown

      // Police risk is reduced by player's evasion skill
      const baseRisk = 0.2;
      const modifiedRisk = baseRisk * (1 - policeEvasion / 100);

      // Only trigger event if enough time has passed since the last event
      if (Math.random() < modifiedRisk && currentTime - lastEventTime > cooldownPeriod) {
        dispatch(triggerRandomEvent(location));
        localStorage.setItem('lastEventTime', currentTime.toString());
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Straya Drug Map</h2>
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