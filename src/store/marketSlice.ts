import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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

const locations: Record<string, { drugs: string[]; policeRisk: number }> = {
  Sydney: { drugs: ["Ice", "Cocaine", "MDMA"], policeRisk: 0.3 },
  Melbourne: { drugs: ["Weed", "Ketamine", "Xannies"], policeRisk: 0.2 },
  "Gold Coast": { drugs: ["Ice", "Steroids"], policeRisk: 0.25 },
  Perth: { drugs: ["Ice", "Cocaine"], policeRisk: 0.2 },
  Darwin: { drugs: ["Weed", "MDMA"], policeRisk: 0.15 },
  "Alice Springs": { drugs: ["Weed", "Ice"], policeRisk: 0.1 },
  "Byron Bay": { drugs: ["Weed", "Ketamine", "MDMA"], policeRisk: 0.15 },
  Adelaide: { drugs: ["Xannies", "Ice"], policeRisk: 0.2 },
  Tasmania: { drugs: ["Weed", "Ice", "Xannies"], policeRisk: 0.1 },
  // NSW
  "Kings Cross": { drugs: ["Ice", "Cocaine", "Pingas", "Xannies", "Durries"], policeRisk: 0.4 },
  "Redfern": { drugs: ["Ice", "Crack", "Durries", "Nangs"], policeRisk: 0.35 },
  "Cabramatta": { drugs: ["Heroin", "Ice", "Xannies", "Durries"], policeRisk: 0.3 },
  "Mount Druitt": { drugs: ["Ice", "Crack", "Durries", "Xannies"], policeRisk: 0.35 },
  "Blacktown": { drugs: ["Ice", "Heroin", "Pingas", "Durries"], policeRisk: 0.3 },
  "Nimbin": { drugs: ["Bush Weed", "Hydro", "Shrooms", "Acid", "Nangs"], policeRisk: 0.4 },
  "Penrith": { drugs: ["Ice", "Xannies", "Durries", "Nangs"], policeRisk: 0.25 },
  "Campbelltown": { drugs: ["Ice", "Crack", "Durries", "Pingas"], policeRisk: 0.3 },
  "Wollongong": { drugs: ["Ice", "Heroin", "Durries", "Nangs"], policeRisk: 0.25 },
  "Newcastle": { drugs: ["Ice", "Crack", "Pingas", "Durries"], policeRisk: 0.3 },

  // VIC
  "Frankston": { drugs: ["Ice", "Nangs", "Durries", "Crack"], policeRisk: 0.25 },
  "Broadmeadows": { drugs: ["Ice", "Heroin", "Xannies", "Durries"], policeRisk: 0.3 },
  "Dandenong": { drugs: ["Ice", "Crack", "Pingas", "Durries"], policeRisk: 0.25 },
  "Sunshine": { drugs: ["Heroin", "Ice", "Xannies", "Durries"], policeRisk: 0.3 },
  "Werribee": { drugs: ["Ice", "Crack", "Durries", "Nangs"], policeRisk: 0.25 },
  "Melton": { drugs: ["Ice", "Pingas", "Durries", "Xannies"], policeRisk: 0.2 },
  "Norlane": { drugs: ["Ice", "Crack", "Durries", "Nangs"], policeRisk: 0.25 },
  "Moe": { drugs: ["Ice", "Heroin", "Durries", "Xannies"], policeRisk: 0.2 },

  // QLD
  "Logan Central": { drugs: ["Ice", "Crack", "Xannies", "Durries"], policeRisk: 0.3 },
  "Inala": { drugs: ["Ice", "Heroin", "Durries", "Nangs"], policeRisk: 0.25 },
  "Woodridge": { drugs: ["Ice", "Crack", "Durries", "Pingas"], policeRisk: 0.3 },
  "Caboolture": { drugs: ["Ice", "Xannies", "Durries", "Nangs"], policeRisk: 0.25 },
  "Ipswich": { drugs: ["Ice", "Crack", "Durries", "Pingas"], policeRisk: 0.25 },
  "Toowoomba": { drugs: ["Ice", "Heroin", "Durries", "Xannies"], policeRisk: 0.2 },
  "Cairns": { drugs: ["Ice", "Pingas", "Durries", "Nangs"], policeRisk: 0.25 },
  "Townsville": { drugs: ["Ice", "Crack", "Durries", "Xannies"], policeRisk: 0.3 },

  // WA
  "Rockingham": { drugs: ["Ice", "Crack", "Pingas", "Durries"], policeRisk: 0.25 },
  "Armadale": { drugs: ["Ice", "Heroin", "Durries", "Nangs"], policeRisk: 0.3 },
  "Mandurah": { drugs: ["Ice", "Crack", "Durries", "Xannies"], policeRisk: 0.25 },
  "Midland": { drugs: ["Ice", "Heroin", "Durries", "Pingas"], policeRisk: 0.3 },
  "Balga": { drugs: ["Ice", "Crack", "Durries", "Nangs"], policeRisk: 0.25 },
  "Gosnells": { drugs: ["Ice", "Xannies", "Durries", "Pingas"], policeRisk: 0.25 },
  "Kalgoorlie-Boulder": { drugs: ["Ice", "Crack", "Durries", "Xannies"], policeRisk: 0.15 },
  "Port Hedland": { drugs: ["Ice", "Pingas", "Durries", "Nangs"], policeRisk: 0.2 },

  // NT
  "Palmerston": { drugs: ["Ice", "Crack", "Durries", "Xannies"], policeRisk: 0.25 },
  "Katherine": { drugs: ["Ice", "Heroin", "Durries"], policeRisk: 0.15 },
  "Tennant Creek": { drugs: ["Ice", "Crack", "Durries"], policeRisk: 0.1 },
  "Karama": { drugs: ["Ice", "Pingas", "Durries", "Nangs"], policeRisk: 0.2 },
  "Malak": { drugs: ["Ice", "Crack", "Durries", "Xannies"], policeRisk: 0.2 },

  // SA
  "Elizabeth": { drugs: ["Ice", "Crack", "Durries", "Nangs"], policeRisk: 0.25 },
  "Salisbury": { drugs: ["Ice", "Heroin", "Xannies", "Durries"], policeRisk: 0.2 },
  "Davoren Park": { drugs: ["Ice", "Crack", "Durries", "Pingas"], policeRisk: 0.3 },
  "Christie Downs": { drugs: ["Ice", "Heroin", "Durries", "Nangs"], policeRisk: 0.25 },
  "Hackham West": { drugs: ["Ice", "Crack", "Durries", "Xannies"], policeRisk: 0.2 },
  "Port Adelaide": { drugs: ["Ice", "Heroin", "Durries", "Pingas"], policeRisk: 0.25 },

  // Tasmania
  "Hobart": { drugs: ["Bush Weed", "Ice", "Xannies", "Durries"], policeRisk: 0.2 },
  "Launceston": { drugs: ["Ice", "Pingas", "Durries", "Nangs"], policeRisk: 0.15 },
  "Devonport": { drugs: ["Ice", "Bush Weed", "Durries", "Xannies"], policeRisk: 0.15 },
  "Burnie": { drugs: ["Ice", "Crack", "Durries", "Nangs"], policeRisk: 0.2 },
  "Glenorchy": { drugs: ["Ice", "Heroin", "Durries", "Pingas"], policeRisk: 0.25 },
  "Bridgewater": { drugs: ["Ice", "Bush Weed", "Durries", "Xannies"], policeRisk: 0.3 },

  // ACT
  "Civic": { drugs: ["Cocaine", "MDMA", "Pingas", "Nangs", "Acid"], policeRisk: 0.35 },
  "Belconnen": { drugs: ["Ice", "Xannies", "Durries", "Pingas"], policeRisk: 0.25 },
  "Tuggeranong": { drugs: ["Ice", "Crack", "Durries", "Nangs"], policeRisk: 0.2 },
  "Gungahlin": { drugs: ["Ice", "Heroin", "Durries", "Xannies"], policeRisk: 0.2 },
  "Woden": { drugs: ["Ice", "Pingas", "Durries", "Nangs"], policeRisk: 0.25 },
};

const itemData: Record<string, { basePrice: number; volatility: number; isIllegal: boolean }> = {
  "Ice": { basePrice: 350, volatility: 1.5, isIllegal: true },
  "Crack": { basePrice: 250, volatility: 1.4, isIllegal: true },
  "Heroin": { basePrice: 400, volatility: 1.6, isIllegal: true },
  "Cocaine": { basePrice: 300, volatility: 1.3, isIllegal: true },
  "Pingas": { basePrice: 25, volatility: 0.8, isIllegal: true },
  "Xannies": { basePrice: 15, volatility: 0.6, isIllegal: true },
  "Durries": { basePrice: 40, volatility: 0.4, isIllegal: false },
  "Nangs": { basePrice: 10, volatility: 0.3, isIllegal: false },
  "Bush Weed": { basePrice: 250, volatility: 0.7, isIllegal: true },
  "Hydro": { basePrice: 350, volatility: 0.9, isIllegal: true },
  "Shrooms": { basePrice: 200, volatility: 1.1, isIllegal: true },
  "Acid": { basePrice: 30, volatility: 1.2, isIllegal: true },
  "MDMA": { basePrice: 100, volatility: 1.0, isIllegal: true },
  "Ketamine": { basePrice: 150, volatility: 1.1, isIllegal: true },
  "Weed": { basePrice: 280, volatility: 0.8, isIllegal: true },
  "Steroids": { basePrice: 200, volatility: 0.9, isIllegal: true }
};

const censoredItemData: Record<string, { basePrice: number; volatility: number; isIllegal: boolean }> = {
  "Energy Drinks": { basePrice: 350, volatility: 1.5, isIllegal: false },
  "Supplements": { basePrice: 250, volatility: 1.4, isIllegal: false },
  "Protein Powder": { basePrice: 400, volatility: 1.6, isIllegal: false },
  "Pre-workout": { basePrice: 300, volatility: 1.3, isIllegal: false },
  "Vitamins": { basePrice: 25, volatility: 0.8, isIllegal: false },
  "Pain Relief": { basePrice: 15, volatility: 0.6, isIllegal: false },
  "Cigarettes": { basePrice: 40, volatility: 0.4, isIllegal: false },
  "Cream Chargers": { basePrice: 10, volatility: 0.3, isIllegal: false },
  "Herbal Tea": { basePrice: 250, volatility: 0.7, isIllegal: false },
  "Coffee Beans": { basePrice: 350, volatility: 0.9, isIllegal: false },
  "Mushroom Extract": { basePrice: 200, volatility: 1.1, isIllegal: false },
  "Caffeine Pills": { basePrice: 30, volatility: 1.2, isIllegal: false },
  "Energy Tablets": { basePrice: 100, volatility: 1.0, isIllegal: false },
  "Sleep Aid": { basePrice: 150, volatility: 1.1, isIllegal: false },
  "Green Tea": { basePrice: 280, volatility: 0.8, isIllegal: false },
  "Protein Bars": { basePrice: 200, volatility: 0.9, isIllegal: false }
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
    updatePrices: (state, action: PayloadAction<{ reputation: number; location: string; adultMode: boolean }>) => {
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
            
            itemInfo.price = Math.max(5, Math.min(300,
              base + supplyEffect + demandEffect + randomShift + 
              (baseData.isIllegal ? riskFactor * 20 : riskFactor * 10)
            ));
            
            itemInfo.supply = Math.max(0, Math.min(100, itemInfo.supply + (Math.random() * 4 - 2)));
            itemInfo.demand = Math.max(0, Math.min(100, itemInfo.demand + (Math.random() * 4 - 2)));
          }
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