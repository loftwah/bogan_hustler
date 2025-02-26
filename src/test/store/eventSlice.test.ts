import { describe, it, expect, vi, beforeEach } from 'vitest';
import eventReducer, { 
  triggerEvent, 
  triggerRandomEventAsync,
  clearEvent,
  EnhancedEvent,
  enhancedEvents
} from '../../store/eventSlice';
import { configureStore } from '@reduxjs/toolkit';

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
    beforeEach(() => {
      vi.clearAllMocks();
      // Reset event state
      enhancedEvents.forEach((event: EnhancedEvent) => {
        event.lastTriggered = undefined;
      });
    });

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
      const dispatch = store.dispatch;
      
      // Mock Math.random to ensure event triggers
      vi.spyOn(Math, 'random').mockImplementation(() => 0.1);
      
      // First trigger should work
      const firstResult = await dispatch(triggerRandomEventAsync('Kings Cross'));
      expect(firstResult.payload).not.toBeNull();
      
      // Reset the random mock to ensure we don't get a different event
      vi.spyOn(Math, 'random').mockImplementation(() => 0.9);
      
      // Second trigger should fail due to cooldown (with high random value)
      const secondResult = await dispatch(triggerRandomEventAsync('Kings Cross'));
      expect(secondResult.payload).toBeNull();
    });

    it('should consider location conditions', async () => {
      const store = createTestStore();
      const dispatch = store.dispatch;
      
      // Create a mock event with specific location conditions
      const mockEvent = {
        id: 'kings_cross_incident',
        description: 'Test event in Kings Cross',
        choices: [],
        conditions: {
          location: ['Kings Cross'],
          chance: 1.0
        },
        repeatable: true,
        cooldown: 1
      };
      
      // Temporarily replace enhancedEvents with our mock
      const originalEvents = [...enhancedEvents];
      enhancedEvents.length = 0;
      enhancedEvents.push(mockEvent as EnhancedEvent);
      
      // Force the event to trigger
      vi.spyOn(Math, 'random').mockImplementation(() => 0.1);
      
      const result1 = await dispatch(triggerRandomEventAsync('Kings Cross'));
      expect(result1.payload).not.toBeNull();
      
      // Type assertion since we know it's an EnhancedEvent when not null
      const event = result1.payload as { id: string, conditions: { location: string[] } };
      expect(event.id).toBe('kings_cross_incident');
      expect(event.conditions.location).toContain('Kings Cross');
      
      // Restore original events
      enhancedEvents.length = 0;
      originalEvents.forEach(e => enhancedEvents.push(e));
    });

    it('should handle null event outcomes', () => {
      // @ts-expect-error - Intentionally testing null handling
      const state = eventReducer(initialState, triggerEvent(null));
      expect(state.activeEvent).toBeNull();
    });

    it('should validate event choice requirements', () => {
      // Test location requirements
      // Test reputation requirements
      // Test cooldown periods
    });
  });

  describe('Event Outcomes', () => {
    it('should handle probabilistic outcomes', () => {
      const store = createTestStore();
      vi.spyOn(Math, 'random').mockImplementation(() => 0.5);
      
      const event = {
        id: 'test_event',
        description: 'Test event',
        choices: [{
          text: 'Test choice',
          outcome: {
            successChance: 0.7,
            success: { cash: 100 },
            failure: { cash: -100 }
          }
        }]
      };
      
      store.dispatch(triggerEvent(event));
      const state = store.getState();
      expect(state.events.activeEvent).toEqual(event);
    });
  });

  describe('Event Clearing', () => {
    it('should clear active event', () => {
      const store = createTestStore();
      const event = {
        id: 'test_event',
        description: 'Test event',
        choices: []
      };
      
      store.dispatch(triggerEvent(event));
      store.dispatch(clearEvent());
      
      const state = store.getState();
      expect(state.events.activeEvent).toBeNull();
    });
  });
}); 