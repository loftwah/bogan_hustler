import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { buyDrug, sellDrug } from "../store/playerSlice";
import { RootState } from "../store/store";
import type { DrugMarket } from "../store/marketSlice";

const DRUG_MAPPINGS: Record<string, string> = {
  "Ice": "Energy Drinks",
  "Crack": "Supplements",
  "Heroin": "Protein Powder",
  "Cocaine": "Pre-workout",
  "Pingas": "Vitamins",
  "Xannies": "Pain Relief",
  "Durries": "Cigarettes",
  "Nangs": "Cream Chargers",
  "Bush Weed": "Herbal Tea",
  "Hydro": "Coffee Beans",
  "Shrooms": "Mushroom Extract",
  "Acid": "Caffeine Pills",
  "MDMA": "Energy Tablets",
  "Ketamine": "Sleep Aid",
  "Weed": "Green Tea",
  "Steroids": "Protein Bars"
};

interface MarketDataWithOriginal extends DrugMarket {
  originalName?: string;
}

const MarketScreen = () => {
  const dispatch = useDispatch();
  const { location, inventory, cash, adultMode } = useSelector((state: RootState) => state.player);
  const prices = useSelector((state: RootState) => {
    const marketData = state.market.prices[location];
    if (!adultMode) {
      return Object.entries(marketData).reduce((acc, [drug, data]) => {
        const censoredName = DRUG_MAPPINGS[drug] || drug;
        acc[censoredName] = {
          ...data,
          originalName: drug
        };
        return acc;
      }, {} as Record<string, MarketDataWithOriginal>);
    }
    return marketData;
  });
  const [quantity, setQuantity] = useState(1);

  // Create a combined list of market items and inventory items
  const marketItems = useMemo(() => {
    const items = new Map<string, MarketDataWithOriginal & { owned: number }>();
    
    // Add market prices
    Object.entries(prices || {}).forEach(([drug, market]) => {
      const originalDrug = adultMode ? drug : market.originalName || drug;
      const owned = inventory.find(item => item.name === originalDrug)?.quantity || 0;
      items.set(drug, { ...market, owned });
    });

    // Add inventory items that aren't in the market
    inventory.forEach(item => {
      const displayName = adultMode ? item.name : DRUG_MAPPINGS[item.name] || item.name;
      if (!items.has(displayName)) {
        items.set(displayName, {
          price: 0, // Price not available in this market
          supply: 0,
          demand: 0,
          originalName: item.name,
          owned: item.quantity
        });
      }
    });

    return Array.from(items.entries());
  }, [prices, inventory, adultMode]);

  const handleBuy = (drug: string, price: number) => {
    const originalDrug = adultMode ? drug : Object.entries(DRUG_MAPPINGS)
      .find(([_, censored]) => censored === drug)?.[0] || drug;
    dispatch(buyDrug({ drug: originalDrug, quantity, price }));
  };

  const handleSell = (drug: string, price: number) => {
    const originalDrug = adultMode ? drug : Object.entries(DRUG_MAPPINGS)
      .find(([_, censored]) => censored === drug)?.[0] || drug;
    dispatch(sellDrug({ drug: originalDrug, quantity, price }));
  };

  return (
    <div className="market-screen">
      <h2>Market in {location}</h2>
      
      {/* Mobile-friendly quantity control */}
      <div className="quantity-controls">
        <button 
          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
          className="quantity-button"
        >-</button>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="quantity-input"
        />
        <button 
          onClick={() => setQuantity(prev => prev + 1)}
          className="quantity-button"
        >+</button>
      </div>

      <div className="market-list">
        {marketItems.map(([drug, market]) => {
          const { price, owned } = market;
          const canBuy = price > 0 && cash >= price * quantity;
          const canSell = owned >= quantity;

          return (
            <div key={drug} className="market-item">
              <div className="drug-info">
                <h3 className="drug-name">{drug}</h3>
                <div className="drug-details">
                  <span className="drug-price">
                    {price > 0 ? `$${price}` : 'Not available'}
                  </span>
                  <span className="drug-owned">Owned: {owned}</span>
                </div>
              </div>
              <div className="drug-actions">
                <button
                  onClick={() => handleBuy(drug, price)}
                  disabled={!canBuy}
                  className={`action-button buy-button ${!canBuy ? 'disabled' : ''}`}
                >
                  Buy {quantity}
                </button>
                <button
                  onClick={() => handleSell(drug, price)}
                  disabled={!canSell}
                  className={`action-button sell-button ${!canSell ? 'disabled' : ''}`}
                >
                  Sell {quantity}
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