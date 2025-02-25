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
    currentTime: number;
    duration: number;
    addEventListener: Mock;
    removeEventListener: Mock;
    _currentTime?: number; // Add this internal property for tracking currentTime
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
      currentTime: 0,
      duration: 180, // 3 minutes
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    
    // Add a setter for currentTime to ensure it updates properly
    Object.defineProperty(mockAudio, 'currentTime', {
      get: vi.fn(() => mockAudio._currentTime || 0),
      set: vi.fn((value) => { mockAudio._currentTime = value; }),
      configurable: true
    });
    
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
      expect(screen.getByText('Shadows in the Scrub')).toBeInTheDocument();
      
      // Click previous
      fireEvent.click(screen.getByLabelText('Previous track'));
      expect(screen.getByText('Bogan Hustler')).toBeInTheDocument();
    });

    it('displays current time and duration', () => {
      render(<AudioPlayer />);
      
      // Simulate timeupdate event
      const timeUpdateHandler = mockAudio.addEventListener.mock.calls.find(
        call => call[0] === 'timeupdate'
      )[1];
      
      act(() => {
        mockAudio.currentTime = 65; // 1:05
        timeUpdateHandler();
      });
      
      expect(screen.getByText('1:05')).toBeInTheDocument();
      expect(screen.getByText('3:00')).toBeInTheDocument();
    });

    it('updates progress bar width based on current time', () => {
      render(<AudioPlayer />);
      
      const timeUpdateHandler = mockAudio.addEventListener.mock.calls.find(
        call => call[0] === 'timeupdate'
      )[1];
      
      act(() => {
        mockAudio.currentTime = 90; // Half way through
        timeUpdateHandler();
      });
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '50%' });
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('handles audio metadata loading', () => {
      render(<AudioPlayer />);
      
      const metadataHandler = mockAudio.addEventListener.mock.calls.find(
        call => call[0] === 'loadedmetadata'
      )[1];
      
      act(() => {
        mockAudio.duration = 240; // 4 minutes
        metadataHandler();
      });
      
      expect(screen.getByText('4:00')).toBeInTheDocument();
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

  describe('Playback modes', () => {
    it('toggles repeat mode when repeat button is clicked', () => {
      render(<AudioPlayer />);
      
      // Default mode should be 'normal'
      expect(mockAudio.loop).toBe(false);
      
      // Click repeat button
      fireEvent.click(screen.getByLabelText('Repeat Off'));
      
      // Should be in repeat mode now
      expect(mockAudio.loop).toBe(true);
      expect(screen.getByLabelText('Repeat On')).toBeInTheDocument();
      
      // Click repeat button again
      fireEvent.click(screen.getByLabelText('Repeat On'));
      
      // Should be back in normal mode
      expect(mockAudio.loop).toBe(false);
      expect(screen.getByLabelText('Repeat Off')).toBeInTheDocument();
    });
    
    it('toggles shuffle mode when shuffle button is clicked', () => {
      render(<AudioPlayer />);
      
      // Click shuffle button to enable shuffle
      fireEvent.click(screen.getByLabelText('Shuffle Off'));
      
      // Verify shuffle button indicates shuffle is on
      expect(screen.getByLabelText('Shuffle On')).toBeInTheDocument();
      
      // Click next track button to test shuffle
      const nextButton = screen.getByLabelText('Next track');
      fireEvent.click(nextButton);
      
      // Can't directly test randomness, but we can verify localStorage was updated
      expect(localStorage.setItem).toHaveBeenCalledWith('boganHustlerPlaybackMode', 'shuffle');
      
      // Click shuffle button to disable shuffle
      fireEvent.click(screen.getByLabelText('Shuffle On'));
      
      // Verify shuffle is off
      expect(screen.getByLabelText('Shuffle Off')).toBeInTheDocument();
      expect(localStorage.setItem).toHaveBeenCalledWith('boganHustlerPlaybackMode', 'normal');
    });
    
    it('handles track end according to playback mode', () => {
      render(<AudioPlayer />);
      
      // Get the track end handler
      const endHandler = mockAudio.addEventListener.mock.calls.find(
        call => call[0] === 'ended'
      )[1];
      
      // Test normal mode (should move to next track)
      act(() => {
        endHandler();
      });
      
      // Should now be on second track
      expect(screen.getByText('Shadows in the Scrub')).toBeInTheDocument();
      
      // Enable repeat mode
      fireEvent.click(screen.getByLabelText('Repeat Off'));
      
      // In repeat mode, the track end handler does nothing
      // because the audio element handles looping
      expect(mockAudio.loop).toBe(true);
    });
  });

  describe('Progress bar seeking', () => {
    it('renders a clickable progress bar', () => {
      const { container } = render(<AudioPlayer />);
      
      // Get the progress bar element
      const progressBar = container.querySelector('.cursor-pointer');
      expect(progressBar).toBeTruthy();
      
      // Verify it has the correct classes and attributes
      expect(progressBar).toHaveClass('cursor-pointer');
      
      // Verify there's a progress indicator inside
      const progressIndicator = screen.getByRole('progressbar');
      expect(progressIndicator).toBeInTheDocument();
      
      // Set some time and check if progress bar updates
      act(() => {
        // Simulate timeupdate event
        const timeUpdateHandler = mockAudio.addEventListener.mock.calls.find(
          call => call[0] === 'timeupdate'
        )[1];
        
        mockAudio.currentTime = 90; // Half way through
        timeUpdateHandler();
      });
      
      // Verify the progress indicator shows correct progress
      expect(progressIndicator).toHaveStyle({ width: '50%' });
      expect(progressIndicator).toHaveAttribute('aria-valuenow', '50');
    });
  });

  describe('LocalStorage persistence', () => {
    it('saves current track to localStorage', () => {
      render(<AudioPlayer />);
      
      // Change to next track
      fireEvent.click(screen.getByLabelText('Next track'));
      
      // Check if localStorage was updated
      expect(localStorage.setItem).toHaveBeenCalledWith('boganHustlerCurrentTrack', '1');
    });
    
    it('saves volume to localStorage', () => {
      render(<AudioPlayer />);
      
      // Change volume
      const volumeSlider = screen.getByLabelText('Volume control');
      fireEvent.change(volumeSlider, { target: { value: '0.7' } });
      
      // Check if localStorage was updated
      expect(localStorage.setItem).toHaveBeenCalledWith('boganHustlerVolume', '0.7');
    });
    
    it('saves playback mode to localStorage', () => {
      render(<AudioPlayer />);
      
      // Enable shuffle mode
      fireEvent.click(screen.getByLabelText('Shuffle Off'));
      
      // Check if localStorage was updated
      expect(localStorage.setItem).toHaveBeenCalledWith('boganHustlerPlaybackMode', 'shuffle');
      
      // Change to repeat mode
      fireEvent.click(screen.getByLabelText('Shuffle On'));
      fireEvent.click(screen.getByLabelText('Repeat Off'));
      
      // Check if localStorage was updated
      expect(localStorage.setItem).toHaveBeenCalledWith('boganHustlerPlaybackMode', 'repeat');
    });
    
    it('loads saved state from localStorage on init', () => {
      // Mock localStorage.getItem to return saved values
      (localStorage.getItem as Mock).mockImplementation((key) => {
        if (key === 'boganHustlerCurrentTrack') return '2';
        if (key === 'boganHustlerVolume') return '0.6';
        if (key === 'boganHustlerPlaybackMode') return 'repeat';
        return null;
      });
      
      render(<AudioPlayer />);
      
      // Verify saved track is loaded
      expect(screen.getByText("Hustler's Last Run")).toBeInTheDocument();
      
      // Verify saved volume is loaded
      expect(mockAudio.volume).toBe(0.6);
      
      // Verify saved playback mode is loaded
      expect(mockAudio.loop).toBe(true);
      expect(screen.getByLabelText('Repeat On')).toBeInTheDocument();
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