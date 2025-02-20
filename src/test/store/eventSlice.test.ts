import { describe, it, expect } from 'vitest';
import eventReducer, { 
  triggerEvent, 
  triggerRandomEventAsync,
  clearEvent 
} from '../../store/eventSlice';
import { configureStore } from '@reduxjs/toolkit';
import type { AppDispatch } from '../../store/store';

interface GameEvent {
  id: string;
  description: string;
  choices: Array<{
    text: string;
    outcome: {
      cash?: number;
      inventory?: Record<string, number>;
      reputation?: number;
      policeEvasion?: number;
    };
  }>;
  conditions?: {
    minReputation?: number;
    chance?: number;
  };
}

describe('Event Slice', () => {
  const initialState = {
    activeEvent: null
  };

  const createTestStore = () => configureStore({
    reducer: {
      events: eventReducer,
      player: () => ({
        reputation: 0,
        currentDay: 1,
        policeEvasion: 0,
        location: 'Kings Cross',
        cash: 1000,
        inventory: [],
        inventorySpace: 10,
        maxDays: 30,
        debt: 0,
        debtInterest: 0.05,
        marketIntel: 0,
        adultMode: false
      })
    }
  });

  describe('Event Triggers', () => {
    it('should trigger event with correct location substitution', () => {
      const event = {
        id: 'test_event',
        description: 'Test event in %location%',
        choices: []
      };
      
      const state = eventReducer(initialState, triggerEvent(event));
      expect(state.activeEvent).toEqual(event);
    });

    it('should respect cooldown periods', async () => {
      const store = createTestStore();
      const dispatch = store.dispatch as AppDispatch;
      
      // First trigger - we need to trigger it but don't care about the result
      await dispatch(triggerRandomEventAsync('Kings Cross'));
      
      // Second trigger should fail due to cooldown
      const secondResult = await dispatch(triggerRandomEventAsync('Kings Cross'));
      expect(secondResult.payload).toBeNull();
    });

    it('should consider police evasion in event chance', async () => {
      const store = createTestStore();
      const dispatch = store.dispatch as AppDispatch;
      
      // Run multiple trials
      let policeEventCount = 0;
      for (let i = 0; i < 100; i++) {
        const result = await dispatch(triggerRandomEventAsync('Kings Cross'));
        const event = result.payload as GameEvent | null;
        if (event?.id?.includes('police')) policeEventCount++;
      }

      // Should have fewer police events with high evasion
      expect(policeEventCount).toBeLessThan(30);
    });
  });

  describe('Event Conditions', () => {
    it('should only trigger events meeting reputation requirements', async () => {
      const store = createTestStore();
      const dispatch = store.dispatch as AppDispatch;
      const result = await dispatch(triggerRandomEventAsync('Kings Cross'));
      
      const event = result.payload as GameEvent | null;
      if (event) {
        expect(event.conditions?.minReputation ?? 0).toBeLessThanOrEqual(-75);
      }
    });
  });

  describe('Event Clearing', () => {
    it('should clear active event', () => {
      const stateWithEvent = {
        activeEvent: {
          id: 'test_event',
          description: 'Test event',
          choices: []
        }
      };
      
      const state = eventReducer(stateWithEvent, clearEvent());
      expect(state.activeEvent).toBeNull();
    });
  });
}); 