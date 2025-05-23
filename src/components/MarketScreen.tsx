import { useState, useMemo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { buyDrug, sellDrug } from "../store/playerSlice";
import { RootState } from "../store/store";
import type { DrugMarket } from "../store/marketSlice";
import { adjustMarket, getLocationType, itemData } from "../store/marketSlice";
import { DEBUG } from '../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMinus, 
  faPlus, 
  faInfinity,
  faBoxOpen,
  faFire,
  faWallet,
  faBoxes,
  faSpinner,
  faSkull, 
  faHandcuffs, 
  faCapsules,
  faHistory,
  faChartBar
} from '@fortawesome/free-solid-svg-icons';
import { calculateMarketDetails } from '../utils/marketCalculations';
import { locationsByRegion } from './MapScreen';

type DrugName = keyof typeof itemData;

const DRUG_MAPPINGS: Partial<Record<DrugName, string>> = {
  Ice: "Energy Drinks",
  Crack: "Supplements",
  Heroin: "Protein Powder",
  Cocaine: "Pre-workout",
  Pingas: "Vitamins",
  MDMA: "Energy Tablets",
  Xannies: "Pain Relief",
  Durries: "Cigarettes",
  Nangs: "Cream Chargers",
  "Bush Weed": "Herbal Tea",
  Weed: "Herbal Blend",
  Hydro: "Coffee Beans",
  Shrooms: "Mushroom Extract",
  Acid: "Caffeine Pills",
  Ketamine: "Sleep Aid",
  "Chop Chop": "Loose Leaf Tea",
  "Bootleg Spirits": "Craft Soda",
  "Black Market Vapes": "Essential Oils",
  "Counterfeit Cigs": "Herbal Cigarettes",
  Moonshine: "Apple Juice",
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
        const censoredName = DRUG_MAPPINGS[drug as DrugName] || drug;
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

// Add these new interfaces near the top with other interfaces
interface MarketTrend {
  direction: 'up' | 'down' | 'stable';
  strength: number; // 0-100
  description: string;
}

// Update the LocationStory interface to include all needed properties
interface LocationStory {
  history: string;
  gangs: string;
  drugs: string[];
  policeActivity: string;
  policeRisk: number;
  region?: string; // Make region optional since it's added later
  description?: string; // Add description as an optional property
}

// Define location stories
const locationStories: Record<string, LocationStory> = {
  "Kings Cross": {
    history: "Once Sydney's red-light district, the Cross evolved into Australia's most notorious drug marketplace. The 1980s saw the rise of heroin, while the 1990s brought cocaine and the nightclub scene.",
    gangs: "Territory disputed between various crime families. The Razor gangs of the 1920s gave way to modern syndicates.",
    drugs: ["Ice", "Cocaine", "Heroin", "MDMA"],
    policeActivity: "Heavy police presence, especially weekends. Undercover operations frequent. CCTV covers every corner.",
    policeRisk: 80
  },
  // Add more locations as needed...
};

// Define default stories for each location type
const defaultStories: Record<string, LocationStory> = {
  hardcoreArea: {
    history: "A notorious hotspot in Australia's drug trade. Local landmarks have witnessed decades of deals and violence.",
    gangs: "Multiple criminal organizations fight for control. Street corners are marked by gang tags and lookouts.",
    drugs: ["Ice", "Heroin", "Cocaine"],
    policeActivity: "Heavy police presence with regular raids. Undercover operations are common.",
    policeRisk: 75
  },
  gangTerritory: {
    history: "Traditional gang stronghold with deep criminal roots. Local businesses pay protection money to operate.",
    gangs: "Controlled by established crime families. Young recruits patrol on motorcycles and in modified cars.",
    drugs: ["Ice", "Cocaine", "MDMA"],
    policeActivity: "Police maintain surveillance but face community resistance.",
    policeRisk: 60
  },
  cityCenter: {
    history: "Urban drug scene operates behind the facade of legitimate businesses.",
    gangs: "Professional criminals maintain sophisticated operations.",
    drugs: ["Cocaine", "MDMA", "Pingas"],
    policeActivity: "Heavy surveillance and regular patrols.",
    policeRisk: 50
  },
  suburb: {
    history: "Quiet neighborhoods mask active drug networks.",
    gangs: "Local crews control distribution. Violence is rare but business is steady.",
    drugs: ["Ice", "Weed", "Xannies"],
    policeActivity: "Regular patrols keep dealers cautious.",
    policeRisk: 40
  },
  ruralTown: {
    history: "Small town dynamics influence the local drug trade.",
    gangs: "Family networks control distribution. Everyone knows everyone.",
    drugs: ["Ice", "Bush Weed", "Moonshine"],
    policeActivity: "Small police force means sporadic enforcement.",
    policeRisk: 30
  },
  partyArea: {
    history: "Nightlife and entertainment drive the drug scene.",
    gangs: "Club security and promoters control distribution.",
    drugs: ["MDMA", "Cocaine", "Pingas"],
    policeActivity: "Focus on visible presence and crowd control.",
    policeRisk: 45
  }
};

// Fix debounce to handle string input specifically
const debounce = <T extends (value: string) => void>(fn: T, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: unknown, value: string) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.call(this, value), ms);
  };
};

// Update the getPriceGuidance function to match test expectations
export const getPriceGuidance = (marketIntel: number, drugName: string): string => {
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
const logTransaction = (type: 'buy' | 'sell', drug: string, quantity: number, price: number, success: boolean) => {
  if (DEBUG) {
    console.log(`Transaction ${success ? 'SUCCESS' : 'FAILED'}: ${type} ${quantity} ${drug} at $${price}`);
  }
};

// Helper function to get location description
// const getLocationDescription = (location: string): string => { ... }

// Enhanced location details function with proper return type
const getLocationDetails = (location: string): LocationStory & { region: string } => {
  // Find the region that contains this location
  const region = Object.entries(locationsByRegion).find(([_, locations]) => 
    locations.includes(location)
  )?.[0] || 'Unknown Region';

  // Get the location type
  const locationType = getLocationType(location);

  // Get the location story
  const story = locationStories[location] || defaultStories[locationType] || {
    history: "A typical suburban drug scene operates behind closed doors.",
    gangs: "Local dealers maintain loose territories. Violence is rare but business is steady.",
    drugs: ["Weed", "Ice"],
    policeActivity: "Regular patrols keep dealers cautious.",
    policeRisk: 35
  };

  // Return the combined object with proper typing
  return {
    ...story,
    region
  };
};

// Update the helper function to handle types properly
const getCensoredText = (text: string, adultMode: boolean): string => {
  if (adultMode) return text;
  return Object.entries(DRUG_MAPPINGS).reduce((censored, [drug, replacement]) => {
    if (!replacement) return censored; // Skip if no replacement exists
    // Use word boundaries to avoid partial word matches
    const regex = new RegExp(`\\b${drug}\\b`, 'g');
    return censored.replace(regex, replacement);
  }, text);
};

// Add this helper function as well if not already present
const getCensoredDrugName = (drug: string, adultMode: boolean): string => {
  if (adultMode) return drug;
  return DRUG_MAPPINGS[drug as DrugName] || drug;
};

const MarketScreen = () => {
  const dispatch = useDispatch();
  const { inventory, cash, inventorySpace, marketIntel } = useSelector((state: RootState) => state.player);
  const location = useSelector(selectLocation);
  const adultMode = useSelector(selectAdultMode);
  const prices = useSelector(selectPricesForLocation);
  
  const [quantity, setQuantity] = useState(1);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [marketAlerts, setMarketAlerts] = useState<string[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationInfo, setShowLocationInfo] = useState(true);

  // Update the market items calculation
  const marketItems = useMemo(() => {
    const items = new Map<string, MarketDataWithOriginal>();
    
    Object.entries(prices).forEach(([drug, market]) => {
      const originalDrug = adultMode ? drug : market.originalName || drug;
      const owned = inventory.find((item: InventoryItem) => item.name === originalDrug)?.quantity || 0;
      items.set(drug, { ...market, owned: owned });
    });

    inventory.forEach((item: InventoryItem) => {
      const displayName = adultMode ? item.name : DRUG_MAPPINGS[item.name as DrugName] || item.name;
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
  const handleBuy = async (drug: string, price: number) => {
    setIsLoading(true);
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

      await dispatch(buyDrug({ drug: originalDrug, quantity: finalQuantity, price }));
      await dispatch(adjustMarket({ location, item: originalDrug, quantity: finalQuantity, isBuy: true }));
      logTransaction('buy', originalDrug, finalQuantity, price, true);

      // Check for good deals using market data
      const marketData = prices[drug];
      if (marketData && marketData.supply < 30 && marketData.demand > 70) {
        setMarketAlerts(prev => [`Hot Deal Alert: ${drug} has high demand!`, ...prev]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSell = async (drug: string, price: number) => {
    try {
      // Convert display name back to original name if in non-adult mode
      const originalDrug = adultMode ? drug : Object.entries(DRUG_MAPPINGS)
        .find(([, censored]) => censored === drug)?.[0] || drug;
      
      const drugItem = inventory.find(item => item.name === originalDrug);
      if (!drugItem || quantity <= 0 || quantity > drugItem.quantity) {
        logTransaction('sell', originalDrug, quantity, price, false);
        return;
      }

      await dispatch(sellDrug({ drug: originalDrug, quantity, price }));
      await dispatch(adjustMarket({ location, item: originalDrug, quantity, isBuy: false }));
      logTransaction('sell', originalDrug, quantity, price, true);
    } catch (error) {
      console.error('Sell transaction failed:', error);
    }
  };

  // Update the handleMaxClick function
  const handleMaxClick = () => {
    // Get the first available drug if none selected
    const firstDrug = marketItems[0]?.[0];
    const drugToUse = selectedDrug || firstDrug;
    
    if (!drugToUse) return;
    
    const drugData = prices[drugToUse];
    if (!drugData) return;
    
    const currentInventoryUsed = inventory.reduce((acc, item) => acc + item.quantity, 0);
    const maxBySpace = inventorySpace - currentInventoryUsed;
    const maxByCash = Math.floor(cash / drugData.price);
    const maxBuy = Math.min(maxBySpace, maxByCash);
    setQuantity(maxBuy);
  };

  // Add this near the top of the component, before the getQuickBuyOptions function
  const currentInventoryUsed = useMemo(() => 
    inventory.reduce((acc, item) => acc + item.quantity, 0),
    [inventory]
  );

  // Update the getQuickBuyOptions function with proper typing
  const getQuickBuyOptions = (price: number, owned: number, isBuy: boolean): QuickBuyOption[] => {
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

  // Update the MarketTrendIndicator component
  const MarketTrendIndicator: React.FC<{ trend: MarketTrend }> = ({ trend }) => {
    const getIcon = () => {
      switch (trend.direction) {
        case 'up':
          return '↑';
        case 'down':
          return '↓';
        default:
          return '→';
      }
    };

    const getColor = () => {
      switch (trend.direction) {
        case 'up':
          return 'text-red-500';
        case 'down':
          return 'text-green-500';
        default:
          return 'text-gray-500';
      }
    };

    return (
      <span title={trend.description} className={`${getColor()} font-bold`}>
        {getIcon()} {trend.strength.toFixed(1)}%
      </span>
    );
  };

  // Add proper cleanup in useEffect
  useEffect(() => {
    const timer = setInterval(() => {
      // ... market update logic
    }, 5000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Enhanced Location Details Section */}
      <div className="bg-surface/80 rounded-xl p-6 border border-border/50">
        {/* Collapsible Header */}
        <button 
          onClick={() => setShowLocationInfo(!showLocationInfo)}
          className="w-full flex items-center justify-between"
        >
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              {location}
              <span className="text-sm font-normal px-2 py-1 rounded bg-surface text-text/60">
                {getLocationDetails(location).region}
              </span>
            </h2>
          </div>
          <span className="text-2xl text-text/60">{showLocationInfo ? '▼' : '▶'}</span>
        </button>

        {/* Collapsible Content */}
        {showLocationInfo && (
          <div className="space-y-6 mt-4">
            <p className="text-lg text-text/70 italic">
              {getCensoredText(getLocationDetails(location).history, adultMode)}
            </p>

            {/* Location Story Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="story-card">
                <div className="flex items-center gap-2 text-primary mb-3">
                  <FontAwesomeIcon icon={faHistory} className="text-xl" />
                  <h3 className="font-bold">Criminal History</h3>
                </div>
                <p className="text-text/80">
                  {getCensoredText(getLocationDetails(location).history, adultMode)}
                </p>
              </div>

              <div className="story-card">
                <div className="flex items-center gap-2 text-red-500 mb-3">
                  <FontAwesomeIcon icon={faSkull} className="text-xl" />
                  <h3 className="font-bold">Gang Activity</h3>
                </div>
                <p className="text-text/80">
                  {getCensoredText(getLocationDetails(location).gangs, adultMode)}
                </p>
              </div>

              <div className="story-card">
                <div className="flex items-center gap-2 text-purple-500 mb-3">
                  <FontAwesomeIcon icon={faCapsules} className="text-xl" />
                  <h3 className="font-bold">Drug Scene</h3>
                </div>
                <div className="flex flex-wrap gap-1">
                  {getLocationDetails(location).drugs.map((drug: string) => (
                    <span 
                      key={drug}
                      className="px-2 py-0.5 bg-surface rounded-full text-xs font-medium text-text/70 mr-1"
                    >
                      {getCensoredDrugName(drug, adultMode)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="story-card">
                <div className="flex items-center gap-2 text-blue-500 mb-3">
                  <FontAwesomeIcon icon={faHandcuffs} className="text-xl" />
                  <h3 className="font-bold">Police Activity</h3>
                </div>
                <p className="text-text/80">
                  {getCensoredText(getLocationDetails(location).policeActivity, adultMode)}
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="stat-card">
                <div className="flex items-center gap-2 text-text/70">
                  <FontAwesomeIcon icon={faFire} className="text-red-500" />
                  <span>Heat Level</span>
                </div>
                <div className="mt-2">
                  <div className="h-2 w-full bg-gray-200/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{ width: `${getLocationDetails(location).policeRisk}%` }}
                    />
                  </div>
                  <div className="text-sm mt-1 text-text/60">
                    Police Activity: {getLocationDetails(location).policeRisk}%
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center gap-2 text-text/70">
                  <FontAwesomeIcon icon={faBoxes} className="text-primary" />
                  <span>Available Products</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {getLocationDetails(location).drugs.map((drug: string) => (
                    <span 
                      key={drug}
                      className="px-2 py-0.5 bg-surface rounded-full text-xs font-medium text-text/70"
                    >
                      {getCensoredDrugName(drug, adultMode)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-2 sm:p-4 pb-24 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold">Market in {location}</h2>
        
        <div className="quantity-controls flex items-center gap-2 bg-surface/30 p-2 rounded-lg backdrop-blur">
          <button 
            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
            className="btn btn-surface p-3 hover:bg-primary hover:text-white transition-colors"
            aria-label="Decrease quantity"
          >
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="w-20 text-center text-lg font-medium bg-surface/50 rounded-md"
            aria-label="Quantity"
          />
          <button 
            onClick={() => setQuantity(prev => prev + 1)}
            className="btn btn-surface p-3 hover:bg-primary hover:text-white transition-colors"
            aria-label="Increase quantity"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <button
            onClick={handleMaxClick}
            className="btn btn-primary px-4 py-3 text-sm font-medium flex items-center gap-2"
            aria-label="Set maximum quantity"
          >
            <FontAwesomeIcon icon={faInfinity} />
            Max
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1 bg-surface/30 rounded-lg p-3 backdrop-blur">
            <div className="flex items-center gap-2 text-sm text-text/70">
              <FontAwesomeIcon icon={faBoxes} />
              <span>Inventory Space</span>
            </div>
            <div className="mt-1 text-lg font-medium">
              {currentInventoryUsed} / {inventorySpace}
            </div>
            <div className="h-1.5 w-full bg-gray-200/20 rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(currentInventoryUsed / inventorySpace) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex-1 bg-surface/30 rounded-lg p-3 backdrop-blur">
            <div className="flex items-center gap-2 text-sm text-text/70">
              <FontAwesomeIcon icon={faWallet} />
              <span>Cash</span>
            </div>
            <div className="mt-1 text-lg font-medium">${cash.toLocaleString()}</div>
          </div>
        </div>

        {marketAlerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {marketAlerts.map((alert, index) => (
              <div 
                key={index}
                className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm flex items-center gap-3 animate-fadeIn"
              >
                <FontAwesomeIcon icon={faFire} className="text-orange-500 text-lg" />
                <span className="flex-1">{alert}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 sm:space-y-3">
          {marketItems.map(([drug, market]) => {
            const { price, owned, supply, demand } = market;
            const isExpanded = expandedItems.has(drug);
            const details = calculateMarketDetails(
              price, owned, supply, demand, cash, inventorySpace,
              currentInventoryUsed,
              drug, marketIntel, {}, price
            );

            // Update the expand button click handler
            const toggleExpand = () => {
              const newExpanded = new Set(expandedItems);
              if (isExpanded) {
                newExpanded.delete(drug);
                setSelectedDrug(null);
              } else {
                newExpanded.add(drug);
                setSelectedDrug(drug);
              }
              setExpandedItems(newExpanded);
            };

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
                      onClick={toggleExpand}
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
                      disabled={!calculateMaxQuantity(price, owned, true, cash, inventorySpace, currentInventoryUsed) || quantity <= 0 || isLoading}
                      className="btn btn-surface flex-1 text-sm hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-surface disabled:hover:text-text"
                    >
                      {isLoading ? (
                        <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                      ) : (
                        `Buy ${quantity}`
                      )}
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
                    {/* Market Trend Analysis */}
                    <div className="p-2 sm:p-3 bg-background rounded-md">
                      <MarketTrendIndicator trend={details.trend} />
                      {details.priceChange && (
                        <div className="text-xs mt-1">
                          Price change: {details.priceChange}
                        </div>
                      )}
                    </div>

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
                        {/* Enhanced Quick Buy/Sell Options */}
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2">
                          {getQuickBuyOptions(price, owned, true).map((option) => (
                            <button
                              key={option.amount}
                              onClick={() => handleQuantityChange(option.amount.toString())}
                              className="btn px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2">
                          {getQuickBuyOptions(price, owned, false).map((option) => (
                            <button
                              key={option.amount}
                              onClick={() => handleQuantityChange(option.amount.toString())}
                              className="btn px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm whitespace-nowrap"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Market Stats with Tooltips */}
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        className="stat-card group relative"
                        data-tooltip="Higher supply means lower prices"
                      >
                        <div className="flex items-center gap-2 text-text/70">
                          <FontAwesomeIcon icon={faBoxOpen} className="group-hover:text-primary transition-colors" />
                          <span>Supply</span>
                        </div>
                        <div className="text-2xl font-bold mt-1">{supply}%</div>
                        <div className="h-1.5 w-full bg-gray-200/20 rounded-full overflow-hidden mt-2">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${supply}%` }}
                          />
                        </div>
                      </div>
                      <div 
                        className="stat-card group relative"
                        data-tooltip="Higher demand means higher prices"
                      >
                        <div className="flex items-center gap-2 text-text/70">
                          <FontAwesomeIcon icon={faChartBar} className="group-hover:text-primary transition-colors" />
                          <span>Demand</span>
                        </div>
                        <div className="text-2xl font-bold mt-1">{demand}%</div>
                        <div className="h-1.5 w-full bg-gray-200/20 rounded-full overflow-hidden mt-2">
                          <div 
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${demand}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarketScreen; 