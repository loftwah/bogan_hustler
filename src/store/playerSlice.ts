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
  adultMode: boolean;
}

const initialState: PlayerState = {
  cash: 1000,
  inventory: [],
  inventorySpace: 10,
  reputation: 0,
  location: "Kings Cross",
  currentDay: 1,
  maxDays: 30,
  debt: 0,
  debtInterest: 0.05,
  policeEvasion: 0,
  marketIntel: 0,
  adultMode: false,
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
      
      if (totalCost > state.cash) {
        console.warn(`Insufficient funds: Required ${totalCost}, have ${state.cash}`);
        return;
      }
      
      if (currentSpace + quantity > state.inventorySpace) {
        console.warn(`Insufficient space: Required ${quantity}, have ${state.inventorySpace - currentSpace}`);
        return;
      }

      state.cash -= totalCost;
      const existing = state.inventory.find((item) => item.name === drug);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.inventory.push({ name: drug, quantity });
      }
    },
    sellDrug: (state, action: PayloadAction<{ drug: string; quantity: number; price: number }>) => {
      const { drug, quantity, price } = action.payload;
      const totalEarned = price * quantity;
      const item = state.inventory.find((item) => item.name === drug);
      
      if (!item || item.quantity < quantity) {
        console.warn(`Insufficient quantity: Required ${quantity}, have ${item?.quantity || 0}`);
        return;
      }

      state.cash += totalEarned;
      item.quantity -= quantity;
      if (item.quantity === 0) {
        state.inventory = state.inventory.filter((i) => i.name !== drug);
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
    toggleAdultMode: (state) => {
      state.adultMode = !state.adultMode;
      localStorage.setItem("boganHustlerAdultMode", JSON.stringify(state.adultMode));
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
  toggleAdultMode,
} = playerSlice.actions;

export default playerSlice.reducer; 