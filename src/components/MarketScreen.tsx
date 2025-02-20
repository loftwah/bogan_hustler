import { useState, useMemo, useCallback } from "react";
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
  "Steroids": "Protein Bars",
  "Chop Chop": "Loose Leaf Tea",
  "Bootleg Spirits": "Craft Soda",
  "Black Market Vapes": "Essential Oils",
  "Counterfeit Cigs": "Herbal Cigarettes",
  "Moonshine": "Apple Juice",
  "Research Chems": "Dietary Supplements"
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

// Add these interfaces after the existing ones
interface MarketItemDetails {
  maxBuy: number;
  maxSell: number;
  totalCost: number;
  potentialProfit: number;
  potentialProfitPercent: string;
  supplyTrend: string;
  demandTrend: string;
  priceGuidance: string;
  nearbyComparison: string;
  buyAdvice: string;
}

interface InventoryItem {
  name: string;
  quantity: number;
}

// Add this helper function
const calculateMarketDetails = (
  price: number,
  owned: number,
  supply: number,
  demand: number,
  cash: number,
  inventorySpace: number,
  currentInventoryUsed: number,
  drugName: string,
  marketIntel: number,
  nearbyPrices?: Record<string, number>
): MarketItemDetails => {
  const spaceLeft = inventorySpace - currentInventoryUsed;
  const maxBuyBySpace = spaceLeft;
  const maxBuyByCash = Math.floor(cash / price);
  const maxBuy = Math.min(maxBuyBySpace, maxBuyByCash);
  
  const maxSell = owned;
  const totalCost = maxBuy * price;
  const potentialProfit = maxSell * price;
  
  const supplyTrend = supply > 75 ? "High Supply - Prices Dropping" 
    : supply < 25 ? "Low Supply - Prices Rising"
    : "Stable Supply";
    
  const demandTrend = demand > 75 ? "High Demand - Prices Rising"
    : demand < 25 ? "Low Demand - Prices Dropping"
    : "Stable Demand";

  const priceGuidance = getPriceGuidance(price, marketIntel, drugName);
  
  let nearbyComparison = "";
  if (nearbyPrices && Object.keys(nearbyPrices).length > 0) {
    const avgNearbyPrice = Object.values(nearbyPrices).reduce((a, b) => a + b, 0) / Object.values(nearbyPrices).length;
    const priceDiff = ((price - avgNearbyPrice) / avgNearbyPrice * 100).toFixed(1);
    nearbyComparison = `${Number(priceDiff) > 0 ? '📈' : '📉'} ${Math.abs(Number(priceDiff))}% vs nearby`;
  }

  const potentialProfitPercent = price > 0 ? ((potentialProfit - (owned * price)) / (owned * price) * 100).toFixed(1) : '0';
  
  const buyAdvice = (() => {
    if (price <= 0) return "Not available for purchase";
    if (maxBuy <= 0) return "Can't buy - no space or cash";
    if (supply < 25 && demand > 75) return "⭐ Hot Deal! High demand, low supply";
    if (supply > 75 && demand < 25) return "⚠️ Risky Buy - High supply, low demand";
    if (Number(potentialProfitPercent) > 50) return "💎 High profit potential!";
    return "📊 Average market conditions";
  })();

  return {
    maxBuy,
    maxSell,
    totalCost,
    potentialProfit,
    potentialProfitPercent: `${potentialProfitPercent}%`,
    supplyTrend,
    demandTrend,
    priceGuidance,
    nearbyComparison,
    buyAdvice
  };
};

// Update the debounce function with proper typing
const debounce = <T extends (...args: any[]) => any>(fn: T, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

// Add this helper function near the top with other helpers
const getPriceGuidance = (price: number, marketIntel: number, drugName: string): string => {
  // These would ideally be moved to a config file and adjusted per drug
  const priceRanges: Record<string, [number, number]> = {
    "Ice": [50, 200],
    "Crack": [40, 180],
    // ... add ranges for other drugs
    "default": [30, 150]
  };

  const [lowPrice, highPrice] = priceRanges[drugName] || priceRanges.default;
  
  if (price <= lowPrice) return "Great Buy! 💰";
  if (price <= (lowPrice + highPrice) / 2) return "Decent Price 👍";
  if (price <= highPrice) return "High Price ⚠️";
  return "Very Expensive! ⛔";
};

const MarketScreen = () => {
  const dispatch = useDispatch();
  const { inventory, cash, inventorySpace, marketIntel } = useSelector((state: RootState) => state.player);
  const location = useSelector(selectLocation);
  const adultMode = useSelector(selectAdultMode);
  const prices = useSelector(selectPricesForLocation);
  
  const [quantity, setQuantity] = useState(1);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Add this near other state/refs
  const nearbyLocations = useMemo(() => {
    // This is a placeholder - you'll need to implement your own nearby locations logic
    return {
      [location]: {
        prices: {} as Record<string, number>
      }
    };
  }, [location]);

  // Update the market items calculation
  const marketItems = useMemo(() => {
    const items = new Map<string, MarketDataWithOriginal>();
    
    Object.entries(prices).forEach(([drug, market]) => {
      const originalDrug = adultMode ? drug : market.originalName || drug;
      const owned = inventory.find((item: InventoryItem) => item.name === originalDrug)?.quantity || 0;
      items.set(drug, { ...market, owned: owned });
    });

    inventory.forEach((item: InventoryItem) => {
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
  }, [prices, inventory, adultMode, location]);

  // Update the quantity input handler
  const handleQuantityChange = useCallback(
    debounce((value: string) => {
      const newValue = Math.max(1, parseInt(value) || 1);
      setQuantity(newValue);
    }, 150),
    []
  );

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

  // Update the max button click handler
  const handleMaxClick = () => {
    const maxAmount = Math.max(...marketItems.map(([, market]) => 
      calculateMaxQuantity(market.price, market.owned, true)
    ));
    setQuantity(maxAmount);
  };

  // Update calculateMaxQuantity
  const calculateMaxQuantity = (price: number, owned = 0, isBuy: boolean): number => {
    if (isBuy) {
      const maxBySpace = inventorySpace - inventory.reduce((acc: number, item: InventoryItem) => acc + item.quantity, 0);
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
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="quantity-input"
        />
        <button 
          onClick={() => setQuantity(prev => prev + 1)}
          className="quantity-button"
        >+</button>
        <button
          onClick={handleMaxClick}
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
          const { price, owned, supply, demand } = market;
          const isExpanded = expandedItems.has(drug);
          const details = calculateMarketDetails(
            price,
            owned,
            supply,
            demand,
            cash,
            inventorySpace,
            inventory.reduce((acc, item) => acc + item.quantity, 0),
            drug,
            marketIntel,
            nearbyLocations[location]?.prices?.[drug]
          );

          return (
            <div key={drug} className={`market-item ${price === 0 ? 'unavailable' : ''}`}>
              <div className="market-item-header">
                <div className="drug-info">
                  <h3 className="drug-name">{drug}</h3>
                  <div className="drug-stats">
                    <span className="drug-price" data-price={price}>
                      {price > 0 ? `$${price}` : 'Not available'}
                    </span>
                    <span className="drug-owned">Owned: {owned}</span>
                  </div>
                </div>
                <button
                  className="expand-button"
                  onClick={() => {
                    const newExpanded = new Set(expandedItems);
                    if (isExpanded) {
                      newExpanded.delete(drug);
                    } else {
                      newExpanded.add(drug);
                    }
                    setExpandedItems(newExpanded);
                  }}
                  aria-expanded={isExpanded}
                  aria-controls={`details-${drug}`}
                >
                  {isExpanded ? 'Less Info' : 'More Info'}
                </button>
              </div>

              <div className="market-item-content">
                {isExpanded && (
                  <div 
                    id={`details-${drug}`}
                    className="market-item-details"
                    role="region"
                    aria-label={`Details for ${drug}`}
                  >
                    <div className="market-stats">
                      <div className="market-stat highlight">
                        <span className="market-stat-label">Price Analysis</span>
                        <span className="market-stat-value">{details.priceGuidance}</span>
                        {details.nearbyComparison && (
                          <span className="market-stat-subvalue">{details.nearbyComparison}</span>
                        )}
                      </div>
                      <div className="market-stat highlight">
                        <span className="market-stat-label">Buy Advice</span>
                        <span className="market-stat-value">{details.buyAdvice}</span>
                      </div>
                      <div className="market-stat">
                        <span className="market-stat-label">Potential Profit</span>
                        <span className="market-stat-value">${details.potentialProfit}</span>
                        <span className="market-stat-subvalue">({details.potentialProfitPercent} return)</span>
                      </div>
                      <div className="market-stat">
                        <span className="market-stat-label">Max Buy Amount</span>
                        <span className="market-stat-value">{details.maxBuy}</span>
                      </div>
                      <div className="market-stat">
                        <span className="market-stat-label">Max Sell Amount</span>
                        <span className="market-stat-value">{details.maxSell}</span>
                      </div>
                      <div className="market-stat">
                        <span className="market-stat-label">Cost to Max Buy</span>
                        <span className="market-stat-value">${details.totalCost}</span>
                      </div>
                      <div className="market-stat">
                        <span className="market-stat-label">Supply Trend</span>
                        <span className="market-stat-value">{details.supplyTrend}</span>
                      </div>
                      <div className="market-stat">
                        <span className="market-stat-label">Demand Trend</span>
                        <span className="market-stat-value">{details.demandTrend}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="drug-actions">
                  {price > 0 && (
                    <div className="quick-actions">
                      {getQuickBuyOptions(price, owned, true).map(amount => (
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
                  {owned > 0 && price >= 0 && (
                    <div className="quick-actions">
                      {getQuickBuyOptions(price, owned, false).map(amount => (
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketScreen; 