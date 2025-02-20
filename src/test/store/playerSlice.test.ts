import { describe, it, expect } from 'vitest'
import playerReducer, {
  buyDrug,
  sellDrug,
  travel,
} from '../../store/playerSlice'

describe('Player Slice', () => {
  const initialState = {
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
    adultMode: false,
  }

  describe('buyDrug', () => {
    it('should handle buying drugs when sufficient funds and space', () => {
      const action = buyDrug({ drug: 'Test Drug', quantity: 2, price: 100 })
      const state = playerReducer(initialState, action)

      expect(state.cash).toBe(800)
      expect(state.inventory).toHaveLength(1)
      expect(state.inventory[0]).toEqual({ name: 'Test Drug', quantity: 2 })
    })

    it('should not allow purchase with insufficient funds', () => {
      const action = buyDrug({ drug: 'Test Drug', quantity: 20, price: 100 })
      const state = playerReducer(initialState, action)

      expect(state).toEqual(initialState)
    })
  })

  describe('sellDrug', () => {
    const stateWithInventory = {
      ...initialState,
      inventory: [{ name: 'Test Drug', quantity: 5 }]
    }

    it('should handle selling drugs from inventory', () => {
      const action = sellDrug({ drug: 'Test Drug', quantity: 2, price: 150 })
      const state = playerReducer(stateWithInventory, action)

      expect(state.cash).toBe(1300)
      expect(state.inventory[0].quantity).toBe(3)
    })

    it('should remove item from inventory when selling all', () => {
      const action = sellDrug({ drug: 'Test Drug', quantity: 5, price: 150 })
      const state = playerReducer(stateWithInventory, action)

      expect(state.cash).toBe(1750)
      expect(state.inventory).toHaveLength(0)
    })
  })

  describe('travel', () => {
    it('should update location and increment day', () => {
      const action = travel('New Location')
      const state = playerReducer(initialState, action)

      expect(state.location).toBe('New Location')
      expect(state.currentDay).toBe(2)
    })

    it('should apply debt interest when traveling', () => {
      const stateWithDebt = {
        ...initialState,
        debt: 1000
      }
      const action = travel('New Location')
      const state = playerReducer(stateWithDebt, action)

      expect(state.debt).toBe(1050) // 5% interest
    })
  })
}) 