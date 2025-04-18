import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { PlayerState } from '../types';
import { getLocationType } from './marketSlice';

export interface InventoryItem {
  name: string;
  quantity: number;
}

export interface EventOutcome {
  cash?: number;
  reputation?: number;
  inventory?: InventoryItem[];
  message?: string;
  policeEvasion?: number;
}

export interface LocationRequirement {
  blacklist: string[];
  failureMessage: string;
}

export interface EventChoiceOutcome {
  successChance?: number;
  success?: EventOutcome;
  failure?: EventOutcome;
  baseEffects?: EventOutcome;
  catchChance?: number;
  caughtEffects?: EventOutcome;
  triggerMinigame?: boolean;
  requireLocation?: LocationRequirement;
  opponentType?: 'police' | 'gang' | 'bikie' | 'dealer';
  combatModifiers?: {
    playerDamageMultiplier?: number;
    opponentHealthMultiplier?: number;
    specialEffects?: {
      bleed?: number;
      stun?: number;
    };
  };
}

export interface EventChoice {
  text: string;
  outcome: EventOutcome | EventChoiceOutcome;
}

interface EventConditions {
  minReputation?: number;
  maxReputation?: number;
  location?: string[];
  timeOfDay?: number[];
  chance?: number;
}

interface Event {
  id: string;
  description: string;
  choices: EventChoice[];
}

export interface EnhancedEvent extends Event {
  conditions: EventConditions;
  repeatable: boolean;
  cooldown?: number;
  lastTriggered?: number;
}

export interface EventState {
  activeEvent: Event | null;
}

// First fix the standardOutcomes interface
interface StandardOutcome {
  text?: string;
  baseEffects?: EventOutcome;
  catchChance?: number;
  caughtEffects?: EventOutcome;
  success?: EventOutcome;
  failure?: EventOutcome;
  outcome?: {
    triggerMinigame?: boolean;
    requireLocation?: LocationRequirement;
    opponentType?: 'police' | 'gang' | 'bikie' | 'dealer';
    combatModifiers?: {
      playerDamageMultiplier?: number;
      opponentHealthMultiplier?: number;
      specialEffects?: {
        bleed?: number;
        stun?: number;
      };
    };
  };
}

// Update the standardOutcomes object
const standardOutcomes: Record<string, StandardOutcome> = {
  bribe: {
    text: "💰 Bribe",
    success: {
      cash: -500,
      reputation: 15,
      policeEvasion: 0,
      inventory: []
    },
    failure: {
      cash: -750,
      reputation: -20,
      policeEvasion: -10,
      inventory: [{ name: "Ice", quantity: -2 }]
    }
  },
  fight: {
    text: "👊 Fight",
    outcome: {
      triggerMinigame: true as const,
      opponentType: 'police' as const,
      requireLocation: {
        blacklist: ["Kings Cross", "Sydney CBD"],
        failureMessage: "Can't fight here - too many witnesses!"
      },
      combatModifiers: {
        playerDamageMultiplier: 1.0,
        opponentHealthMultiplier: 1.0,
        specialEffects: {
          bleed: 0.1,
          stun: 0.05
        }
      }
    }
  },
  runaway: {
    text: "🏃 Run Away",
    success: {
      cash: 0,
      reputation: -10,
      policeEvasion: 10,
      inventory: []
    },
    failure: {
      cash: -200,
      reputation: -15,
      policeEvasion: -5,
      inventory: []
    }
  }
};

// Update createEventChoices to handle the new structure
const createEventChoices = (modifications: Partial<Record<string, StandardOutcome>> = {}): EventChoice[] => {
  return [
    {
      text: standardOutcomes.bribe.text || "💰 Bribe",
      outcome: {
        successChance: 0.7,
        success: {
          ...standardOutcomes.bribe.success,
          ...(modifications.bribe?.success || {})
        },
        failure: {
          ...standardOutcomes.bribe.failure,
          ...(modifications.bribe?.failure || {})
        }
      }
    },
    {
      text: standardOutcomes.fight.text || "👊 Fight",
      outcome: {
        triggerMinigame: true as const,
        opponentType: modifications.fight?.outcome?.opponentType || 'police',
        requireLocation: standardOutcomes.fight.outcome?.requireLocation || {
          blacklist: [],
          failureMessage: "You can't fight here!"
        }
      }
    },
    {
      text: standardOutcomes.runaway.text || "🏃 Run Away",
      outcome: {
        successChance: 0.7,
        success: {
          ...standardOutcomes.runaway.success,
          ...(modifications.runaway?.success || {})
        },
        failure: {
          ...standardOutcomes.runaway.failure,
          ...(modifications.runaway?.failure || {})
        }
      }
    }
  ];
};

// Now we can define events much more concisely
export const enhancedEvents: EnhancedEvent[] = [
  {
    id: 'police_raid',
    description: "Police are conducting a raid! What's your move?",
    choices: [
      {
        text: "💰 Bribe ($500)",
        outcome: standardOutcomes.bribe
      },
      {
        text: "👊 Fight",
        outcome: standardOutcomes.fight
      },
      {
        text: "🏃 Run Away",
        outcome: standardOutcomes.runaway
      }
    ],
    conditions: {
      minReputation: -100,
      maxReputation: 100,
      chance: 0.3
    },
    repeatable: true,
    cooldown: 3
  },
  {
    id: 'gang_encounter',
    description: "Local gang members have spotted you! They demand payment!",
    choices: [
      {
        text: "💰 Pay them off ($500)",
        outcome: standardOutcomes.bribe
      },
      {
        text: "👊 Stand and Fight",
        outcome: standardOutcomes.fight
      },
      {
        text: "🏃 Run Away",
        outcome: standardOutcomes.runaway
      }
    ],
    conditions: {
      minReputation: -100,
      maxReputation: 100,
      chance: 0.25
    },
    repeatable: true,
    cooldown: 4
  },
  {
    id: "bikie_shakedown",
    description: "Rebels MC caught you dealing on their turf in %location%. Time to pay up.",
    conditions: {
      minReputation: -30,
      maxReputation: 70,
      chance: 0.25
    },
    repeatable: true,
    cooldown: 7,
    choices: createEventChoices({
      bribe: {
        success: { 
          cash: -600, 
          reputation: 15,
          policeEvasion: 5,
          inventory: []
        },
        failure: { 
          cash: -500,
          reputation: -15,
          policeEvasion: -10,
          inventory: [{ name: "Ice", quantity: -2 }]
        }
      }
    })
  },
  {
    id: "underbelly_meeting",
    description: "Carl Williams wants to meet at %location%. Says he's got a business proposition.",
    conditions: {
      minReputation: 30,
      location: ["Carlton", "Melbourne CBD", "St Kilda"],
      chance: 0.2
    },
    repeatable: false,
    choices: [
      { 
        text: "💰 Pay Protection ($2000)", 
        outcome: { 
          successChance: 0.8,
          success: {
            cash: -2000,
            reputation: 30,
            policeEvasion: -10,
            inventory: [{ name: "Ice", quantity: 5 }]
          },
          failure: {
            cash: -2000,
            reputation: -20,
            policeEvasion: -15,
            inventory: []
          }
        }
      },
      { 
        text: "🏃 Lay Low", 
        outcome: {
          successChance: 0.7,
          success: {
            cash: 0,
            reputation: -15,
            policeEvasion: 10,
            inventory: []
          },
          failure: {
            cash: -1000,
            reputation: -30,
            policeEvasion: -10,
            inventory: [{ name: "Ice", quantity: -2 }]
          }
        }
      },
      {
        text: "👊 Stand Your Ground",
        outcome: {
          triggerMinigame: true,
          requireLocation: {
            blacklist: ["Melbourne CBD", "Kings Cross"],
            failureMessage: "Too many witnesses here for a fight!"
          }
        }
      }
    ]
  },
  {
    id: "chopper_shakedown",
    description: "Mark 'Chopper' Read caught wind of your operation. He's waiting outside.",
    conditions: {
      minReputation: -20,
      maxReputation: 40,
      location: ["Melbourne CBD", "Pentridge", "Brunswick"],
      chance: 0.15
    },
    repeatable: true,
    cooldown: 14,
    choices: [
      { 
        text: "💰 Pay Protection ($1000)", 
        outcome: {
          successChance: 0.75,
          success: {
            cash: -1000,
            reputation: 25,
            policeEvasion: 10,
            inventory: []
          },
          failure: {
            cash: -1000,
            reputation: -15,
            policeEvasion: -10,
            inventory: []
          }
        }
      },
      { 
        text: "🏃 Lay Low", 
        outcome: {
          successChance: 0.7,
          success: {
            cash: 0,
            reputation: -10,
            policeEvasion: 15,
            inventory: []
          },
          failure: {
            cash: -1500,
            reputation: -25,
            policeEvasion: -15,
            inventory: [{ name: "Ice", quantity: -3 }]
          }
        }
      },
      {
        text: "👊 Stand Your Ground",
        outcome: {
          triggerMinigame: true,
          requireLocation: {
            blacklist: ["Melbourne CBD"],
            failureMessage: "Too many witnesses here for a fight!"
          }
        }
      }
    ]
  },
  {
    id: "kings_cross_incident",
    description: "John Ibrahim's boys spotted you dealing on their turf in %location%.",
    conditions: {
      location: ["Kings Cross"],
      chance: 0.25
    },
    repeatable: true,
    cooldown: 10,
    choices: [
      { 
        text: "💰 Pay Territory Fee ($500)", 
        outcome: {
          successChance: 0.8,
          success: {
            cash: -500,
            reputation: 20,
            policeEvasion: 5,
            inventory: []
          },
          failure: {
            cash: -500,
            reputation: -15,
            policeEvasion: -5,
            inventory: [{ name: "Ice", quantity: -2 }]
          }
        }
      },
      { 
        text: "🏃 Move to Different Area", 
        outcome: {
          successChance: 0.7,
          success: {
            cash: 0,
            reputation: -15,
            policeEvasion: 10,
            inventory: []
          },
          failure: {
            cash: -750,
            reputation: -25,
            policeEvasion: -10,
            inventory: [{ name: "Ice", quantity: -3 }]
          }
        }
      },
      {
        text: "👊 Stand Your Ground",
        outcome: {
          triggerMinigame: true,
          requireLocation: {
            blacklist: ["Kings Cross CBD"],
            failureMessage: "Too many witnesses here for a fight!"
          }
        }
      }
    ]
  },
  {
    id: "junkie_story",
    description: "A wild-eyed bloke at %location% starts telling you about the time he fought off a drop bear while high on ice.",
    conditions: {
      chance: 0.15,
      minReputation: -50
    },
    repeatable: true,
    cooldown: 7,
    choices: [
      {
        text: "🎭 Listen to his story",
        outcome: {
          successChance: 0.7,
          success: {
            cash: -50,
            reputation: 5,
            policeEvasion: 0,
            inventory: []
          },
          failure: {
            cash: -100,
            reputation: -5,
            policeEvasion: 0,
            inventory: []
          }
        }
      },
      {
        text: "💊 Share some gear",
        outcome: {
          successChance: 0.8,
          success: {
            cash: 0,
            reputation: 10,
            policeEvasion: 5,
            inventory: [{ name: "Ice", quantity: -1 }]
          },
          failure: {
            cash: 0,
            reputation: -10,
            policeEvasion: -5,
            inventory: [{ name: "Ice", quantity: -2 }]
          }
        }
      }
    ]
  }
];

const initialState: EventState = {
  activeEvent: null
};

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    triggerEvent: (state, action: PayloadAction<Event>) => {
      state.activeEvent = action.payload;
    },
    triggerRandomEvent: (state, action: PayloadAction<string>) => {
      const location = action.payload;
      const event = enhancedEvents[Math.floor(Math.random() * enhancedEvents.length)];
      state.activeEvent = {
        ...event,
        description: event.description.replace("%location%", location),
      };
    },
    clearEvent: (state) => {
      state.activeEvent = null;
    },
  },
});

export const { triggerEvent, triggerRandomEvent, clearEvent } = eventSlice.actions;

// Update event trigger logic
export const triggerRandomEventAsync = createAsyncThunk(
  'events/triggerRandom',
  async (location: string, { getState }) => {
    const state = getState() as RootState;
    const { reputation, currentDay, policeEvasion } = state.player;
    const isDebugMode = window.location.search.includes('debug=true');
    
    // Check if we're on mobile to increase event frequency
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // IMPORTANT FIXES:
    // 1. Significantly increase base event chance 
    // 2. Reduce police evasion impact to ensure events still trigger
    // 3. Provide even higher chance on mobile devices
    
    // Increase base event chance
    const baseEventChance = isMobileDevice ? 0.85 : 0.75; // 85% on mobile, 75% on desktop (increased from 0.7)
    const modifiedChance = baseEventChance * (1 - policeEvasion / 400); // Further reduced police evasion impact
    
    if (isDebugMode) {
      console.log(`[Event System] Base chance: ${baseEventChance.toFixed(2)}, Modified chance: ${modifiedChance.toFixed(2)}, Mobile: ${isMobileDevice}`);
    }
    
    if (Math.random() > modifiedChance) {
      if (isDebugMode) {
        console.log('[Event System] Random roll failed, no event triggered');
      }
      return null;
    }

    // Get all events that could potentially trigger in this location
    const locationEvents = enhancedEvents.filter(event => {
      // If no location specified in conditions, event can happen anywhere
      if (!event.conditions.location) return true;
      return event.conditions.location.includes(location);
    });

    if (isDebugMode) {
      console.log(`[Event System] Found ${locationEvents.length} possible events for location ${location}`);
    }
    
    if (locationEvents.length === 0) {
      return null;
    }

    // Filter events by cooldown - but with much more lenient checks
    const availableEvents = locationEvents.filter(event => {
      // Non-repeatable events that haven't triggered yet
      if (!event.repeatable && !event.lastTriggered) return true;
      
      // Repeatable events with cooldown
      if (event.repeatable && event.lastTriggered && event.cooldown) {
        const daysSinceLastTrigger = currentDay - event.lastTriggered;
        
        // Reduce cooldown even more for mobile
        const cooldownReduction = isMobileDevice ? 0.2 : 0.3; // 80% reduction on mobile, 70% on desktop
        const adjustedCooldown = Math.max(1, Math.ceil(event.cooldown * cooldownReduction));
        
        if (daysSinceLastTrigger < adjustedCooldown) {
          if (isDebugMode) {
            console.log(`[Event System] Event ${event.id} on cooldown. Days since trigger: ${daysSinceLastTrigger}, Adjusted cooldown: ${adjustedCooldown}`);
          }
          return false;
        }
      }
      return true;
    });

    if (isDebugMode) {
      console.log(`[Event System] ${availableEvents.length} events available after cooldown check`);
    }
    
    if (availableEvents.length === 0) {
      return null;
    }

    // Filter by reputation and other conditions
    const eligibleEvents = availableEvents.filter(event => {
      const conditions = event.conditions;
      
      return (!conditions.minReputation || reputation >= conditions.minReputation) &&
             (!conditions.maxReputation || reputation <= conditions.maxReputation);
    });

    if (isDebugMode) {
      console.log(`[Event System] ${eligibleEvents.length} events eligible after reputation check`);
    }
    
    if (eligibleEvents.length === 0) {
      return null;
    }

    // Weight events based on their 'chance' property for better distribution
    const totalWeight = eligibleEvents.reduce((sum, event) => sum + (event.conditions.chance || 0.1), 0);
    let random = Math.random() * totalWeight;
    
    let selectedEvent = eligibleEvents[0]; // Default to first event
    
    for (const event of eligibleEvents) {
      random -= (event.conditions.chance || 0.1);
      if (random <= 0) {
        selectedEvent = event;
        break;
      }
    }
    
    if (isDebugMode) {
      console.log(`[Event System] Selected event: ${selectedEvent.id}`);
    }
    
    // Update lastTriggered
    selectedEvent.lastTriggered = currentDay;
    
    // Save event to localStorage for persistence (new)
    try {
      localStorage.setItem('lastTriggeredEvent', JSON.stringify({
        id: selectedEvent.id,
        day: currentDay,
        timestamp: Date.now()
      }));
    } catch (e) {
      if (isDebugMode) {
        console.error('[Event System] Failed to save event to localStorage', e);
      }
    }
    
    return {
      ...selectedEvent,
      description: selectedEvent.description.replace("%location%", location)
    };
  }
);

// Helper function to calculate event weights
export const calculateEventWeight = (event: EnhancedEvent, player: PlayerState): number => {
  let weight = 1;

  // Increase weight for police events when police evasion is low
  if (event.id.includes('police') && player.policeEvasion < 50) {
    weight *= 1.5;
  }

  // Increase weight for gang events when reputation is low
  if (event.id.includes('gang') && player.reputation < 0) {
    weight *= 1.3;
  }

  // Add time-based risk
  const hour = new Date().getHours();
  if (hour >= 22 || hour <= 4) {
    weight *= 1.2; // 20% more likely at night
  }
  
  // Add location-based risk
  const locationType = getLocationType(player.location);
  if (locationType === 'hardcoreArea') {
    weight *= 1.3; // 30% more likely in hardcore areas
  } else if (locationType === 'cityCenter') {
    weight *= 0.8; // 20% less likely in city centers
  }

  return weight;
};

export const getEventCooldownStatus = (event: EnhancedEvent, currentDay: number): string => {
  if (!event.repeatable || !event.cooldown || !event.lastTriggered) return '';
  
  const daysSinceLastTrigger = currentDay - event.lastTriggered;
  const daysRemaining = event.cooldown - daysSinceLastTrigger;
  
  if (daysRemaining <= 0) return 'Ready';
  return `${daysRemaining} days`;
};

export default eventSlice.reducer; 