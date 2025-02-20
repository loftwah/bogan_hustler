import { useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { buyDrug, sellDrug } from "../store/playerSlice";
import { RootState } from "../store/store";
import type { DrugMarket } from "../store/marketSlice";
import { adjustMarket } from "../store/marketSlice";

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

// Add this interface near the top with other interfaces
interface QuickBuyOption {
  amount: number;
  label: string;
  totalValue: number;
  spacePercent: number;
}

// Add this helper function
export const calculateMarketDetails = (
  price: number,
  owned: number,
  supply: number,
  demand: number,
  cash: number,
  inventorySpace: number,
  currentInventoryUsed: number,
  drugName: string,
  marketIntel: number,
  nearbyPrices: Record<string, number>
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
export const getPriceGuidance = (price: number, marketIntel: number, drugName: string): string => {
  const baseMessage = "Prices are very low";
  if (marketIntel > 50) {
    return `${baseMessage} for ${drugName} - Great time to buy!`;
  }
  return baseMessage;
};

// Add these helper functions at the top of the file
const calculateMaxQuantity = (
  price: number,
  owned: number,
  isBuy: boolean,
  cash: number,
  inventorySpace: number,
  currentInventoryUsed: number
) => {
  if (isBuy) {
    const maxBySpace = inventorySpace - currentInventoryUsed;
    const maxByCash = Math.floor(cash / price);
    return Math.max(0, Math.min(maxBySpace, maxByCash));
  } else {
    return owned;
  }
};

// Add this near your other imports
const DEBUG = true;

const logTransaction = (type: 'buy' | 'sell', drug: string, quantity: number, price: number, success: boolean) => {
  if (DEBUG) {
    console.log(`Transaction ${success ? 'SUCCESS' : 'FAILED'}: ${type} ${quantity} ${drug} at $${price}`);
  }
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

  // Update the handleBuy function
  const handleBuy = (drug: string, price: number) => {
    try {
      const originalDrug = adultMode ? drug : Object.entries(DRUG_MAPPINGS)
        .find(([, censored]) => censored === drug)?.[0] || drug;
      
      const currentInventoryUsed = inventory.reduce((acc, item) => acc + item.quantity, 0);
      const maxBySpace = inventorySpace - currentInventoryUsed;
      const maxByCash = Math.floor(cash / price);
      const maxBuy = Math.min(maxBySpace, maxByCash);
      
      const finalQuantity = Math.min(quantity, maxBuy);
      
      // Add inventory space check
      const totalAfterPurchase = currentInventoryUsed + finalQuantity;
      if (finalQuantity <= 0 || totalAfterPurchase > inventorySpace) {
        logTransaction('buy', originalDrug, finalQuantity, price, false);
        return;
      }

      dispatch(buyDrug({ drug: originalDrug, quantity: finalQuantity, price }));
      dispatch(adjustMarket({ location, item: originalDrug, quantity: finalQuantity, isBuy: true }));
      logTransaction('buy', originalDrug, finalQuantity, price, true);
    } catch (error) {
      console.error('Buy transaction failed:', error);
    }
  };

  const handleSell = (drug: string, price: number) => {
    try {
      // Convert display name back to original name if in non-adult mode
      const originalDrug = adultMode ? drug : Object.entries(DRUG_MAPPINGS)
        .find(([, censored]) => censored === drug)?.[0] || drug;
      
      const drugItem = inventory.find(item => item.name === originalDrug);
      if (!drugItem || quantity <= 0 || quantity > drugItem.quantity) {
        logTransaction('sell', originalDrug, quantity, price, false);
        return;
      }

      dispatch(sellDrug({ drug: originalDrug, quantity, price }));
      dispatch(adjustMarket({ location, item: originalDrug, quantity, isBuy: false }));
      logTransaction('sell', originalDrug, quantity, price, true);
    } catch (error) {
      console.error('Sell transaction failed:', error);
    }
  };

  // Update the handleMaxClick function
  const handleMaxClick = () => {
    const currentInventoryUsed = inventory.reduce((acc, item) => acc + item.quantity, 0);
    const maxBySpace = inventorySpace - currentInventoryUsed;
    const maxByCash = Math.floor(cash / Math.max(...marketItems.map(([, market]) => market.price)));
    const maxAmount = Math.max(1, Math.min(maxBySpace, maxByCash));
    setQuantity(maxAmount);
  };

  // Update the getQuickBuyOptions function with proper typing
  const getQuickBuyOptions = (price: number, owned: number, isBuy: boolean): QuickBuyOption[] => {
    const currentInventoryUsed = inventory.reduce((acc, item) => acc + item.quantity, 0);
    const options: QuickBuyOption[] = [];
    
    if (isBuy) {
      const maxBySpace = inventorySpace - currentInventoryUsed;
      const maxByCash = Math.floor(cash / price);
      const maxBuy = Math.min(maxBySpace, maxByCash);

      // Add options with proper space checks
      [1, 5, 10, 25, 50].forEach(qty => {
        if (currentInventoryUsed + qty <= inventorySpace) {
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
        if (qty > 0 && currentInventoryUsed + qty <= inventorySpace && 
            !options.some(opt => opt.amount === qty)) {
          options.push({
            amount: qty,
            label: `${(percent * 100)}%`,
            totalValue: qty * price,
            spacePercent: (qty / inventorySpace) * 100
          });
        }
      });
    } else {
      // Selling options - show all options
      [1, 5, 10, 25, 50].forEach(qty => {
        options.push({
          amount: qty,
          label: `Sell ${qty}`,
          totalValue: qty * price,
          spacePercent: owned > 0 ? (qty / owned) * 100 : 0
        });
      });

      // Percentage-based options
      [0.25, 0.5, 0.75, 1].forEach(percent => {
        const qty = Math.max(1, Math.floor(owned * percent));
        if (!options.some(opt => opt.amount === qty)) {
          options.push({
            amount: qty,
            label: `${(percent * 100)}%`,
            totalValue: qty * price,
            spacePercent: owned > 0 ? (qty / owned) * 100 : 0
          });
        }
      });
    }

    return options.sort((a, b) => a.amount - b.amount);
  };

  return (
    <div className="p-2 sm:p-4 pb-24 space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold">Market in {location}</h2>
      
      <div className="quantity-controls flex items-center gap-1 sm:gap-2">
        <button 
          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
          className="btn btn-surface p-2 sm:px-4"
          aria-label="Decrease quantity"
        >-</button>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="w-16 sm:w-20 text-center text-sm sm:text-base"
          aria-label="Quantity"
        />
        <button 
          onClick={() => setQuantity(prev => prev + 1)}
          className="btn btn-surface p-2 sm:px-4"
          aria-label="Increase quantity"
        >+</button>
        <button
          onClick={handleMaxClick}
          className="btn btn-primary px-2 sm:px-4 text-sm sm:text-base"
          aria-label="Set maximum quantity"
        >Max</button>
      </div>

      <div className="flex justify-between text-xs sm:text-sm mb-2 sm:mb-4">
        <span>Space: {inventory.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0)} / {inventorySpace}</span>
        <span>Cash: ${cash}</span>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {marketItems.map(([drug, market]) => {
          const { price, owned, supply, demand } = market;
          const isExpanded = expandedItems.has(drug);
          const details = calculateMarketDetails(
            price, owned, supply, demand, cash, inventorySpace,
            0,
            drug, marketIntel, {}
          );

          return (
            <div key={drug} className={`card p-3 sm:p-4 ${price === 0 ? 'opacity-50' : ''}`}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold">{drug}</h3>
                  <div className="flex gap-2 sm:gap-4 text-xs sm:text-sm">
                    <span>{price > 0 ? `$${price}` : 'Not available'}</span>
                    <span>Owned: {owned}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    className="p-1.5 sm:p-2 hover:text-primary transition-colors"
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
              </div>

              {/* Replace the new buttons section with this improved version */}
              {price > 0 && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleBuy(drug, price)}
                    disabled={!calculateMaxQuantity(price, owned, true, cash, inventorySpace, 0) || quantity <= 0}
                    className="btn btn-surface flex-1 text-sm hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-surface disabled:hover:text-text"
                  >
                    Buy {quantity}
                  </button>
                  <button
                    onClick={() => handleSell(drug, price)}
                    disabled={quantity > owned || quantity <= 0}
                    className="btn btn-surface flex-1 text-sm hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-surface disabled:hover:text-text"
                  >
                    Sell {quantity}
                  </button>
                </div>
              )}

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                  {/* Market Stats */}
                  <div className="grid grid-cols-1 gap-2 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-background rounded-md">
                      <div className="text-sm sm:text-base font-medium mb-1">Price Analysis</div>
                      <div className="text-xs sm:text-sm">{details.priceGuidance}</div>
                      {details.nearbyComparison && (
                        <div className="text-xs sm:text-sm text-gray-400">{details.nearbyComparison}</div>
                      )}
                    </div>
                    
                    <div className="p-2 sm:p-3 bg-background rounded-md">
                      <div className="text-sm sm:text-base font-medium mb-1">Buy Advice</div>
                      <div className="text-xs sm:text-sm">{details.buyAdvice}</div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {price > 0 && (
                    <div className="space-y-2">
                      {/* Quick Buy/Sell Options */}
                      <div className="grid grid-cols-2 gap-1 sm:gap-2">
                        {/* Quick Buy Options */}
                        <div className="space-y-1 sm:space-y-2">
                          {getQuickBuyOptions(price, owned, true).map(option => (
                            <button
                              key={`buy-${option.amount}`}
                              onClick={() => {
                                // Don't set quantity and handle buy separately - just dispatch directly
                                const originalDrug = adultMode ? drug : Object.entries(DRUG_MAPPINGS)
                                  .find(([, censored]) => censored === drug)?.[0] || drug;
                                
                                dispatch(buyDrug({ drug: originalDrug, quantity: option.amount, price }));
                                dispatch(adjustMarket({ location, item: originalDrug, quantity: option.amount, isBuy: true }));
                              }}
                              className="btn w-full text-xs sm:text-sm py-1.5 sm:py-2 bg-green-800 hover:bg-green-700 text-white disabled:opacity-30 disabled:bg-green-900"
                              disabled={option.totalValue > cash || option.amount + currentInventoryUsed > inventorySpace}
                            >
                              {option.label}
                              <span className="text-green-300 ml-1 sm:ml-2">${option.totalValue.toFixed(0)}</span>
                            </button>
                          ))}
                        </div>

                        {/* Quick Sell Options */}
                        <div className="space-y-1 sm:space-y-2">
                          {getQuickBuyOptions(price, owned, false).map(option => {
                            const originalDrug = adultMode ? drug : Object.entries(DRUG_MAPPINGS)
                              .find(([, censored]) => censored === drug)?.[0] || drug;
                            
                            return (
                              <button
                                key={`sell-${option.amount}`}
                                onClick={() => handleSell(drug, price)}
                                className="btn w-full text-xs sm:text-sm py-1.5 sm:py-2 bg-red-800 hover:bg-red-700 text-white disabled:opacity-30 disabled:bg-red-900"
                                disabled={!owned || option.amount > owned}
                              >
                                {option.label}
                                <span className="text-red-300 ml-1 sm:ml-2">${option.totalValue.toFixed(0)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketScreen; 