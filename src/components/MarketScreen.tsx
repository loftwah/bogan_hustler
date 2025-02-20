import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { buyDrug, sellDrug } from "../store/playerSlice";
import { RootState } from "../store/store";

const MarketScreen = () => {
  const dispatch = useDispatch();
  const { location, inventory, cash } = useSelector((state: RootState) => state.player);
  const prices = useSelector((state: RootState) => state.market.prices[location]);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="market-screen">
      <h2>Market in {location}</h2>
      <div className="quantity-control">
        <label>Quantity: </label>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
        />
      </div>
      <div className="market-list">
        {Object.entries(prices || {}).map(([drug, market]: [string, { price: number }]) => {
          const { price } = market;
          const owned = inventory.find((item) => item.name === drug)?.quantity || 0;
          const canBuy = cash >= price * quantity;
          const canSell = owned >= quantity;

          return (
            <div key={drug} className="market-item">
              <div className="drug-info">
                <span className="drug-name">{drug}</span>
                <span className="drug-price">${price}</span>
                <span className="drug-owned">Owned: {owned}</span>
              </div>
              <div className="drug-actions">
                <button
                  onClick={() => dispatch(buyDrug({ drug, quantity, price }))}
                  disabled={!canBuy}
                >
                  Buy
                </button>
                <button
                  onClick={() => dispatch(sellDrug({ drug, quantity, price }))}
                  disabled={!canSell}
                >
                  Sell
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketScreen; 