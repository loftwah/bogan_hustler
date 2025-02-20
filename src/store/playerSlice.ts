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

const MAX_DEBT = 1000000; // $1M max debt
const MIN_DEBT = 0;

// Add new action for handling event outcomes
export interface EventOutcomePayload {
  cash?: number;
  reputation?: number;
  policeEvasion?: number;
}

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    travel: (state, action: PayloadAction<string>) => {
      state.location = action.payload;
      state.currentDay += 1;
      
      if (state.debt > MIN_DEBT) {
        // Use fixed-point arithmetic to avoid floating-point errors
        const interestAmount = Math.floor(state.debt * state.debtInterest * 100) / 100;
        state.debt = Math.min(MAX_DEBT, state.debt + interestAmount);
      }
    },
    buyDrug: (state, action: PayloadAction<{ drug: string; quantity: number; price: number }>) => {
      const { drug, quantity, price } = action.payload;
      // Round quantity and price to ensure integers
      const intQuantity = Math.round(quantity);
      const intPrice = Math.round(price);
      const totalCost = intQuantity * intPrice;
      
      const currentSpace = state.inventory.reduce((acc, item) => acc + item.quantity, 0);
      const spaceNeeded = intQuantity;
      
      if (totalCost > state.cash) {
        console.warn(`Insufficient funds: Required ${totalCost}, have ${state.cash}`);
        return;
      }
      
      if (currentSpace + spaceNeeded > state.inventorySpace) {
        console.warn(`Insufficient space: Required ${spaceNeeded}, have ${state.inventorySpace - currentSpace}`);
        return;
      }

      state.cash -= totalCost;
      
      const existingItem = state.inventory.find(item => item.name === drug);
      if (existingItem) {
        existingItem.quantity += intQuantity;
      } else {
        state.inventory.push({ name: drug, quantity: intQuantity });
      }
    },
    sellDrug: (state, action: PayloadAction<{ drug: string; quantity: number; price: number }>) => {
      const { drug, quantity, price } = action.payload;
      // Round quantity and price to ensure integers
      const intQuantity = Math.round(quantity);
      const intPrice = Math.round(price);
      const totalEarned = intQuantity * intPrice;
      
      const existingItem = state.inventory.find(item => item.name === drug);
      if (!existingItem || existingItem.quantity < intQuantity) {
        console.warn(`Insufficient quantity: Required ${intQuantity}, have ${existingItem?.quantity || 0}`);
        return;
      }

      state.cash += totalEarned;
      existingItem.quantity -= intQuantity;
      
      if (existingItem.quantity === 0) {
        state.inventory = state.inventory.filter(item => item.name !== drug);
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
    adjustCashFromEvent: (state, action: PayloadAction<number>) => {
      state.cash += action.payload;
    },
    adjustStatsFromEvent: (state, action: PayloadAction<EventOutcomePayload>) => {
      const { cash, reputation, policeEvasion } = action.payload;
      if (cash) state.cash = Math.max(0, state.cash + cash);
      if (reputation) state.reputation = Math.max(-100, Math.min(100, state.reputation + reputation));
      if (policeEvasion) state.policeEvasion = Math.max(0, Math.min(100, state.policeEvasion + policeEvasion));
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
  adjustCashFromEvent,
  adjustStatsFromEvent,
} = playerSlice.actions;

export default playerSlice.reducer; 