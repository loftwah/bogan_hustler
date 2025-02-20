import { useDispatch, useSelector } from "react-redux";
import { upgradeInventory, upgradePoliceEvasion, upgradeMarketIntel } from "../store/playerSlice";
import type { RootState } from "../types";

const UpgradesScreen = () => {
  const dispatch = useDispatch();
  const { cash, inventorySpace, policeEvasion, marketIntel } = useSelector(
    (state: RootState) => state.player
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="card space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Upgrades</h2>
          <span className="px-3 py-1 bg-background/50 rounded-md text-sm">
            Cash: ${cash}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Inventory Space Upgrade */}
          <div className="card bg-background/50 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Inventory Space</h3>
              <div className="space-y-1">
                <p className="text-sm text-text/70">Current: {inventorySpace} units</p>
                <p className="text-sm text-text/70">Effect: +5 space</p>
                <p className="text-sm font-medium text-primary">Cost: $500</p>
              </div>
            </div>
            <button 
              onClick={() => dispatch(upgradeInventory())}
              disabled={cash < 500}
              className="btn btn-primary w-full"
            >
              Upgrade Space
            </button>
          </div>

          {/* Police Evasion Upgrade */}
          <div className="card bg-background/50 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Police Evasion</h3>
              <div className="space-y-1">
                <p className="text-sm text-text/70">Current: {policeEvasion}%</p>
                <p className="text-sm text-text/70">Effect: +20% evasion</p>
                <p className="text-sm font-medium text-primary">Cost: $1,000</p>
              </div>
            </div>
            <button 
              onClick={() => dispatch(upgradePoliceEvasion())}
              disabled={cash < 1000 || policeEvasion >= 100}
              className="btn btn-primary w-full"
            >
              Upgrade Evasion
            </button>
          </div>

          {/* Market Intel Upgrade */}
          <div className="card bg-background/50 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Market Intel</h3>
              <div className="space-y-1">
                <p className="text-sm text-text/70">Current: {marketIntel}%</p>
                <p className="text-sm text-text/70">Effect: +15% market info</p>
                <p className="text-sm font-medium text-primary">Cost: $750</p>
              </div>
            </div>
            <button 
              onClick={() => dispatch(upgradeMarketIntel())}
              disabled={cash < 750 || marketIntel >= 100}
              className="btn btn-primary w-full"
            >
              Upgrade Intel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradesScreen; 