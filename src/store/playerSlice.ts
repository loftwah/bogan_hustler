import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface InventoryItem {
  name: string;
  quantity: number;
}

export interface PlayerState {
  cash: number;
  inventory: InventoryItem[];
  inventorySpace: number;
  reputation: number;
  location: string;
  currentDay: number;
  maxDays: number;
  debt: number;
  debtInterest: number;
  policeEvasion: number;
  marketIntel: number;
}

const initialState: PlayerState = {
  cash: 1000,
  inventory: [],
  inventorySpace: 10,
  reputation: 0,
  location: "Sydney",
  currentDay: 1,
  maxDays: 30,
  debt: 0,
  debtInterest: 0.05,
  policeEvasion: 0,
  marketIntel: 0,
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    travel: (state, action: PayloadAction<string>) => {
      state.location = action.payload;
      state.currentDay += 1;
      if (state.debt > 0) {
        state.debt += state.debt * state.debtInterest;
      }
    },
    buyDrug: (state, action: PayloadAction<{ drug: string; quantity: number; price: number }>) => {
      const { drug, quantity, price } = action.payload;
      const totalCost = price * quantity;
      const currentSpace = state.inventory.reduce((acc, item) => acc + item.quantity, 0);
      
      if (state.cash >= totalCost && currentSpace + quantity <= state.inventorySpace) {
        state.cash -= totalCost;
        const existing = state.inventory.find((item) => item.name === drug);
        if (existing) {
          existing.quantity += quantity;
        } else {
          state.inventory.push({ name: drug, quantity });
        }
      }
    },
    sellDrug: (state, action: PayloadAction<{ drug: string; quantity: number; price: number }>) => {
      const { drug, quantity, price } = action.payload;
      const totalEarned = price * quantity;
      const item = state.inventory.find((item) => item.name === drug);
      
      if (item && item.quantity >= quantity) {
        state.cash += totalEarned;
        item.quantity -= quantity;
        if (item.quantity === 0) {
          state.inventory = state.inventory.filter((i) => i.name !== drug);
        }
      }
    },
    takeLoan: (state, action: PayloadAction<number>) => {
      state.cash += action.payload;
      state.debt += action.payload;
    },
    payLoan: (state, action: PayloadAction<number>) => {
      const payment = Math.min(action.payload, state.debt);
      if (state.cash >= payment) {
        state.cash -= payment;
        state.debt -= payment;
      }
    },
    upgradeInventory: (state) => {
      if (state.cash >= 500) {
        state.cash -= 500;
        state.inventorySpace += 5;
      }
    },
    upgradePoliceEvasion: (state) => {
      if (state.cash >= 1000 && state.policeEvasion < 100) {
        state.cash -= 1000;
        state.policeEvasion = Math.min(100, state.policeEvasion + 20);
      }
    },
    upgradeMarketIntel: (state) => {
      if (state.cash >= 750 && state.marketIntel < 100) {
        state.cash -= 750;
        state.marketIntel = Math.min(100, state.marketIntel + 15);
      }
    },
  },
});

export const {
  travel,
  buyDrug,
  sellDrug,
  takeLoan,
  payLoan,
  upgradeInventory,
  upgradePoliceEvasion,
  upgradeMarketIntel,
} = playerSlice.actions;

export default playerSlice.reducer; 