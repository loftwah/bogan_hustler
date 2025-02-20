import { describe, it, expect } from 'vitest'
import { calculateMarketDetails, getPriceGuidance } from '../../utils/marketCalculations'

describe('Market Calculations', () => {
  describe('calculateMarketDetails', () => {
    it('should calculate correct max buy based on cash and space', () => {
      const details = calculateMarketDetails(
        100, // price
        0,   // owned
        50,  // supply
        50,  // demand
        500, // cash
        10,  // inventorySpace
        0,   // currentInventoryUsed
        'Test Drug',
        100, // marketIntel
        {}   // nearbyPrices
      )

      expect(details.maxBuy).toBe(5) // Should be limited by cash (500/100 = 5)
    })

    it('should calculate correct max sell based on owned quantity', () => {
      const details = calculateMarketDetails(
        100,
        5, // owned
        50,
        50,
        1000,
        10,
        0,
        'Test Drug',
        100,
        {}
      )

      expect(details.maxSell).toBe(5)
    })

    it('should provide appropriate buy advice based on market conditions', () => {
      const details = calculateMarketDetails(
        100,
        0,
        20,  // low supply
        80,  // high demand
        1000,
        10,
        0,
        'Test Drug',
        100,
        {}
      )

      expect(details.buyAdvice).toBe('⭐ Hot Deal! High demand, low supply')
    })
  })

  describe('getPriceGuidance', () => {
    it('should provide basic guidance with low market intel', () => {
      const guidance = getPriceGuidance(10, 'Test Drug')
      expect(guidance).toBe('Prices are very low')
    })

    it('should provide detailed guidance with high market intel', () => {
      const guidance = getPriceGuidance(80, 'Test Drug')
      expect(guidance).toBe('Prices are very low for Test Drug - Great time to buy!')
    })
  })
}) 