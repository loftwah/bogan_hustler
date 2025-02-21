import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { locationsByRegion } from "../components/MapScreen";
import { createAsyncThunk } from "@reduxjs/toolkit";

export interface DrugMarket {
  price: number;
  supply: number;  // 0-100, higher means cheaper
  demand: number;  // 0-100, higher means pricier
}

export interface MarketState {
  prices: {
    [location: string]: Record<string, DrugMarket>;
  };
  activeMarketEvent: { id: string; description: string } | null;
}

// Define all drugs and their properties
const itemData: Record<string, { basePrice: number; volatility: number; isIllegal: boolean }> = {
  // Hard Drugs
  "Ice": { basePrice: 350, volatility: 1.5, isIllegal: true },
  "Crack": { basePrice: 250, volatility: 1.4, isIllegal: true },
  "Heroin": { basePrice: 400, volatility: 1.6, isIllegal: true },
  "Cocaine": { basePrice: 300, volatility: 1.3, isIllegal: true },
  // Party Drugs
  "Pingas": { basePrice: 25, volatility: 0.8, isIllegal: true },
  "MDMA": { basePrice: 100, volatility: 1.0, isIllegal: true },
  "Acid": { basePrice: 30, volatility: 1.2, isIllegal: true },
  "Ketamine": { basePrice: 150, volatility: 1.1, isIllegal: true },
  // Weed & Natural
  "Bush Weed": { basePrice: 250, volatility: 0.7, isIllegal: true },
  "Hydro": { basePrice: 350, volatility: 0.9, isIllegal: true },
  "Shrooms": { basePrice: 200, volatility: 1.1, isIllegal: true },
  // Prescription
  "Xannies": { basePrice: 15, volatility: 0.6, isIllegal: true },
  // Legal & Grey Market
  "Durries": { basePrice: 40, volatility: 0.4, isIllegal: false },
  "Nangs": { basePrice: 10, volatility: 0.3, isIllegal: false },
  // New Items
  "Chop Chop": { basePrice: 80, volatility: 0.7, isIllegal: true }, // Illegal tobacco
  "Bootleg Spirits": { basePrice: 120, volatility: 0.8, isIllegal: true },
  "Black Market Vapes": { basePrice: 35, volatility: 0.5, isIllegal: true },
  "Counterfeit Cigs": { basePrice: 60, volatility: 0.6, isIllegal: true },
  "Moonshine": { basePrice: 90, volatility: 0.7, isIllegal: true },
  "Research Chems": { basePrice: 180, volatility: 1.3, isIllegal: true },
};

// Define location types and their drug distributions
const locationTypes = {
  cityCenter: {
    drugs: ["Ice", "Cocaine", "Pingas", "MDMA", "Xannies", "Durries", "Black Market Vapes", "Counterfeit Cigs"] as string[],
    policeRisk: 0.4
  },
  suburb: {
    drugs: ["Ice", "Crack", "Durries", "Nangs", "Xannies", "Chop Chop", "Black Market Vapes"] as string[],
    policeRisk: 0.3
  },
  ruralTown: {
    drugs: ["Bush Weed", "Ice", "Durries", "Xannies", "Moonshine", "Chop Chop"] as string[],
    policeRisk: 0.2
  },
  partyArea: {
    drugs: ["MDMA", "Pingas", "Ketamine", "Acid", "Nangs", "Research Chems", "Black Market Vapes"] as string[],
    policeRisk: 0.35
  }
};

// Helper function to determine location type
function getLocationType(location: string): keyof typeof locationTypes {
  if (location.includes("Cross") || location.includes("Civic")) {
    return "cityCenter";
  }
  if (location.includes("Nimbin") || location.includes("Byron")) {
    return "partyArea";
  }
  return "suburb";
}

// Generate locations data dynamically
const locations = Object.values(locationsByRegion).flat().reduce<Record<string, { drugs: string[]; policeRisk: number }>>((acc, location) => {
  const type = getLocationType(location);
  acc[location] = {
    drugs: [...locationTypes[type].drugs], // Create a new array
    policeRisk: locationTypes[type].policeRisk
  };
  return acc;
}, {});

// Create censored versions of drugs for non-adult mode
const censoredItemData: typeof itemData = {
  "Ice": { basePrice: 350, volatility: 1.5, isIllegal: false },
  "Crack": { basePrice: 250, volatility: 1.4, isIllegal: false },
  // ... rest of the censored items with same properties but different names
};

interface MarketEvent {
  id: string;
  description: string;
  effect: (market: Record<string, DrugMarket>) => void;
}

const marketEvents: MarketEvent[] = [
  {
    id: "lab_bust",
    description: "Major ice lab busted in %location%. Prices are spiking.",
    effect: (market) => {
      if (market.Ice) {
        market.Ice.price *= 2.5;
        market.Ice.supply -= 50;
      }
    },
  },
  {
    id: "gang_war",
    description: "Gang war erupts in %location%. Everything's scarce.",
    effect: (market) => {
      Object.values(market).forEach(drug => {
        drug.price *= 1.8;
        drug.supply -= 40;
      });
    },
  },
  {
    id: "police_raid",
    description: "Massive police raids in %location%! Watch yourself!",
    effect: (market) => {
      Object.values(market).forEach(drug => {
        if (drug.supply > 20) {
          drug.supply -= 20;
          drug.price *= 1.3;
        }
      });
    },
  },
  {
    id: "overdose_crisis",
    description: "OD crisis hits %location%! Heroin demand plummets!",
    effect: (market) => {
      if (market.Heroin) {
        market.Heroin.price *= 0.5;
        market.Heroin.demand -= 40;
      }
    },
  },
  {
    id: "festival_season",
    description: "Bush doof season in %location%! Party drugs are gold!",
    effect: (market) => {
      ["Pingas", "Acid", "Shrooms"].forEach(drug => {
        if (market[drug]) {
          market[drug].price *= 2;
          market[drug].demand += 60;
        }
      });
    },
  },
];

const getItemData = (adultMode: boolean) => adultMode ? itemData : censoredItemData;

const initialState: MarketState = {
  prices: Object.keys(locations).reduce((acc, loc) => {
    acc[loc] = locations[loc].drugs.reduce((items, item) => {
      const data = getItemData(true)[item];
      if (data) {
        items[item] = {
          price: data.basePrice,
          supply: 50 + Math.floor(Math.random() * 20) - 10,
          demand: 50 + Math.floor(Math.random() * 20) - 10,
        };
      }
      return items;
    }, {} as Record<string, DrugMarket>);
    return acc;
  }, {} as MarketState["prices"]),
  activeMarketEvent: null,
};

const marketSlice = createSlice({
  name: "market",
  initialState,
  reducers: {
    /**
     * Handles market price updates based on various factors
     * @param state - Current market state
     * @param action - Contains reputation, location, and mode settings
     */
    updatePrices: (state, action: PayloadAction<{ 
      reputation: number; 
      location: string; 
      adultMode: boolean 
    }>) => {
      const { reputation, location, adultMode } = action.payload;
      const riskFactor = locations[location].policeRisk * (1 - reputation / 100);
      const currentItemData = getItemData(adultMode);
      
      for (const loc in state.prices) {
        for (const item in state.prices[loc]) {
          const itemInfo = state.prices[loc][item];
          const baseData = currentItemData[item];
          if (baseData) {
            const volatility = baseData.volatility;
            const base = baseData.basePrice;
            const supplyEffect = (50 - itemInfo.supply) * 0.2;
            const demandEffect = (itemInfo.demand - 50) * 0.3;
            const randomShift = (Math.random() * 10 - 5) * volatility;
            
            const finalPrice = Math.max(5, Math.min(300,
              base + supplyEffect + demandEffect + randomShift + 
              (baseData.isIllegal ? riskFactor * 20 : riskFactor * 10)
            ));
            
            itemInfo.price = finalPrice;
            
            itemInfo.supply = Math.max(0, Math.min(100, itemInfo.supply + (Math.random() * 4 - 2)));
            itemInfo.demand = Math.max(0, Math.min(100, itemInfo.demand + (Math.random() * 4 - 2)));
          }
        }
      }
    },
    adjustMarket: (state, action: PayloadAction<{ location: string; item: string; quantity: number; isBuy: boolean }>) => {
      const { location, item, quantity, isBuy } = action.payload;
      const market = state.prices[location][item];
      
      if (!market) {
        console.warn(`Market not found for ${item} in ${location}`);
        return;
      }

      // Round the quantity to ensure integers
      const intQuantity = Math.round(quantity);

      // Only adjust supply and demand, don't change price during transactions
      if (isBuy) {
        market.supply = Math.max(0, Math.min(100, market.supply - intQuantity));
        market.demand = Math.max(0, Math.min(100, market.demand + intQuantity * 0.5));
      } else {
        market.supply = Math.max(0, Math.min(100, market.supply + intQuantity));
        market.demand = Math.max(0, Math.min(100, market.demand - intQuantity * 0.5));
      }
    },
    triggerMarketEvent: (state, action: PayloadAction<string>) => {
      const location = action.payload;
      if (Math.random() < 0.15) {
        const event = marketEvents[Math.floor(Math.random() * marketEvents.length)];
        event.effect(state.prices[location]);
        state.activeMarketEvent = {
          id: event.id,
          description: event.description.replace("%location%", location),
        };
      } else {
        state.activeMarketEvent = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(updatePricesWithLocation.fulfilled, (state, action) => {
      if (action.payload) {
        const { location } = action.meta.arg;
        state.prices[location] = action.payload;
      }
    });
  },
});

// First, let's add the missing interfaces and types at the top
interface UpdatePricesParams {
  reputation: number;
  location: string;
  adultMode: boolean;
  prevLocation: string;
}

// Remove the duplicate updatePrices export from the slice actions
export const { adjustMarket, triggerMarketEvent } = marketSlice.actions;

// Rename the async thunk version to be more specific
export const updatePricesWithLocation = createAsyncThunk(
  'market/updatePricesWithLocation',
  async ({ reputation, location, adultMode, prevLocation }: UpdatePricesParams) => {
    const distance = calculateDistance(prevLocation, location);
    const timeOfDay = new Date().getHours();
    const isNighttime = timeOfDay >= 20 || timeOfDay <= 4;
    
    // Use the existing itemData instead of undefined BASE_PRICES
    return Object.entries(getItemData(adultMode)).reduce((acc, [drug, data]) => {
      // Base variation
      let variation = (Math.random() - 0.5) * 0.4; // ±20% base variation
      
      // Distance affects prices
      variation += distance * 0.001; // 0.1% per km
      
      // Time-based effects
      if (isNighttime) variation += 0.1; // 10% premium at night
      
      // Add reputation effect - higher reputation gives slightly better prices
      variation -= (reputation / 100) * 0.15; // Up to 15% discount with max reputation
      
      // Prevent negative prices
      const finalPrice = Math.max(1, Math.round(data.basePrice * (1 + variation)));
      
      acc[drug] = {
        price: finalPrice,
        supply: Math.random() * 100,
        demand: Math.random() * 100
      };
      
      return acc;
    }, {} as Record<string, DrugMarket>);
  }
);

// Add proper implementation of calculateDistance
const calculateDistance = (loc1: string, loc2: string): number => {
  const coords1 = LOCATION_COORDS[loc1];
  const coords2 = LOCATION_COORDS[loc2];
  if (!coords1 || !coords2) return 0;
  
  // Haversine formula implementation
  const R = 6371; // Earth's radius in km
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper function for distance calculation
const toRad = (value: number): number => {
  return value * Math.PI / 180;
};

// Add new types and helpers
interface LocationCoordinates {
  lat: number;
  lng: number;
}

const LOCATION_COORDS: Record<string, LocationCoordinates> = {
  "Kings Cross": { lat: -33.8775, lng: 151.2252 },
  // Add coordinates for other locations...
};

export default marketSlice.reducer; 