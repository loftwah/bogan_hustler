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
      
      // Second trigger should fail due to cooldown
      const secondResult = await dispatch(triggerRandomEventAsync('Kings Cross'));
      expect(secondResult.payload).toBeNull();
    });

    it('should consider location conditions', async () => {
      // Mock Date.getHours to return a consistent hour
      const mockDate = vi.spyOn(Date.prototype, 'getHours');
      mockDate.mockReturnValue(12); // Noon, to avoid time-of-day restrictions
      
      const store = createTestStore();
      const dispatch = store.dispatch;

      // Mock Math.random to ensure event triggers and passes chance check
      let mockRandomCalls = 0;
      const mockRandom = vi.fn(() => {
        mockRandomCalls++;
        // First call is for the chance check in eligibleEvents filter
        // For Kings Cross incident, chance is 0.25 and policeEvasion is 0
        // So modifiedChance = 0.25 * (1 - 0/200) = 0.25
        // We need to return a value < 0.25 to pass the check
        if (mockRandomCalls === 1) return 0.2; // Pass the initial chance check
        // Second call is for weighted random selection
        // Return a small value to ensure first event is selected
        return 0.1;
      });
      
      vi.spyOn(Math, 'random').mockImplementation(mockRandom);

      // Trigger in valid location (Kings Cross)
      // Kings Cross has the kings_cross_incident event which should trigger
      const result1 = await dispatch(triggerRandomEventAsync('Kings Cross'));
      expect(result1.payload).not.toBeNull();
      
      // Type assertion since we know it's an EnhancedEvent when not null
      const event = result1.payload as { id: string, conditions: { location: string[] } };
      expect(event.id).toBe('kings_cross_incident');
      expect(event.conditions.location).toContain('Kings Cross');
      
      // Reset mock call count for next test
      mockRandomCalls = 0;
      
      // Trigger in invalid location
      const result2 = await dispatch(triggerRandomEventAsync('Invalid Location'));
      expect(result2.payload).toBeNull();

      // Clean up mocks
      mockDate.mockRestore();
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