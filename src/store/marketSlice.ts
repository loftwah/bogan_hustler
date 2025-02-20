import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface LocationDrugs {
  [drug: string]: { price: number };
}

interface MarketState {
  prices: {
    [location: string]: LocationDrugs;
  };
}

const locations: Record<string, { drugs: string[]; policeRisk: number }> = {
  Sydney: { drugs: ["Meth", "Cocaine", "MDMA"], policeRisk: 0.2 },
  Melbourne: { drugs: ["Weed", "Ketamine", "Xannies"], policeRisk: 0.1 },
  "Gold Coast": { drugs: ["Meth", "Steroids"], policeRisk: 0.15 },
  Perth: { drugs: ["Meth", "Cocaine"], policeRisk: 0.1 },
  Darwin: { drugs: ["Weed", "MDMA"], policeRisk: 0.25 },
  "Alice Springs": { drugs: ["Weed"], policeRisk: 0.05 },
  "Byron Bay": { drugs: ["Weed", "Ketamine"], policeRisk: 0.08 },
  Adelaide: { drugs: ["Xannies", "Meth"], policeRisk: 0.1 },
  Tasmania: { drugs: ["Weed"], policeRisk: 0.05 },
};

const initialState: MarketState = {
  prices: Object.keys(locations).reduce((acc, loc) => {
    acc[loc] = locations[loc].drugs.reduce((drugs, drug) => {
      drugs[drug] = { price: Math.floor(Math.random() * 50) + 50 };
      return drugs;
    }, {} as LocationDrugs);
    return acc;
  }, {} as MarketState["prices"]),
};

const marketSlice = createSlice({
  name: "market",
  initialState,
  reducers: {
    updatePrices: (state, action: PayloadAction<{ reputation: number }>) => {
      const { reputation } = action.payload;
      for (const loc in state.prices) {
        const riskFactor = locations[loc].policeRisk * (1 - reputation / 100);
        for (const drug in state.prices[loc]) {
          const fluctuation = Math.floor(Math.random() * 20) - 10;
          state.prices[loc][drug].price = Math.max(
            20,
            Math.min(200, state.prices[loc][drug].price + fluctuation + riskFactor * 10)
          );
        }
        if (Math.random() < 0.1 + reputation / 200) {
          state.prices[loc]["Green Script"] = { price: 150 - reputation };
        }
      }
    },
  },
});

export const { updatePrices } = marketSlice.actions;
export default marketSlice.reducer; 