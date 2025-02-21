import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EventPopup from '../../components/EventPopup';
import eventReducer from '../../store/eventSlice';
import playerReducer from '../../store/playerSlice';
import { toast } from 'react-hot-toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: vi.fn()
}));

describe('EventPopup', () => {
  const createTestStore = (eventData: any = null) => configureStore({
    reducer: {
      player: playerReducer,
      events: eventReducer
    },
    preloadedState: {
      events: {
        activeEvent: eventData ? {
          ...eventData,
          choices: eventData.choices.map((choice: any) => ({
            ...choice,
            outcome: choice.outcome.triggerMinigame ? {
              ...choice.outcome,
              opponentType: choice.outcome.opponentType || 'police'
            } : choice.outcome
          }))
        } : null
      },
      player: {
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
        adultMode: false
      }
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock HTMLMediaElement.play()
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  it('should render probabilistic choice outcomes correctly', () => {
    const store = createTestStore({
      id: 'test_event',
      description: 'Test event',
      choices: [{
        text: 'Risky Choice',
        outcome: {
          successChance: 0.7,
          success: { 
            cash: 100,
            reputation: 0,
            policeEvasion: 0,
            inventory: []
          },
          failure: { 
            cash: -100,
            reputation: 0,
            policeEvasion: 0,
            inventory: []
          }
        }
      }]
    });

    render(
      <Provider store={store}>
        <EventPopup />
      </Provider>
    );

    expect(screen.getByText('Risky Choice')).toBeInTheDocument();
  });

  it('should handle successful probabilistic outcome', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // Below 0.7 threshold for success

    const store = createTestStore({
      id: 'test_event',
      description: 'Test event',
      choices: [{
        text: 'Risky Choice',
        outcome: {
          successChance: 0.7,
          success: { 
            cash: 100,
            reputation: 0,
            policeEvasion: 0,
            inventory: []
          },
          failure: { 
            cash: -100,
            reputation: 0,
            policeEvasion: 0,
            inventory: []
          }
        }
      }]
    });

    render(
      <Provider store={store}>
        <EventPopup />
      </Provider>
    );

    fireEvent.click(screen.getByText('Risky Choice'));
    expect(toast).toHaveBeenCalledWith("You got lucky!", expect.any(Object));
  });

  it('should handle failed probabilistic outcome', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.8); // Above 0.7 threshold

    const store = createTestStore({
      id: 'test_event',
      description: 'Test event',
      choices: [{
        text: 'Risky Choice',
        outcome: {
          successChance: 0.7,
          success: { 
            cash: 100,
            reputation: 0,
            policeEvasion: 0,
            inventory: []
          },
          failure: { 
            cash: -100,
            reputation: 0,
            policeEvasion: 0,
            inventory: []
          }
        }
      }]
    });

    render(
      <Provider store={store}>
        <EventPopup />
      </Provider>
    );

    fireEvent.click(screen.getByText('Risky Choice'));
    expect(toast).toHaveBeenCalledWith("Things didn't go as planned...", expect.any(Object));
  });

  it('should trigger minigame for fight choice', () => {
    const store = createTestStore({
      id: 'police_raid',
      description: 'Police raid',
      choices: [{
        text: 'Fight',
        outcome: { 
          triggerMinigame: true,
          opponentType: 'police'
        }
      }]
    });

    // Mock the stun timer
    vi.useFakeTimers();

    render(
      <Provider store={store}>
        <EventPopup />
      </Provider>
    );

    // First check if the fight button is rendered
    const fightButton = screen.getByText('Fight');
    expect(fightButton).toBeInTheDocument();

    // Click the fight button
    fireEvent.click(fightButton);

    // Check if the minigame title appears
    expect(screen.getByText('Police Fight!')).toBeInTheDocument();

    // Check for health displays
    expect(screen.getByText('You: 100%')).toBeInTheDocument();
    expect(screen.getByText('Energy: 100%')).toBeInTheDocument();
    expect(screen.getByText('Opponent: 100%')).toBeInTheDocument();

    // Clean up timers
    vi.useRealTimers();
  });

  it('should display success chance for probabilistic outcomes', () => {
    const store = createTestStore({
      id: 'police_raid',
      description: 'Test raid',
      choices: [{
        text: '💰 Bribe ($500)',
        outcome: {
          successChance: 0.8,
          success: {
            cash: -500,
            reputation: 10,
            policeEvasion: 0,
            inventory: []
          },
          failure: {
            cash: -1000,
            reputation: -20,
            policeEvasion: -5,
            inventory: []
          }
        }
      }]
    });

    render(
      <Provider store={store}>
        <EventPopup />
      </Provider>
    );

    expect(screen.getByText('Success chance: 80%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /💰 Bribe \(\$500\)/ })).toBeInTheDocument();
  });

  it('should show minigame text for fight options', () => {
    const store = createTestStore({
      id: 'police_raid',
      description: 'Test raid',
      choices: [{
        text: '👊 Fight',
        outcome: {
          triggerMinigame: true,
          success: {
            cash: 0,
            reputation: 20,
            policeEvasion: 0,
            inventory: []
          },
          failure: {
            cash: 0,
            reputation: -10,
            policeEvasion: -5,
            inventory: []
          }
        }
      }]
    });

    render(
      <Provider store={store}>
        <EventPopup />
      </Provider>
    );

    expect(screen.getByText('Fight to win reputation!')).toBeInTheDocument();
  });
}); 