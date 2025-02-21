import type { PlayerState } from '../store/playerSlice';

// Add input sanitization for localStorage
export const saveGameState = (state: PlayerState) => {
  try {
    const sanitizedState = JSON.parse(JSON.stringify(state)); // Deep clone
    localStorage.setItem('boganHustler', JSON.stringify(sanitizedState));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}; 