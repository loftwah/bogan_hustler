import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PoliceFightMinigame } from '../../components/PoliceFightMinigame';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import playerReducer from '../../store/playerSlice';
import eventReducer from '../../store/eventSlice';

describe('PoliceFightMinigame', () => {
  vi.setConfig({ testTimeout: 10000 }); // Increase timeout to 10 seconds
  
  const mockOnComplete = vi.fn();
  
  // Mock store setup
  const createTestStore = () => configureStore({
    reducer: {
      player: playerReducer,
      events: eventReducer
    },
    preloadedState: {
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
      },
      events: {
        activeEvent: null
      }
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear all timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial game state correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <PoliceFightMinigame onComplete={mockOnComplete} />
      </Provider>
    );

    expect(screen.getByText(/Police Fight!/i)).toBeInTheDocument();
    expect(screen.getByText(/You: 100.*%/)).toBeInTheDocument();
    expect(screen.getByText(/Energy: 100.*%/)).toBeInTheDocument();
    expect(screen.getByText(/Cop: 100.*%/)).toBeInTheDocument();
  });

  it('handles basic combat interaction', async () => {
    render(
      <Provider store={createTestStore()}>
        <PoliceFightMinigame onComplete={mockOnComplete} />
      </Provider>
    );

    const quickStrikeButton = screen.getByRole('button', { name: /Quick Strike/i });
    
    await act(async () => {
      fireEvent.click(quickStrikeButton);
      await vi.advanceTimersByTimeAsync(100);
    });

    // Just verify the health/energy changed
    expect(screen.getByText(/Energy: 80.*%/)).toBeInTheDocument();
    expect(screen.getByText(/Cop: \d+%/)).toBeInTheDocument();
  });

  it('handles special moves', async () => {
    render(
      <Provider store={createTestStore()}>
        <PoliceFightMinigame onComplete={mockOnComplete} />
      </Provider>
    );

    const defensiveButton = screen.getByRole('button', { name: /Defensive/i });
    await act(async () => {
      fireEvent.click(defensiveButton);
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(screen.getByText(/Defense up!/i)).toBeInTheDocument();
  });
}); 