import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CombatMinigame } from '../../components/CombatMinigame';
import '@testing-library/jest-dom';

describe('CombatMinigame', () => {
  vi.setConfig({ testTimeout: 10000 });
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial Rendering', () => {
    it('renders with initial state', () => {
      render(<CombatMinigame onComplete={() => {}} opponentType="police" />);
      
      expect(screen.getByText('Police Fight!')).toBeInTheDocument();
      expect(screen.getByTestId('player-health')).toHaveTextContent('100%');
      expect(screen.getByTestId('player-energy')).toHaveTextContent('100%');
      expect(screen.getByTestId('opponent-health')).toHaveTextContent('100%');
    });

    it('displays all combat buttons', () => {
      render(<CombatMinigame onComplete={() => {}} opponentType="police" />);
      
      expect(screen.getByRole('button', { name: /Quick Strike/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Heavy Blow/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Defensive/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Adrenaline/i })).toBeInTheDocument();
    });
  });

  describe('Combat Mechanics', () => {
    it('handles quick strike attack', async () => {
      render(<CombatMinigame onComplete={() => {}} opponentType="police" />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Quick Strike/i }));
      });
      
      expect(screen.getByTestId('opponent-health')).not.toHaveTextContent('100%');
    });

    it('handles defensive stance activation', async () => {
      render(<CombatMinigame onComplete={() => {}} opponentType="police" />);
      
      // Mock Math.random to prevent counter-attack stun
      vi.spyOn(Math, 'random').mockReturnValue(0.5); // This ensures no stun effect triggers
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Defensive/i }));
        // Wait for state updates
        await vi.advanceTimersByTime(100);
      });
      
      expect(screen.getByText('Defensive stance activated!')).toBeInTheDocument();
    });

    it('handles energy regeneration', async () => {
      render(<CombatMinigame onComplete={() => {}} opponentType="police" />);
      
      // Use quick strike to spend energy
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Quick Strike/i }));
      });
      
      const initialEnergy = Number(screen.getByTestId('player-energy').textContent!.replace('%', ''));
      
      // Wait for energy regen
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      
      const newEnergy = Number(screen.getByTestId('player-energy').textContent!.replace('%', ''));
      expect(newEnergy).toBeGreaterThan(initialEnergy);
    });

    it('handles victory condition', async () => {
      const onComplete = vi.fn();
      render(<CombatMinigame onComplete={onComplete} opponentType="dealer" />);
      
      // Mock Math.random to ensure consistent damage and no stun effects
      const mockRandom = vi.fn().mockReturnValue(0.5);
      vi.spyOn(Math, 'random').mockImplementation(mockRandom);
      
      // Execute multiple heavy blows to defeat opponent
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          const heavyBlowButton = screen.getByRole('button', { name: /Heavy Blow/i });
          fireEvent.click(heavyBlowButton);
          
          // Wait for state updates
          await vi.advanceTimersByTime(100);
        });
        
        // Wait for energy regeneration between attacks
        await act(async () => {
          await vi.advanceTimersByTime(1000);
        });
      }
      
      // Wait for victory condition to be checked and state to update
      await act(async () => {
        await vi.advanceTimersByTime(100);
      });
      
      // NEW: Wait for the onComplete callback delay (2000ms)
      await act(async () => {
        await vi.advanceTimersByTime(2000);
      });
      
      // Check for victory text
      expect(screen.getByText('🎉 Victory!')).toBeInTheDocument();
      expect(onComplete).toHaveBeenCalledWith(true);
    });
  });

  describe('Status Effects', () => {
    it('applies and removes status effects correctly', async () => {
      render(<CombatMinigame onComplete={() => {}} opponentType="police" />);
      
      // Mock Math.random to prevent counter-attack stun
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Adrenaline/i }));
        // Wait for initial state update
        await vi.advanceTimersByTime(100);
      });
      
      expect(screen.getByText('Adrenaline rush activated!')).toBeInTheDocument();
      
      // Wait for game loop to process status effects
      await act(async () => {
        // Status effect duration is 2, so we need to wait for 2 game loop cycles
        await vi.advanceTimersByTime(2100); // 2 seconds + 100ms buffer
      });
      
      // Status effect message should be gone
      expect(screen.queryByText('Adrenaline rush activated!')).not.toBeInTheDocument();
    });

    it('renders status effect icon for opponent when stun is triggered', async () => {
      // Force heavy blow to trigger stun (random < 0.4)
      vi.spyOn(Math, 'random').mockReturnValue(0.3);
      render(<CombatMinigame onComplete={() => {}} opponentType="police" />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Heavy Blow/i }));
        // Allow state update for heavy blow and its side effects
        await vi.advanceTimersByTime(100);
      });
      
      // Expect to find the opponent stun status effect icon using its data-testid
      expect(screen.getByTestId('opponent-status-effect-stun')).toBeInTheDocument();
    });
  });
}); 