import { describe, it, expect } from 'vitest';
import playerReducer, {
  upgradeInventory,
  upgradePoliceEvasion,
  upgradeMarketIntel,
  adjustStatsFromEvent
} from '../../store/playerSlice';
import type { PlayerState } from '../../store/playerSlice';

describe('Player Progression', () => {
  const initialState: PlayerState = {
    cash: 2000,
    inventorySpace: 10,
    policeEvasion: 0,
    marketIntel: 0,
    reputation: 0,
    inventory: [],
    location: 'Kings Cross',
    currentDay: 1,
    maxDays: 30,
    debt: 0,
    debtInterest: 0.05,
    adultMode: false
  };

  describe('Upgrades', () => {
    it('should handle inventory space upgrade', () => {
      const state = playerReducer(initialState, upgradeInventory());
      expect(state.cash).toBe(1500);
      expect(state.inventorySpace).toBe(15);
    });

    it('should not upgrade if insufficient funds', () => {
      const brokeState = { ...initialState, cash: 100 };
      const state = playerReducer(brokeState, upgradeInventory());
      expect(state).toEqual(brokeState);
    });

    it('should handle police evasion upgrade', () => {
      const state = playerReducer(initialState, upgradePoliceEvasion());
      expect(state.policeEvasion).toBe(20);
      expect(state.cash).toBe(1000);
    });

    it('should cap police evasion at 100', () => {
      const maxState = { ...initialState, policeEvasion: 90 };
      const state = playerReducer(maxState, upgradePoliceEvasion());
      expect(state.policeEvasion).toBe(100);
    });

    it('should handle market intel upgrade', () => {
      const state = playerReducer(initialState, upgradeMarketIntel());
      expect(state.marketIntel).toBe(15);
      expect(state.cash).toBe(1250);
    });
  });

  describe('Event Outcomes', () => {
    it('should handle positive reputation changes', () => {
      const outcome = { reputation: 10, policeEvasion: 5 };
      const state = playerReducer(initialState, adjustStatsFromEvent(outcome));
      expect(state.reputation).toBe(10);
      expect(state.policeEvasion).toBe(5);
    });

    it('should cap reputation between -100 and 100', () => {
      const outcome = { reputation: 150 };
      const state = playerReducer(initialState, adjustStatsFromEvent(outcome));
      expect(state.reputation).toBe(100);
    });
  });
}); 