import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Drug {
  name: string;
  quantity: number;
}

interface PlayerState {
  cash: number;
  inventory: Drug[];
  inventorySpace: number;
  reputation: number;
  location: string;
  currentDay: number;
  maxDays: number;
}

const initialState: PlayerState = {
  cash: 1000,
  inventory: [],
  inventorySpace: 10,
  reputation: 0,
  location: "Sydney",
  currentDay: 1,
  maxDays: 30,
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    travel: (state, action: PayloadAction<string>) => {
      state.location = action.payload;
      state.currentDay += 1;
    },
    buyDrug: (
      state,
      action: PayloadAction<{
        drug: string;
        quantity: number;
        price: number;
      }>
    ) => {
      const { drug, quantity, price } = action.payload;
      const totalCost = price * quantity;
      const currentSpace = state.inventory.reduce(
        (acc, item) => acc + item.quantity,
        0
      );
      if (
        state.cash >= totalCost &&
        currentSpace + quantity <= state.inventorySpace
      ) {
        state.cash -= totalCost;
        const existing = state.inventory.find((item) => item.name === drug);
        if (existing) {
          existing.quantity += quantity;
        } else {
          state.inventory.push({ name: drug, quantity });
        }
      }
    },
    sellDrug: (
      state,
      action: PayloadAction<{
        drug: string;
        quantity: number;
        price: number;
      }>
    ) => {
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
    upgradeInventory: (state) => {
      if (state.cash >= 500) {
        state.cash -= 500;
        state.inventorySpace += 5;
      }
    },
    adjustReputation: (state, action: PayloadAction<number>) => {
      state.reputation += action.payload;
      state.reputation = Math.max(-50, Math.min(100, state.reputation));
    },
  },
});

export const { travel, buyDrug, sellDrug, upgradeInventory, adjustReputation } = playerSlice.actions;
export default playerSlice.reducer; 