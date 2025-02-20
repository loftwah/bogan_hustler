import { useDispatch, useSelector } from "react-redux";
import { travel } from "../store/playerSlice";
import { updatePrices } from "../store/marketSlice";
import { triggerRandomEvent } from "../store/eventSlice";
import { RootState, AppDispatch } from "../store/store";

// Group locations by region for better organization
const locationsByRegion = {
  "New South Wales": [
    "Kings Cross",
    "Redfern",
    "Cabramatta",
    "Mount Druitt",
    "Blacktown",
    "Nimbin",
    "Penrith",
    "Campbelltown",
    "Wollongong",
    "Newcastle",
  ],
  "Victoria": [
    "Frankston",
    "Broadmeadows",
    "Dandenong",
    "Sunshine",
    "Werribee",
    "Melton",
    "Norlane",
    "Moe",
  ],
  "Queensland": [
    "Logan Central",
    "Inala",
    "Woodridge",
    "Caboolture",
    "Ipswich",
    "Toowoomba",
    "Cairns",
    "Townsville",
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
      dispatch(updatePrices({ reputation, location, adultMode }));
      // Police risk is reduced by player's evasion skill
      const baseRisk = 0.2;
      const modifiedRisk = baseRisk * (1 - policeEvasion / 100);
      if (Math.random() < modifiedRisk) {
        dispatch(triggerRandomEvent(location));
      }
    }
  };

  return (
    <div className="map-screen">
      <h2>Straya Drug Map</h2>
      <div className="region-grid">
        {Object.entries(locationsByRegion).map(([region, locations]) => (
          <div key={region} className="region-section">
            <h3>{region}</h3>
            <div className="location-list">
              {locations.map((loc) => {
                const isCurrentLocation = loc === currentLocation;
                return (
                  <button
                    key={loc}
                    onClick={() => handleTravel(loc)}
                    disabled={isCurrentLocation}
                    className={`location-button ${isCurrentLocation ? 'current' : ''}`}
                  >
                    {loc}
                    {isCurrentLocation && " (Here)"}
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