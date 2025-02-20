import { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
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

// Define interfaces for better type safety
interface MarketDataWithOriginal extends DrugMarket {
  originalName?: string;
  owned: number;
}

// Create memoized selectors
const selectLocation = (state: RootState) => state.player.location;
const selectAdultMode = (state: RootState) => state.player.adultMode;
const selectMarketPrices = (state: RootState) => state.market.prices;

const selectPricesForLocation = createSelector(
  [selectMarketPrices, selectLocation, selectAdultMode],
  (prices, location, adultMode): Record<string, MarketDataWithOriginal> => {
    const marketData = prices[location];
    if (!adultMode) {
      return Object.entries(marketData).reduce((acc, [drug, data]) => {
        const censoredName = DRUG_MAPPINGS[drug] || drug;
        acc[censoredName] = {
          ...data,
          originalName: drug,
          owned: 0  // Initialize with 0, will be updated in marketItems
        };
        return acc;
      }, {} as Record<string, MarketDataWithOriginal>);
    }
    // When returning marketData directly, we need to add the owned property
    return Object.entries(marketData).reduce((acc, [drug, data]) => {
      acc[drug] = {
        ...data,
        owned: 0  // Initialize with 0, will be updated in marketItems
      };
      return acc;
    }, {} as Record<string, MarketDataWithOriginal>);
  }
);

const MarketScreen = () => {
  const dispatch = useDispatch();
  const { inventory, cash, inventorySpace } = useSelector((state: RootState) => state.player);
  const location = useSelector(selectLocation);
  const adultMode = useSelector(selectAdultMode);
  const prices = useSelector(selectPricesForLocation);
  
  const [quantity, setQuantity] = useState(1);

  // Memoize market items calculation with proper typing
  const marketItems = useMemo(() => {
    const items = new Map<string, MarketDataWithOriginal>();
    
    // Add market prices
    Object.entries(prices).forEach(([drug, market]) => {
      const originalDrug = adultMode ? drug : market.originalName || drug;
      const owned = inventory.find(item => item.name === originalDrug)?.quantity || 0;
      items.set(drug, { ...market, owned: owned });
    });

    // Add inventory items that aren't in the market
    inventory.forEach(item => {
      const displayName = adultMode ? item.name : DRUG_MAPPINGS[item.name] || item.name;
      if (!items.has(displayName)) {
        items.set(displayName, {
          price: 0,
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
      .find(([, censored]) => censored === drug)?.[0] || drug;
    dispatch(buyDrug({ drug: originalDrug, quantity, price }));
  };

  const handleSell = (drug: string, price: number) => {
    const originalDrug = adultMode ? drug : Object.entries(DRUG_MAPPINGS)
      .find(([, censored]) => censored === drug)?.[0] || drug;
    dispatch(sellDrug({ drug: originalDrug, quantity, price }));
  };

  const calculateMaxQuantity = (price: number, owned = 0, isBuy: boolean): number => {
    if (isBuy) {
      const maxBySpace = inventorySpace - inventory.reduce((acc, item) => acc + item.quantity, 0);
      const maxByCash = Math.floor(cash / price);
      return Math.max(0, Math.min(maxBySpace, maxByCash));
    } else {
      return owned;
    }
  };

  const getQuickBuyOptions = (price: number, owned: number, isBuy: boolean): number[] => {
    const max = calculateMaxQuantity(price, owned, isBuy);
    if (max <= 0) return [];
    
    const options: number[] = [];
    // Add options for 25%, 50%, 75%, and 100% of max
    for (let i = 1; i <= 4; i++) {
      const amount = Math.floor(max * (i / 4));
      if (amount > 0 && !options.includes(amount)) {
        options.push(amount);
      }
    }
    return options;
  };

  return (
    <div className="market-screen">
      <h2>Market in {location}</h2>
      
      {/* Enhanced quantity controls */}
      <div className="quantity-controls">
        <button 
          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
          className="quantity-button"
        >-</button>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => {
            const newValue = Math.max(1, parseInt(e.target.value) || 1);
            setQuantity(newValue);
          }}
          className="quantity-input"
        />
        <button 
          onClick={() => setQuantity(prev => prev + 1)}
          className="quantity-button"
        >+</button>
        <button
          onClick={() => {
            const maxAmount = Math.max(...marketItems.map(([_, market]) => 
              calculateMaxQuantity(market.price, market.owned, true)
            ));
            setQuantity(maxAmount);
          }}
          className="quantity-button max-button"
        >Max</button>
      </div>

      {/* Add inventory summary */}
      <div className="inventory-summary">
        <span>Space: {inventory.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0)} / {inventorySpace}</span>
        <span>Cash: ${cash}</span>
      </div>

      <div className="market-list">
        {marketItems.map(([drug, market]) => {
          const { price, owned } = market;
          const maxBuyQuantity = calculateMaxQuantity(price, owned, true);
          const maxSellQuantity = calculateMaxQuantity(price, owned, false);
          const canBuy = price > 0 && maxBuyQuantity > 0;
          const canSell = maxSellQuantity > 0;

          const buyOptions = getQuickBuyOptions(price, owned, true);
          const sellOptions = getQuickBuyOptions(price, owned, false);

          return (
            <div key={drug} className="market-item">
              <div className="drug-info">
                <h3 className="drug-name">{drug}</h3>
                <div className="drug-stats">
                  <span className="drug-price">
                    {price > 0 ? `$${price}` : 'Not available'}
                  </span>
                  <span className="drug-owned">Owned: {owned}</span>
                  {price > 0 && (
                    <>
                      <div className="stat-indicator">
                        <span>S:</span>
                        <div className="stat-bar">
                          <div 
                            className="stat-bar-fill" 
                            style={{ width: `${market.supply}%` }} 
                          />
                        </div>
                      </div>
                      <div className="stat-indicator">
                        <span>D:</span>
                        <div className="stat-bar">
                          <div 
                            className="stat-bar-fill" 
                            style={{ width: `${market.demand}%` }} 
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="drug-actions">
                {canBuy && (
                  <div className="quick-actions">
                    {buyOptions.map(amount => (
                      <button
                        key={`buy-${amount}`}
                        onClick={() => {
                          setQuantity(amount);
                          handleBuy(drug, price);
                        }}
                        className="quick-action-button"
                      >
                        Buy {amount}
                      </button>
                    ))}
                  </div>
                )}
                {canSell && (
                  <div className="quick-actions">
                    {sellOptions.map(amount => (
                      <button
                        key={`sell-${amount}`}
                        onClick={() => {
                          setQuantity(amount);
                          handleSell(drug, price);
                        }}
                        className="quick-action-button"
                      >
                        Sell {amount}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketScreen; 