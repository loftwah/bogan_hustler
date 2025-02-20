/**
 * @vitest-environment jsdom
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import MarketScreen from '../../components/MarketScreen'
import marketReducer from '../../store/marketSlice'
import playerReducer from '../../store/playerSlice'

// Mock react-redux module
vi.mock('react-redux', async () => {
  const actual = await vi.importActual('react-redux')
  return {
    ...actual,
    useDispatch: () => vi.fn()
  }
})

// Mock store setup with realistic test data
const createMockStore = () => configureStore({
  reducer: {
    market: marketReducer,
    player: playerReducer,
  },
  preloadedState: {
    market: {
      prices: {
        'Kings Cross': {
          Ice: { price: 100, supply: 50, demand: 50 },
          Weed: { price: 50, supply: 70, demand: 30 },
        },
      },
      activeMarketEvent: null
    },
    player: {
      location: 'Kings Cross',
      adultMode: true,
      cash: 1000,
      inventory: [{ name: 'Ice', quantity: 5 }],
      inventorySpace: 20,
      debt: 0,
      currentDay: 1,
      maxDays: 30,
      debtInterest: 0.05,
      marketIntel: 50,
      policeEvasion: 0,
      reputation: 0,
    },
  },
})

describe('MarketScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders drug prices and names correctly', () => {
    const store = createMockStore()
    render(
      <Provider store={store}>
        <MarketScreen />
      </Provider>
    )
    expect(screen.getByText('Ice')).toBeInTheDocument()
    expect(screen.getByText('$100')).toBeInTheDocument()
    expect(screen.getByText('Weed')).toBeInTheDocument()
    expect(screen.getByText('$50')).toBeInTheDocument()
  })

  it('shows owned quantity', () => {
    const store = createMockStore()
    render(
      <Provider store={store}>
        <MarketScreen />
      </Provider>
    )
    expect(screen.getByText('Owned: 5')).toBeInTheDocument()
    expect(screen.getByText('Owned: 0')).toBeInTheDocument()
  })
}) 