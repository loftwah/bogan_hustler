import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PoliceFightMinigame } from '../../components/PoliceFightMinigame';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import playerReducer from '../../store/playerSlice';
import eventReducer from '../../store/eventSlice';

describe('PoliceFightMinigame', () => {
  const mockOnComplete = vi.fn();
  
  // Mock store setup
  const createTestStore = () => configureStore({
    reducer: {
      player: playerReducer,
      events: eventReducer
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial game state correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <PoliceFightMinigame onComplete={mockOnComplete} />
      </Provider>
    );

    expect(screen.getByText(/Police Fight!/i)).toBeInTheDocument();
    expect(screen.getByText('You: 100%')).toBeInTheDocument();
    expect(screen.getByText('Cop: 100%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Attack!/i })).toBeInTheDocument();
  });

  it('handles combat mechanics correctly', () => {
    // Mock random to return 0.5 for consistent damage values
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValue(0.5); // Will result in 15 player damage and 20 cop damage

    render(
      <Provider store={createTestStore()}>
        <PoliceFightMinigame onComplete={mockOnComplete} />
      </Provider>
    );

    const attackButton = screen.getByRole('button', { name: /Attack!/i });
    fireEvent.click(attackButton);

    // After one attack:
    // Player deals 15 damage, leaving cop at 85%
    // Cop deals 20 damage, leaving player at 80%
    const playerHealth = screen.getByText('You: 80%');
    const copHealth = screen.getByText('Cop: 85%');
    expect(playerHealth).toBeInTheDocument();
    expect(copHealth).toBeInTheDocument();
  });

  it('handles player victory correctly', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <PoliceFightMinigame onComplete={mockOnComplete} />
      </Provider>
    );

    // Mock random to ensure high player damage and low cop damage
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValue(0.9); // This will result in maximum damage

    const attackButton = screen.getByRole('button', { name: /Attack!/i });
    
    // Click until cop health reaches 0
    // With our mocked high damage values, we need fewer hits
    for (let i = 0; i < 3; i++) {
      fireEvent.click(attackButton);
      // Wait longer between attacks to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await waitFor(() => {
      expect(screen.getByRole('heading')).toHaveTextContent('You won!');
    }, { timeout: 2000 });
    expect(mockOnComplete).toHaveBeenCalledWith(true);
  });

  it('handles player defeat correctly', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <PoliceFightMinigame onComplete={mockOnComplete} />
      </Provider>
    );

    // Mock random to ensure player takes maximum damage
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValue(1.0); // Maximum damage: player deals 25, cop deals 30

    const attackButton = screen.getByRole('button', { name: /Attack!/i });
    
    // Click until player health reaches 0
    // With our fixed damage values in test mode:
    // Player deals 15 damage per hit
    // Cop deals 20 damage per hit
    // Player will die in 5 hits (100 -> 80 -> 60 -> 40 -> 20 -> 0)
    for (let i = 0; i < 5; i++) {
      fireEvent.click(attackButton);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /You lost!/i })).toBeInTheDocument();
    }, { timeout: 2000 });
    
    expect(mockOnComplete).toHaveBeenCalledWith(false);
  });

  it('updates health bars correctly', () => {
    render(
      <Provider store={createTestStore()}>
        <PoliceFightMinigame onComplete={mockOnComplete} />
      </Provider>
    );

    const attackButton = screen.getByRole('button', { name: /Attack!/i });
    
    const playerHealthBar = screen.getByRole('progressbar', { name: 'Player health' });
    const copHealthBar = screen.getByRole('progressbar', { name: 'Cop health' });
    
    const initialPlayerWidth = playerHealthBar.style.width;
    const initialCopWidth = copHealthBar.style.width;

    fireEvent.click(attackButton);

    expect(playerHealthBar.style.width).not.toBe(initialPlayerWidth);
    expect(copHealthBar.style.width).not.toBe(initialCopWidth);
  });
}); 