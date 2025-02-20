import { useDispatch, useSelector } from "react-redux";
import { travel } from "../store/playerSlice";
import { updatePrices } from "../store/marketSlice";
import { triggerRandomEvent } from "../store/eventSlice";
import { RootState } from "../store/store";

const locations = [
  "Sydney",
  "Melbourne",
  "Gold Coast",
  "Perth",
  "Darwin",
  "Alice Springs",
  "Byron Bay",
  "Adelaide",
  "Tasmania",
];

const MapScreen = () => {
  const dispatch = useDispatch();
  const currentLocation = useSelector((state: RootState) => state.player.location);

  const handleTravel = (location: string) => {
    if (location !== currentLocation) {
      dispatch(travel(location));
      dispatch(updatePrices());
      if (Math.random() < 0.2) { // 20% chance of random event
        dispatch(triggerRandomEvent());
      }
    }
  };

  return (
    <div className="map-screen">
      <h2>Travel to:</h2>
      <div className="location-grid">
        {locations.map((loc) => (
          <button
            key={loc}
            onClick={() => handleTravel(loc)}
            disabled={loc === currentLocation}
            className="location-button"
          >
            {loc}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MapScreen; 