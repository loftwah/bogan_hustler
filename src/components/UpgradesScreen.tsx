import { useDispatch, useSelector } from "react-redux";
import { upgradeInventory, upgradePoliceEvasion, upgradeMarketIntel } from "../store/playerSlice";
import type { RootState } from "../types";

const UpgradesScreen = () => {
  const dispatch = useDispatch();
  const { cash, inventorySpace, policeEvasion, marketIntel } = useSelector(
    (state: RootState) => state.player
  );

  return (
    <div className="upgrades-screen">
      <h2>Upgrades, Mate!</h2>
      <p>Cash: ${cash}</p>
      <div className="upgrade-list">
        <div className="upgrade-item">
          <div className="upgrade-info">
            <h3>Inventory Space</h3>
            <p>Current: {inventorySpace}</p>
            <p>Cost: $500</p>
            <p>Effect: +5 space</p>
          </div>
          <button 
            onClick={() => dispatch(upgradeInventory())}
            disabled={cash < 500}
            className="quick-action-button"
            aria-label="Upgrade inventory space"
          >
            Upgrade Space
          </button>
        </div>

        <div className="upgrade-item">
          <div className="upgrade-info">
            <h3>Police Evasion</h3>
            <p>Current: {policeEvasion}%</p>
            <p>Cost: $1000</p>
            <p>Effect: +20% evasion</p>
          </div>
          <button 
            onClick={() => dispatch(upgradePoliceEvasion())}
            disabled={cash < 1000 || policeEvasion >= 100}
            className="quick-action-button"
            aria-label="Upgrade police evasion"
          >
            Upgrade Evasion
          </button>
        </div>

        <div className="upgrade-item">
          <div className="upgrade-info">
            <h3>Market Intel</h3>
            <p>Current: {marketIntel}%</p>
            <p>Cost: $750</p>
            <p>Effect: +25% market info</p>
          </div>
          <button 
            onClick={() => dispatch(upgradeMarketIntel())} 
            disabled={cash < 750 || marketIntel >= 100}
            className="upgrade-button"
          >
            Upgrade Intel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradesScreen; 