import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect method
expect.extend(matchers)

// Mock DOM APIs
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock document if needed
if (typeof document === 'undefined') {
  global.document = {
    documentElement: {
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      getAttribute: vi.fn()
    }
  } as any;
}

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Add to your existing setup.ts
vi.mock('window', () => ({
  Audio: vi.fn().mockImplementation(() => ({
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    volume: 1,
    loop: false,
  })),
})); 