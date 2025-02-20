import { MarketTrend, MarketItemDetails } from '../types';

export const analyzeTrend = (supply: number, demand: number, marketIntel: number): MarketTrend => {
  if (marketIntel < 25) {
    return {
      direction: 'stable',
      strength: 0,
      description: 'Market trend unknown - Need more intel'
    };
  }

  const trendStrength = Math.abs(demand - supply);
  const direction = demand > supply ? 'up' : demand < supply ? 'down' : 'stable';
  
  return {
    direction,
    strength: trendStrength,
    description: (() => {
      if (trendStrength > 50) {
        return direction === 'up' ? '🚀 Strong upward trend' : '📉 Sharp price drop';
      } else if (trendStrength > 25) {
        return direction === 'up' ? '📈 Moderate rise' : '↘️ Gradual decline';
      }
      return '→ Stable market';
    })()
  };
};

export const getPriceGuidance = (marketIntel: number, drugName: string): string => {
  const baseMessage = "Prices are very low";
  
  if (marketIntel > 50) {
    return `${baseMessage} for ${drugName} - Great time to buy!`;
  }
  
  return baseMessage;
};

export const calculateMarketDetails = (
  price: number,
  owned: number,
  supply: number,
  demand: number,
  cash: number,
  inventorySpace: number,
  currentInventoryUsed: number,
  drugName: string,
  marketIntel: number,
  nearbyPrices: Record<string, number>,
  previousPrice?: number
): MarketItemDetails & { trend: MarketTrend; priceChange?: string } => {
  const spaceLeft = inventorySpace - currentInventoryUsed;
  const maxBuyBySpace = spaceLeft;
  const maxBuyByCash = Math.floor(cash / price);
  const maxBuy = Math.min(maxBuyBySpace, maxBuyByCash);
  
  const maxSell = owned;
  const totalCost = maxBuy * price;
  const potentialProfit = maxSell * price;
  
  const supplyTrend = (() => {
    if (marketIntel < 25) return "Unknown supply levels";
    if (supply > 75) return "High Supply - Prices Dropping 📉"; 
    if (supply < 25) return "Low Supply - Prices Rising 📈";
    return "Stable Supply";
  })();
    
  const demandTrend = (() => {
    if (marketIntel < 25) return "Unknown demand levels";
    if (demand > 75) return "High Demand - Prices Rising 📈";
    if (demand < 25) return "Low Demand - Prices Dropping 📉";
    return "Stable Demand";
  })();

  const priceGuidance = getPriceGuidance(marketIntel, drugName);
  
  let nearbyComparison = "";
  if (nearbyPrices && Object.keys(nearbyPrices).length > 0) {
    const avgNearbyPrice = Object.values(nearbyPrices).reduce((a, b) => a + b, 0) / Object.values(nearbyPrices).length;
    const priceDiff = ((price - avgNearbyPrice) / avgNearbyPrice * 100).toFixed(1);
    nearbyComparison = `${Number(priceDiff) > 0 ? '📈' : '📉'} ${Math.abs(Number(priceDiff))}% vs nearby`;
  }

  const potentialProfitPercent = (() => {
    if (price <= 0 || owned <= 0) return '0';
    const buyValue = owned * price;
    const sellValue = potentialProfit;
    const profit = sellValue - buyValue;
    return (profit / buyValue * 100).toFixed(1);
  })();
  
  const buyAdvice = (() => {
    if (marketIntel < 25) return "Need more market intel";
    if (price <= 0) return "Not available for purchase";
    if (maxBuy <= 0) return "Can't buy - no space or cash";
    if (supply < 25 && demand > 75) return "⭐ Hot Deal! High demand, low supply";
    if (supply > 75 && demand < 25) return "⚠️ Risky Buy - High supply, low demand";
    if (Number(potentialProfitPercent) > 50) return "💎 High profit potential!";
    if (supply < 40 && demand > 60) return "👍 Good conditions to buy";
    if (supply > 60 && demand < 40) return "👎 Poor conditions to buy";
    return "📊 Average market conditions";
  })();

  const trend = analyzeTrend(supply, demand, marketIntel);
  
  const priceChange = previousPrice 
    ? ((price - previousPrice) / previousPrice * 100).toFixed(1)
    : undefined;

  return {
    maxBuy,
    maxSell,
    totalCost,
    potentialProfit,
    potentialProfitPercent,
    supplyTrend,
    demandTrend,
    priceGuidance,
    nearbyComparison,
    buyAdvice,
    trend,
    priceChange
  };
}; 