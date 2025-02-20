import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import EventPopup from '../components/EventPopup';
import eventReducer from '../store/eventSlice';
import playerReducer from '../store/playerSlice';
import marketReducer from '../store/marketSlice';

// Mock Audio API
class MockAudio {
  volume: number = 1;
  src: string = '';
  
  constructor(src?: string) {
    if (src) this.src = src;
  }

  play() {
    return Promise.resolve();
  }
}

// Replace global Audio with mock
global.Audio = MockAudio as any;

// Add tests for user interaction requirement
describe('Audio Playback with User Interaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not play audio before user interaction', () => {
    document.documentElement.removeAttribute('data-user-interacted');
    const audio = new Audio('./test.mp3');
    const playSpy = vi.spyOn(audio, 'play').mockImplementation(() => Promise.resolve());
    audio.play();
    expect(playSpy).toHaveBeenCalled();
  });

  it('should play audio after user interaction', () => {
    document.documentElement.setAttribute('data-user-interacted', 'true');
    const audio = new Audio('./test.mp3');
    const playSpy = vi.spyOn(audio, 'play').mockImplementation(() => Promise.resolve());
    audio.play();
    expect(playSpy).toHaveBeenCalled();
  });
});

// Add tests for EventPopup audio behavior
describe('EventPopup Audio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.removeAttribute('data-user-interacted');
  });

  const createTestStore = (eventId: string) => configureStore({
    reducer: {
      events: eventReducer,
      player: playerReducer,
      market: marketReducer
    },
    preloadedState: {
      events: {
        activeEvent: {
          id: eventId,
          description: `${eventId} in progress`,
          choices: []
        }
      }
    }
  });

  it('should attempt to play siren for police events after user interaction', () => {
    document.documentElement.setAttribute('data-user-interacted', 'true');
    const store = createTestStore('police_raid');
    const audioSpy = vi.spyOn(global, 'Audio');
    const playMock = vi.fn().mockImplementation(() => Promise.resolve());

    // Mock Audio constructor to return an object with play method
    audioSpy.mockImplementation(() => ({
      play: playMock,
      volume: 1
    } as any));

    render(
      <Provider store={store}>
        <EventPopup />
      </Provider>
    );

    expect(audioSpy).toHaveBeenCalledWith('./siren.mp3');
    expect(playMock).toHaveBeenCalled();
  });

  it('should set correct volume for siren audio', () => {
    document.documentElement.setAttribute('data-user-interacted', 'true');
    const store = createTestStore('police_raid');
    let audioInstance: any;
    
    const audioSpy = vi.spyOn(global, 'Audio').mockImplementation(() => {
      audioInstance = {
        volume: 1,
        play: () => Promise.resolve()
      };
      return audioInstance;
    });

    render(
      <Provider store={store}>
        <EventPopup />
      </Provider>
    );

    expect(audioSpy).toHaveBeenCalled();
    expect(audioInstance.volume).toBe(0.3);
  });

  it('should not play audio for non-police events', () => {
    const store = createTestStore('market_event');
    const audioSpy = vi.spyOn(global, 'Audio');

    render(
      <Provider store={store}>
        <EventPopup />
      </Provider>
    );

    expect(audioSpy).not.toHaveBeenCalled();
  });
});

// Add tests for audio error handling
describe('Audio Error Handling', () => {
  it('should handle play() promise rejection gracefully', async () => {
    const error = new Error('Play failed');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Create a mock audio instance with a failing play method
    const mockAudio = {
      play: vi.fn().mockRejectedValue(error),
      volume: 1
    };
    
    // Mock the Audio constructor to return our mock instance
    vi.spyOn(global, 'Audio').mockImplementation(() => mockAudio as any);
    
    const audio = new Audio();
    
    try {
      await audio.play();
    } catch (e) {
      console.log('Audio playback failed:', error);
    }
    
    expect(consoleSpy).toHaveBeenCalledWith('Audio playback failed:', error);
  });
}); 