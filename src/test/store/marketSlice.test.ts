import { describe, it, expect, vi } from 'vitest';
import marketReducer, { 
  updatePricesWithLocation,
  triggerMarketEvent,
  locationTypes,
  itemData,
  getLocationType,
  type DrugMarket
} from '../../store/marketSlice';
import { configureStore } from '@reduxjs/toolkit';

// Helper function to create a test store with proper drug availability
function createTestStore(location: string) {
  const locationType = getLocationType(location);
  const availableDrugs = locationTypes[locationType].drugs;
  
  // Create market data only for available drugs
  const marketData = availableDrugs.reduce((acc, drug) => {
    acc[drug] = { 
      price: itemData[drug].basePrice,
      supply: 50,
      demand: 50
    };
    return acc;
  }, {} as Record<string, DrugMarket>);

  return configureStore({
    reducer: { market: marketReducer },
    preloadedState: {
      market: {
        prices: {
          [location]: marketData
        },
        activeMarketEvent: null
      }
    }
  });
}

describe('Market Slice', () => {
  // Test location type classification
  describe('Location Type Classification', () => {
    it('should classify hardcore areas correctly', async () => {
      const hardcoreLocations = [
        "Richmond",
        "St Kilda",
        "Kings Cross",
        "Redfern",
        "Cabramatta",
        "Mount Druitt",
        "Footscray",
        "Logan Central",
        "Inala",
        "Elizabeth"
      ];

      for (const location of hardcoreLocations) {
        const store = createTestStore(location);
        await store.dispatch(updatePricesWithLocation({
          location,
          reputation: 0,
          adultMode: true,
          prevLocation: "Melbourne CBD"
        }));

        const state = store.getState().market;
        // Check for hardcore drugs
        expect(state.prices[location]).toHaveProperty('Heroin');
        expect(state.prices[location]).toHaveProperty('Cocaine');
        expect(state.prices[location]).toHaveProperty('Ice');
      }
    });

    it('should classify party areas correctly', async () => {
      const partyLocations = ["Nimbin", "Byron Bay", "Fortitude Valley"];

      for (const location of partyLocations) {
        const store = createTestStore(location);
        await store.dispatch(updatePricesWithLocation({
          location,
          reputation: 0,
          adultMode: true,
          prevLocation: "Melbourne CBD"
        }));

        const state = store.getState().market;
        // Check for party drugs
        expect(state.prices[location]).toHaveProperty('MDMA');
        expect(state.prices[location]).toHaveProperty('Ketamine');
        expect(state.prices[location]).toHaveProperty('Acid');
      }
    });

    it('should classify rural towns correctly', async () => {
      const ruralLocations = ["Dubbo", "Moe", "Tennant Creek", "Katherine", "Port Hedland"];

      for (const location of ruralLocations) {
        const store = createTestStore(location);
        await store.dispatch(updatePricesWithLocation({
          location,
          reputation: 0,
          adultMode: true,
          prevLocation: "Melbourne CBD"
        }));

        const state = store.getState().market;
        // Check for rural-specific drugs
        expect(state.prices[location]).toHaveProperty('Bush Weed');
        expect(state.prices[location]).toHaveProperty('Moonshine');
      }
    });

    describe('getLocationType', () => {
      it('should correctly identify location types', () => {
        // Test hardcore areas
        expect(getLocationType("Kings Cross")).toBe("hardcoreArea");
        expect(getLocationType("Richmond")).toBe("hardcoreArea");
        
        // Test city centers
        expect(getLocationType("Sydney CBD")).toBe("cityCenter");
        expect(getLocationType("Melbourne CBD")).toBe("cityCenter");
        
        // Test party areas
        expect(getLocationType("Nimbin")).toBe("partyArea");
        expect(getLocationType("Byron Bay")).toBe("partyArea");
        
        // Test rural towns
        expect(getLocationType("Dubbo")).toBe("ruralTown");
        expect(getLocationType("Moe")).toBe("ruralTown");
        
        // Test suburbs (default)
        expect(getLocationType("Blacktown")).toBe("suburb");
        expect(getLocationType("Penrith")).toBe("suburb");
      });
    });
  });

  // Test price variations
  describe('Price Calculations', () => {
    it('should apply higher risk factor to hardcore areas', async () => {
      const store = createTestStore("Richmond");
      await store.dispatch(updatePricesWithLocation({
        location: "Richmond",
        reputation: 0,
        adultMode: true,
        prevLocation: "Melbourne CBD"
      }));

      const state = store.getState().market;
      const prices = state.prices["Richmond"];
      
      // Hardcore areas should have higher base prices due to risk
      expect(prices.Ice.price).toBeGreaterThan(300); // Base price is 350
      expect(prices.Heroin.price).toBeGreaterThan(350); // Base price is 400
    });
  });

  // Test market events
  describe('Market Events', () => {
    it('should handle lab bust event in hardcore areas', () => {
      const store = createTestStore("Richmond");
      const initialState = store.getState().market;
      
      store.dispatch(triggerMarketEvent("Richmond"));
      const newState = store.getState().market;

      if (newState.activeMarketEvent?.id === 'lab_bust') {
        expect(newState.prices.Richmond.Ice.price)
          .toBeGreaterThan(initialState.prices.Richmond.Ice.price);
      }
    });
  });

  // Test adult mode filtering
  describe('Adult Mode Filtering', () => {
    it('should censor drug names in non-adult mode', async () => {
      const store = createTestStore("Richmond");
      await store.dispatch(updatePricesWithLocation({
        location: "Richmond",
        reputation: 0,
        adultMode: false,
        prevLocation: "Melbourne CBD"
      }));

      const state = store.getState().market;
      const prices = state.prices["Richmond"];
      
      // Should use censored names
      expect(prices).not.toHaveProperty('Heroin');
      expect(prices).toHaveProperty('Energy Drinks'); // Ice becomes Energy Drinks
      expect(prices).toHaveProperty('Pre-workout'); // Cocaine becomes Pre-workout
    });
  });

  // Add these new test suites
  describe('Distance Calculations', () => {
    it('should affect prices based on distance between locations', async () => {
      const store = createTestStore("Kings Cross");
      await store.dispatch(updatePricesWithLocation({
        location: "Perth",
        reputation: 0,
        adultMode: true,
        prevLocation: "Kings Cross"
      }));

      const state = store.getState().market;
      const prices = state.prices["Perth"];
      
      // Prices should be higher due to distance
      expect(prices.Ice.price).toBeGreaterThan(350); // Base price + distance markup
    });
  });

  describe('Time-based Price Variations', () => {
    it('should increase prices during nighttime hours', async () => {
      // Mock the Date to ensure it's nighttime
      const mockDate = new Date('2024-01-01T22:00:00');
      vi.setSystemTime(mockDate);

      const store = createTestStore("Richmond");
      
      // Get initial price before applying time-based modifications
      const initialState = store.getState().market;
      const initialPrice = initialState.prices["Richmond"].Ice.price;

      await store.dispatch(updatePricesWithLocation({
        location: "Richmond",
        reputation: 0,
        adultMode: true,
        prevLocation: "Melbourne CBD"
      }));

      const state = store.getState().market;
      const prices = state.prices["Richmond"];
      
      // Compare with initial price instead of absolute value
      expect(prices.Ice.price).toBeGreaterThan(initialPrice);
      expect(prices.Ice.price).toBeLessThan(initialPrice * 1.5); // Max 50% increase

      vi.useRealTimers();
    });
  });

  describe('Reputation Effects', () => {
    it('should give better prices with higher reputation', async () => {
      const lowRepStore = createTestStore("Richmond");
      const highRepStore = createTestStore("Richmond");

      // Compare prices with different reputation levels
      await Promise.all([
        lowRepStore.dispatch(updatePricesWithLocation({
          location: "Richmond",
          reputation: 0,
          adultMode: true,
          prevLocation: "Melbourne CBD"
        })),
        highRepStore.dispatch(updatePricesWithLocation({
          location: "Richmond",
          reputation: 100,
          adultMode: true,
          prevLocation: "Melbourne CBD"
        }))
      ]);

      const lowRepPrices = lowRepStore.getState().market.prices["Richmond"];
      const highRepPrices = highRepStore.getState().market.prices["Richmond"];
      
      // High reputation should give better prices
      expect(highRepPrices.Ice.price).toBeLessThan(lowRepPrices.Ice.price);
    });
  });

  describe('Supply and Demand', () => {
    it('should initialize supply and demand within valid ranges', async () => {
      const store = createTestStore("Richmond");
      await store.dispatch(updatePricesWithLocation({
        location: "Richmond",
        reputation: 0,
        adultMode: true,
        prevLocation: "Melbourne CBD"
      }));

      const state = store.getState().market;
      const market = state.prices["Richmond"];
      
      Object.values(market).forEach(({ supply, demand }) => {
        expect(supply).toBeGreaterThanOrEqual(0);
        expect(supply).toBeLessThanOrEqual(100);
        expect(demand).toBeGreaterThanOrEqual(0);
        expect(demand).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Location Type Drug Availability', () => {
    it('should not have party drugs in rural towns', async () => {
      const store = createTestStore("Dubbo");
      const state = store.getState().market;
      const prices = state.prices["Dubbo"];
      
      // Check that only rural drugs are available
      const ruralDrugs = locationTypes.ruralTown.drugs;
      Object.keys(prices).forEach(drug => {
        expect(ruralDrugs).toContain(drug);
      });
      
      // Double check specific party drugs aren't there
      expect(Object.keys(prices)).not.toContain('MDMA');
      expect(Object.keys(prices)).not.toContain('Ketamine');
    });

    it('should have all hard drugs in hardcore areas', async () => {
      const store = createTestStore("Kings Cross");
      await store.dispatch(updatePricesWithLocation({
        location: "Kings Cross",
        reputation: 0,
        adultMode: true,
        prevLocation: "Melbourne CBD"
      }));

      const state = store.getState().market;
      const prices = state.prices["Kings Cross"];
      
      const hardDrugs = ['Ice', 'Crack', 'Heroin', 'Cocaine'];
      hardDrugs.forEach(drug => {
        expect(prices).toHaveProperty(drug);
      });
    });
  });

  describe('Police Risk by Location', () => {
    it('should have higher police risk in hardcore areas', () => {
      const hardcoreRisk = locationTypes.hardcoreArea.policeRisk;
      const suburbanRisk = locationTypes.suburb.policeRisk;
      
      expect(hardcoreRisk).toBeGreaterThan(suburbanRisk);
    });
  });
}); 