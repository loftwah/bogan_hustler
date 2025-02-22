import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AudioPlayer } from '../../components/AudioPlayer';
import '@testing-library/jest-dom';
import type { Mock } from 'vitest';

describe('AudioPlayer', () => {
  // Mock Audio API with proper types
  let mockAudio: {
    src: string;
    play: Mock;
    pause: Mock;
    volume: number;
    loop: boolean;
  };

  beforeEach(() => {
    // Reset mocks and DOM
    vi.clearAllMocks();
    
    // Mock Audio constructor with proper types
    mockAudio = {
      src: '',
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      volume: 1,
      loop: false,
    };
    
    vi.spyOn(window, 'Audio').mockImplementation(() => mockAudio as any);
    
    // Mock localStorage
    Storage.prototype.getItem = vi.fn();
    Storage.prototype.setItem = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Audio path handling', () => {
    it('uses correct path for production domain', () => {
      // Mock hostname
      Object.defineProperty(window, 'location', {
        value: { hostname: 'boganhustler.deanlofts.xyz' },
        writable: true
      });

      render(<AudioPlayer />);
      
      // Check if the audio src is set correctly for production
      expect(mockAudio.src).toBe('./themesong.mp3');
    });

    it('uses correct path for GitHub Pages', () => {
      // Mock hostname
      Object.defineProperty(window, 'location', {
        value: { hostname: 'loftwah.github.io' },
        writable: true
      });

      render(<AudioPlayer />);
      
      // Check if the audio src is set correctly for GitHub Pages
      expect(mockAudio.src).toBe('/bogan_hustler/themesong.mp3');
    });
  });

  describe('Playback controls', () => {
    it('toggles play/pause when button is clicked', async () => {
      render(<AudioPlayer />);
      
      const playButton = screen.getByLabelText('Play');
      
      // Click play and wait for state update
      await act(async () => {
        fireEvent.click(playButton);
        // Wait for the async play operation
        await mockAudio.play();
      });
      
      expect(mockAudio.play).toHaveBeenCalled();
      expect(screen.getByLabelText('Pause')).toBeInTheDocument();
      
      // Click pause and wait for state update
      await act(async () => {
        fireEvent.click(screen.getByLabelText('Pause'));
      });
      
      expect(mockAudio.pause).toHaveBeenCalled();
      expect(screen.getByLabelText('Play')).toBeInTheDocument();
    });

    it('changes track when next/previous buttons are clicked', () => {
      render(<AudioPlayer />);
      
      // Initial track should be "Bogan Hustler"
      expect(screen.getByText('Bogan Hustler')).toBeInTheDocument();
      
      // Click next
      fireEvent.click(screen.getByLabelText('Next track'));
      expect(screen.getByText('Dust of the Damned')).toBeInTheDocument();
      
      // Click previous
      fireEvent.click(screen.getByLabelText('Previous track'));
      expect(screen.getByText('Bogan Hustler')).toBeInTheDocument();
    });
  });

  describe('Volume controls', () => {
    it('adjusts volume when slider is changed', () => {
      render(<AudioPlayer />);
      
      const volumeSlider = screen.getByLabelText('Volume control');
      fireEvent.change(volumeSlider, { target: { value: '0.5' } });
      
      expect(mockAudio.volume).toBe(0.5);
    });

    it('toggles mute when mute button is clicked', () => {
      render(<AudioPlayer />);
      
      const muteButton = screen.getByLabelText('Mute');
      fireEvent.click(muteButton);
      
      expect(mockAudio.volume).toBe(0);
      expect(screen.getByLabelText('Unmute')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('handles audio loading errors gracefully', async () => {
      const error = new Error('Audio failed');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Make audio.play() fail
      mockAudio.play = vi.fn().mockRejectedValueOnce(error);
      
      render(<AudioPlayer />);
      
      // Click play and wait for error to be handled
      await act(async () => {
        fireEvent.click(screen.getByLabelText('Play'));
        // Wait for the promise to reject
        try {
          await mockAudio.play();
        } catch {
          // Expected error
        }
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Audio playback failed:', error);
      expect(screen.getByLabelText('Play')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
}); 