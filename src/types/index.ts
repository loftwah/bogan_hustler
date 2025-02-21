// Export all event-related types
export * from '../store/eventSlice';

// Export all player-related types including GameState
export * from '../store/playerSlice';

// Create a new file for shared types
export interface DrugMarket {
  price: number;
  supply: number;
  demand: number;
}

export interface InventoryItem {
  name: string;
  quantity: number;
}

export interface MarketEvent {
  id: string;
  description: string;
  effect: (market: Record<string, DrugMarket>) => void;
}

// Add strict type checking for event outcomes
export type EventOutcome = {
  cash?: number;
  reputation?: number;
  policeEvasion?: number;
  inventory?: Array<{name: string; quantity: number}>;
};

// Note: We can remove this since it's now exported from playerSlice
// export interface GameState {
//   cash: number;
//   location: string;
//   currentDay: number;
//   reputation: number;
//   inventory: Array<{name: string; quantity: number}>;
//   inventorySpace: number;
//   debt: number;
//   debtInterest: number;
//   policeEvasion: number;
//   marketIntel: number;
//   adultMode: boolean;
// } 