import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface DrugMarket {
  price: number;
  supply: number;  // 0-100, higher means cheaper
  demand: number;  // 0-100, higher means pricier
}

interface MarketState {
  prices: {
    [location: string]: Record<string, DrugMarket>;
  };
  activeMarketEvent: { id: string; description: string } | null;
}

const locations: Record<string, { drugs: string[]; policeRisk: number }> = {
  Sydney: { drugs: ["Bundy Rum", "Tooheys Extra Dry", "Passion Pop", "Illegal Durries"], policeRisk: 0.2 },
  Melbourne: { drugs: ["VB", "Goon", "Emu Export", "Durries"], policeRisk: 0.1 },
  "Gold Coast": { drugs: ["Bundy Rum", "Four'N Twenty Pies", "Durries"], policeRisk: 0.15 },
  Perth: { drugs: ["Bundy Rum", "Tooheys Extra Dry", "West End Draught"], policeRisk: 0.1 },
  Darwin: { drugs: ["VB", "Passion Pop", "Goon"], policeRisk: 0.25 },
  "Alice Springs": { drugs: ["VB", "Emu Export"], policeRisk: 0.05 },
  "Byron Bay": { drugs: ["VB", "Goon", "West End Draught"], policeRisk: 0.08 },
  Adelaide: { drugs: ["Emu Export", "Bundy Rum", "Illegal Durries"], policeRisk: 0.1 },
  Tasmania: { drugs: ["VB", "Durries", "West End Draught"], policeRisk: 0.05 },
};

const itemData: Record<string, { basePrice: number; volatility: number; isIllegal?: boolean }> = {
  VB: { basePrice: 10, volatility: 0.5 },
  Goon: { basePrice: 5, volatility: 0.8 },
  Durries: { basePrice: 30, volatility: 0.6 },
  "Illegal Durries": { basePrice: 100, volatility: 1.3, isIllegal: true },
  "West End Draught": { basePrice: 80, volatility: 1.2 },
  "Emu Export": { basePrice: 15, volatility: 0.7 },
  "Bundy Rum": { basePrice: 70, volatility: 1.1 },
  "Tooheys Extra Dry": { basePrice: 100, volatility: 1.0 },
  "Passion Pop": { basePrice: 60, volatility: 1.0 },
  "Four'N Twenty Pies": { basePrice: 20, volatility: 0.9 },
};

interface MarketEvent {
  id: string;
  description: string;
  effect: (market: Record<string, DrugMarket>) => void;
}

const marketEvents: MarketEvent[] = [
  {
    id: "booze_shortage",
    description: "A truck crash in %location% cuts VB supply!",
    effect: (market) => {
      if (market.VB) {
        market.VB.price *= 1.5;
        market.VB.supply /= 2;
      }
    },
  },
  {
    id: "party_boom",
    description: "A festival in %location% spikes Passion Pop demand!",
    effect: (market) => {
      if (market["Passion Pop"]) {
        market["Passion Pop"].demand += 30;
        market["Passion Pop"].price *= 1.2;
      }
    },
  },
  {
    id: "firebombing",
    description: "Rival bogans firebomb a servo in %location%! Illegal Durries are hot.",
    effect: (market) => {
      if (market["Illegal Durries"]) {
        market["Illegal Durries"].price *= 2;
        market["Illegal Durries"].supply -= 30;
        market["Illegal Durries"].demand += 40;
      }
    },
  },
];

const initialState: MarketState = {
  prices: Object.keys(locations).reduce((acc, loc) => {
    acc[loc] = locations[loc].drugs.reduce((items, item) => {
      items[item] = {
        price: itemData[item].basePrice,
        supply: 50 + Math.floor(Math.random() * 20) - 10,
        demand: 50 + Math.floor(Math.random() * 20) - 10,
      };
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
    updatePrices: (state, action: PayloadAction<{ reputation: number; location: string }>) => {
      const { reputation, location } = action.payload;
      const riskFactor = locations[location].policeRisk * (1 - reputation / 100);
      
      for (const loc in state.prices) {
        for (const item in state.prices[loc]) {
          const itemInfo = state.prices[loc][item];
          const volatility = itemData[item].volatility;
          const base = itemData[item].basePrice;
          const supplyEffect = (50 - itemInfo.supply) * 0.2;
          const demandEffect = (itemInfo.demand - 50) * 0.3;
          const randomShift = (Math.random() * 10 - 5) * volatility;
          
          itemInfo.price = Math.max(5, Math.min(300,
            base + supplyEffect + demandEffect + randomShift + 
            (itemData[item].isIllegal ? riskFactor * 20 : riskFactor * 10)
          ));
          
          itemInfo.supply = Math.max(0, Math.min(100, itemInfo.supply + (Math.random() * 4 - 2)));
          itemInfo.demand = Math.max(0, Math.min(100, itemInfo.demand + (Math.random() * 4 - 2)));
        }
      }
    },
    adjustMarket: (state, action: PayloadAction<{ location: string; item: string; quantity: number; isBuy: boolean }>) => {
      const { location, item, quantity, isBuy } = action.payload;
      if (state.prices[location][item]) {
        const market = state.prices[location][item];
        if (isBuy) {
          market.supply += quantity * 2;
          market.demand -= quantity;
        } else {
          market.supply -= quantity;
          market.demand += quantity * 2;
        }
        market.supply = Math.max(0, Math.min(100, market.supply));
        market.demand = Math.max(0, Math.min(100, market.demand));
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
});

export const { updatePrices, adjustMarket, triggerMarketEvent } = marketSlice.actions;
export default marketSlice.reducer; 