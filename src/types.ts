export interface Drug {
  name: string;
  quantity: number;
}

export interface PlayerState {
  cash: number;
  inventory: Drug[];
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

export interface DrugMarket {
  price: number;
  supply: number;
  demand: number;
}

export interface MarketState {
  prices: {
    [location: string]: Record<string, DrugMarket>;
  };
  activeMarketEvent: { id: string; description: string } | null;
}

export interface RootState {
  player: PlayerState;
  market: MarketState;
  events: EventState;
}

export interface EventState {
  activeEvent: Event | null;
}

export interface Event {
  id: string;
  description: string;
  choices: {
    text: string;
    outcome: {
      cash?: number;
      inventory?: Record<string, number>;
      reputation?: number;
    };
  }[];
}

export interface MarketDataWithOriginal extends DrugMarket {
  originalName?: string;
  owned: number;
}

export interface MarketTrend {
  direction: 'up' | 'down' | 'stable';
  strength: number;
  description: string;
}

export interface MarketItemDetails {
  maxBuy: number;
  maxSell: number;
  totalCost: number;
  potentialProfit: number;
  potentialProfitPercent: string;
  supplyTrend: string;
  demandTrend: string;
  priceGuidance: string;
  nearbyComparison: string;
  buyAdvice: string;
  priceChange?: string;
} 