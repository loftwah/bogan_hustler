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
const itemData: Record<string, { basePrice: number; volatility: number; isIllegal: boolean; name: string }> = {
  // Hard Drugs
  "Ice": { basePrice: 350, volatility: 1.5, isIllegal: true, name: "Ice" },
  "Crack": { basePrice: 250, volatility: 1.4, isIllegal: true, name: "Crack" },
  "Heroin": { basePrice: 400, volatility: 1.6, isIllegal: true, name: "Heroin" },
  "Cocaine": { basePrice: 300, volatility: 1.3, isIllegal: true, name: "Cocaine" },
  // Party Drugs
  "Pingas": { basePrice: 25, volatility: 0.8, isIllegal: true, name: "Pingas" },
  "MDMA": { basePrice: 100, volatility: 1.0, isIllegal: true, name: "MDMA" },
  "Acid": { basePrice: 30, volatility: 1.2, isIllegal: true, name: "Acid" },
  "Ketamine": { basePrice: 150, volatility: 1.1, isIllegal: true, name: "Ketamine" },
  // Weed & Natural
  "Bush Weed": { basePrice: 250, volatility: 0.7, isIllegal: true, name: "Bush Weed" },
  "Hydro": { basePrice: 350, volatility: 0.9, isIllegal: true, name: "Hydro" },
  "Shrooms": { basePrice: 200, volatility: 1.1, isIllegal: true, name: "Shrooms" },
  // Prescription
  "Xannies": { basePrice: 15, volatility: 0.6, isIllegal: true, name: "Xannies" },
  // Legal & Grey Market
  "Durries": { basePrice: 40, volatility: 0.4, isIllegal: false, name: "Durries" },
  "Nangs": { basePrice: 10, volatility: 0.3, isIllegal: false, name: "Nangs" },
  // New Items
  "Chop Chop": { basePrice: 80, volatility: 0.7, isIllegal: true, name: "Chop Chop" }, // Illegal tobacco
  "Bootleg Spirits": { basePrice: 120, volatility: 0.8, isIllegal: true, name: "Bootleg Spirits" },
  "Black Market Vapes": { basePrice: 35, volatility: 0.5, isIllegal: true, name: "Black Market Vapes" },
  "Counterfeit Cigs": { basePrice: 60, volatility: 0.6, isIllegal: true, name: "Counterfeit Cigs" },
  "Moonshine": { basePrice: 90, volatility: 0.7, isIllegal: true, name: "Moonshine" },
  "Research Chems": { basePrice: 180, volatility: 1.3, isIllegal: true, name: "Research Chems" },
};

// Define location types and their drug distributions
export const locationTypes = {
  cityCenter: {
    drugs: ["Ice", "Cocaine", "Pingas", "MDMA", "Xannies", "Durries", "Black Market Vapes", "Counterfeit Cigs"] as string[],
    policeRisk: 0.4
  },
  hardcoreArea: {
    drugs: ["Ice", "Crack", "Heroin", "Cocaine", "MDMA", "Xannies", "Research Chems", "Bootleg Spirits"] as string[],
    policeRisk: 0.5
  },
  gangTerritory: {
    drugs: ["Ice", "Heroin", "Cocaine", "MDMA", "Xannies", "Research Chems", "Bootleg Spirits", "Chop Chop"] as string[],
    policeRisk: 0.6
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

// Add these near the top of the file
export const HARDCORE_AREAS = [
  "Richmond",
  "St Kilda",
  "Kings Cross",
  "Redfern",
  "Cabramatta",
  "Mount Druitt",
  "Footscray",
  "Logan Central",
  "Inala",
  "Elizabeth",
  "Merrylands",
  "Auburn",
  "Bankstown",
  "Broadmeadows",
  "Dandenong",
  "Sunshine",
  "Southport",
  "Marsden",
  "Beenleigh",
  "Elizabeth",
  "Port Augusta",
  "Salisbury",
] as const;

export const RURAL_TOWNS = [
  "Dubbo",
  "Moe",
  "Tennant Creek",
  "Katherine",
  "Port Hedland"
] as const;

export const PARTY_AREAS = [
  "Nimbin",
  "Byron Bay",
  "Fortitude Valley",
  "Chapel Street"
] as const;

// Change from function to export function
export function getLocationType(location: string): keyof typeof locationTypes {
  const gangTerritories = [
    "Merrylands",
    "Auburn",
    "Bankstown",
    "Broadmeadows",
    "Dandenong",
    "Sunshine",
    "Marsden",
    "Beenleigh",
    "Southport",
    "Elizabeth",
    "Port Augusta",
    "Salisbury"
  ];

  if (gangTerritories.includes(location)) {
    return "gangTerritory";
  }

  // Hardcore areas - known for harder drugs
  const hardcoreAreas = [
    "Richmond",
    "St Kilda",
    "Kings Cross",
    "Redfern",
    "Cabramatta",
    "Mount Druitt",
    "Footscray",
    "Logan Central",
    "Inala",
    "Elizabeth"
  ];

  if (hardcoreAreas.includes(location)) {
    return "hardcoreArea";
  }
  
  // City centers
  if (location.includes("CBD") || location.includes("Civic")) {
    return "cityCenter";
  }

  // Party areas
  if (location.includes("Nimbin") || location.includes("Byron") || 
      location.includes("Chapel") || location.includes("Fortitude Valley")) {
    return "partyArea";
  }

  // Rural towns
  const ruralTowns = ["Dubbo", "Moe", "Tennant Creek", "Katherine", "Port Hedland"];
  if (ruralTowns.includes(location)) {
    return "ruralTown";
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

// Update the censored versions of drugs for non-adult mode
const censoredItemData: typeof itemData = {
  "Ice": { ...itemData["Ice"], name: "Energy Drinks" },
  "Crack": { ...itemData["Crack"], name: "Supplements" },
  "Heroin": { ...itemData["Heroin"], name: "Protein Powder" },
  "Cocaine": { ...itemData["Cocaine"], name: "Pre-workout" },
  "Pingas": { ...itemData["Pingas"], name: "Vitamins" },
  "MDMA": { ...itemData["MDMA"], name: "Energy Tablets" },
  "Xannies": { ...itemData["Xannies"], name: "Pain Relief" },
  "Durries": { ...itemData["Durries"], name: "Cigarettes" },
  "Nangs": { ...itemData["Nangs"], name: "Cream Chargers" },
  "Bush Weed": { ...itemData["Bush Weed"], name: "Herbal Tea" },
  "Hydro": { ...itemData["Hydro"], name: "Coffee Beans" },
  "Shrooms": { ...itemData["Shrooms"], name: "Mushroom Extract" },
  "Acid": { ...itemData["Acid"], name: "Caffeine Pills" },
  "Ketamine": { ...itemData["Ketamine"], name: "Sleep Aid" },
  "Chop Chop": { ...itemData["Chop Chop"], name: "Loose Leaf Tea" },
  "Bootleg Spirits": { ...itemData["Bootleg Spirits"], name: "Craft Soda" },
  "Black Market Vapes": { ...itemData["Black Market Vapes"], name: "Essential Oils" },
  "Counterfeit Cigs": { ...itemData["Counterfeit Cigs"], name: "Herbal Cigarettes" },
  "Moonshine": { ...itemData["Moonshine"], name: "Apple Juice" },
  "Research Chems": { ...itemData["Research Chems"], name: "Dietary Supplements" }
};

// Update the getItemData function to handle name mapping
const getItemData = (adultMode: boolean) => {
  if (adultMode) return itemData;
  
  // Create a mapping of adult names to censored names
  const nameMapping: Record<string, string> = {};
  Object.entries(censoredItemData).forEach(([adultName, data]) => {
    nameMapping[adultName] = data.name;
  });

  // Return censored version with mapped names
  return Object.entries(itemData).reduce((acc, [key, value]) => {
    acc[nameMapping[key] || key] = value;
    return acc;
  }, {} as typeof itemData);
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
  {
    id: "gang_takeover",
    description: "Gang takeover in %location%! Prices are volatile!",
    effect: (market) => {
      Object.values(market).forEach(drug => {
        drug.price *= Math.random() > 0.5 ? 1.5 : 0.7;
        drug.supply += Math.floor(Math.random() * 40) - 20;
      });
    },
  },
  {
    id: "bikie_war",
    description: "Bikie war breaks out in %location%! Hard drugs are scarce!",
    effect: (market) => {
      ["Ice", "Heroin", "Cocaine"].forEach(drug => {
        if (market[drug]) {
          market[drug].price *= 2;
          market[drug].supply -= 60;
        }
      });
    },
  },
  {
    id: "gang_bust",
    description: "Major gang bust in %location%! Supply lines disrupted!",
    effect: (market) => {
      Object.values(market).forEach(drug => {
        drug.supply = Math.max(0, drug.supply - 30);
        drug.price *= 1.4;
      });
    },
  }
];

const initialState: MarketState = {
  prices: Object.keys(locations).reduce((acc, loc) => {
    acc[loc] = locations[loc].drugs.reduce((items, item) => {
      const data = getItemData(true);
      if (data[item]) {
        items[item] = {
          price: data[item].basePrice,
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
      
      // Add time-based modifier
      const currentHour = new Date().getHours();
      const isNighttime = currentHour >= 20 || currentHour <= 4;
      const timeModifier = isNighttime ? 1.2 : 1.0; // 20% price increase at night
      
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
              base * timeModifier + // Apply time modifier to base price
              supplyEffect + 
              demandEffect + 
              randomShift + 
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

// Also export itemData
export { itemData };

export default marketSlice.reducer; 