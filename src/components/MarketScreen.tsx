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
  
  const supplyTrend = (() => {
    if (marketIntel < 25) return "Unknown supply levels";
    if (supply > 75) return "High Supply - Prices Dropping 📉"; 
    if (supply < 25) return "Low Supply - Prices Rising 📈";
    return "Stable Supply";
  })();
    
  const demandTrend = (() => {
    if (marketIntel < 25) return "Unknown demand levels";
    if (demand > 75) return "High Demand - Prices Rising 📈";
    if (demand < 25) return "Low Demand - Prices Dropping 📉";
    return "Stable Demand";
  })();

  const priceGuidance = getPriceGuidance(price, marketIntel, drugName);
  
  let nearbyComparison = "";
  if (nearbyPrices && Object.keys(nearbyPrices).length > 0) {
    const avgNearbyPrice = Object.values(nearbyPrices).reduce((a, b) => a + b, 0) / Object.values(nearbyPrices).length;
    const priceDiff = ((price - avgNearbyPrice) / avgNearbyPrice * 100).toFixed(1);
    nearbyComparison = `${Number(priceDiff) > 0 ? '📈' : '📉'} ${Math.abs(Number(priceDiff))}% vs nearby`;
  }

  const potentialProfitPercent = (() => {
    if (price <= 0 || owned <= 0) return '0';
    const buyValue = owned * price;
    const sellValue = potentialProfit;
    const profit = sellValue - buyValue;
    return (profit / buyValue * 100).toFixed(1);
  })();
  
  const buyAdvice = (() => {
    if (marketIntel < 25) return "Need more market intel";
    if (price <= 0) return "Not available for purchase";
    if (maxBuy <= 0) return "Can't buy - no space or cash";
    if (supply < 25 && demand > 75) return "⭐ Hot Deal! High demand, low supply";
    if (supply > 75 && demand < 25) return "⚠️ Risky Buy - High supply, low demand";
    if (Number(potentialProfitPercent) > 50) return "💎 High profit potential!";
    if (supply < 40 && demand > 60) return "👍 Good conditions to buy";
    if (supply > 60 && demand < 40) return "👎 Poor conditions to buy";
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

// Fix debounce to handle string input specifically
const debounce = <T extends (value: string) => void>(fn: T, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: unknown, value: string) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.call(this, value), ms);
  };
};

// Update the getPriceGuidance function
const getPriceGuidance = (price: number, marketIntel: number, drugName: string): string => {
  // Base guidance without market intel
  let guidance = "Unknown market conditions";
  
  // More detailed guidance based on market intel level
  if (marketIntel > 0) {
    if (price < 100) guidance = "Prices are very low";
    else if (price < 200) guidance = "Prices are low";
    else if (price < 400) guidance = "Prices are average";
    else if (price < 600) guidance = "Prices are high";
    else guidance = "Prices are very high";
  }
  
  if (marketIntel > 50) {
    // Add more detailed guidance for higher intel levels
    guidance += ` for ${drugName}`;
  }

  if (marketIntel > 75) {
    // Add even more detailed guidance for very high intel
    if (price < 100) guidance += " - Great time to buy!";
    else if (price > 500) guidance += " - Consider selling!";
  }
  
  return guidance;
};

const MarketScreen = () => {
  const dispatch = useDispatch();
  const { inventory, cash, inventorySpace, marketIntel } = useSelector((state: RootState) => state.player);
  const location = useSelector(selectLocation);
  const adultMode = useSelector(selectAdultMode);
  const prices = useSelector(selectPricesForLocation);
  
  const [quantity, setQuantity] = useState(1);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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

  const getQuickBuyOptions = (price: number, owned: number, isBuy: boolean): { amount: number; label: string; totalValue: number; spacePercent: number }[] => {
    const options: { amount: number; label: string; totalValue: number; spacePercent: number }[] = [];
    
    if (isBuy) {
      // Calculate max possible buy amount
      const maxBySpace = inventorySpace - inventory.reduce((acc, item) => acc + item.quantity, 0);
      const maxByCash = Math.floor(cash / price);
      const maxBuy = Math.min(maxBySpace, maxByCash);

      // Fixed quantities
      [1, 5, 10, 25, 50].forEach(qty => {
        if (qty <= maxBuy) {
          options.push({
            amount: qty,
            label: `Buy ${qty}`,
            totalValue: qty * price,
            spacePercent: (qty / inventorySpace) * 100
          });
        }
      });

      // Percentage-based options
      [0.25, 0.5, 0.75, 1].forEach(percent => {
        const qty = Math.floor(maxBuy * percent);
        if (qty > 0 && !options.some(opt => opt.amount === qty)) {
          options.push({
            amount: qty,
            label: `${(percent * 100)}%`,
            totalValue: qty * price,
            spacePercent: (qty / inventorySpace) * 100
          });
        }
      });
    } else {
      // Selling options
      if (owned <= 0) return options;

      // Fixed quantities
      [1, 5, 10, 25, 50].forEach(qty => {
        if (qty <= owned) {
          options.push({
            amount: qty,
            label: `Sell ${qty}`,
            totalValue: qty * price,
            spacePercent: (qty / owned) * 100
          });
        }
      });

      // Percentage-based options
      [0.25, 0.5, 0.75, 1].forEach(percent => {
        const qty = Math.floor(owned * percent);
        if (qty > 0 && !options.some(opt => opt.amount === qty)) {
          options.push({
            amount: qty,
            label: `${(percent * 100)}%`,
            totalValue: qty * price,
            spacePercent: (qty / owned) * 100
          });
        }
      });
    }

    return options;
  };

  return (
    <div className="market-screen">
      <h2>Market in {location}</h2>
      
      <div className="quantity-controls">
        <button 
          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
          className="quantity-button"
          aria-label="Decrease quantity"
        >-</button>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="quantity-input"
          aria-label="Quantity"
        />
        <button 
          onClick={() => setQuantity(prev => prev + 1)}
          className="quantity-button"
          aria-label="Increase quantity"
        >+</button>
        <button
          onClick={handleMaxClick}
          className="quantity-button"
          aria-label="Set maximum quantity"
        >Max</button>
      </div>

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
            undefined // We'll implement proper nearby location price comparison later
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
                  {isExpanded ? '▼' : '▶'}
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

                <div className="quick-actions">
                  {price > 0 && (
                    <div className="action-section">
                      <div className="primary-actions">
                        <button
                          onClick={() => handleBuy(drug, price)}
                          disabled={quantity * price > cash || quantity + owned > inventorySpace}
                          className="quick-action-button buy-button"
                          aria-label={`Buy ${quantity} ${drug}`}
                        >
                          Buy {quantity}
                        </button>
                        {owned > 0 && (
                          <button
                            onClick={() => handleSell(drug, price)}
                            disabled={quantity > owned}
                            className="quick-action-button sell-button"
                            aria-label={`Sell ${quantity} ${drug}`}
                          >
                            Sell {quantity}
                          </button>
                        )}
                      </div>
                      
                      <div className="percentage-actions">
                        <div className="buy-options">
                          {getQuickBuyOptions(price, owned, true).map(option => (
                            <button
                              key={`buy-${option.amount}`}
                              onClick={() => {
                                setQuantity(option.amount);
                                handleBuy(drug, price);
                              }}
                              className="quick-action-button percentage-button buy"
                              disabled={option.totalValue > cash || option.amount + owned > inventorySpace}
                              title={`Buy ${option.amount} for $${option.totalValue.toFixed(2)}`}
                            >
                              {option.label}
                              <span className="action-value">${option.totalValue.toFixed(0)}</span>
                            </button>
                          ))}
                        </div>
                        
                        {owned > 0 && (
                          <div className="sell-options">
                            {getQuickBuyOptions(price, owned, false).map(option => (
                              <button
                                key={`sell-${option.amount}`}
                                onClick={() => {
                                  setQuantity(option.amount);
                                  handleSell(drug, price);
                                }}
                                className="quick-action-button percentage-button sell"
                                disabled={option.amount > owned}
                                title={`Sell ${option.amount} for $${option.totalValue.toFixed(2)}`}
                              >
                                {option.label}
                                <span className="action-value">${option.totalValue.toFixed(0)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
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