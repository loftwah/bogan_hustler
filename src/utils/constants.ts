// Move magic numbers and constants to a dedicated file
export const GAME_CONSTANTS = {
  MAX_INVENTORY: 100,
  MAX_REPUTATION: 100,
  MIN_REPUTATION: -100,
  BASE_INTEREST_RATE: 0.05,
  MAX_DEBT: 1000000,
  UPGRADE_COSTS: {
    INVENTORY: 500,
    POLICE_EVASION: 1000,
    MARKET_INTEL: 750
  }
} as const; 