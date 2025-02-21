import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { PlayerState } from '../types';

// First, let's define the valid drug types
interface DrugInventory {
  Ice: number;
  Heroin: number;
  Weed?: number;
  Cocaine?: number;
  // Add other drugs as needed
}

interface EventOutcome {
  cash?: number;
  inventory?: Partial<DrugInventory>;
  reputation?: number;
  policeEvasion?: number;
}

interface LocationRequirement {
  blacklist: string[];
  failureMessage: string;
}

interface EventChoice {
  text: string;
  outcome: {
    successChance?: number;
    success?: EventOutcome;
    failure?: EventOutcome;
  } | EventOutcome | {
    triggerMinigame: true;
    requireLocation?: LocationRequirement;
  };
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

// First, let's define some standardized outcomes
const standardOutcomes: {
  bribe: {
    text: string;
    baseSuccess: number;
    success: EventOutcome;
    failure: EventOutcome;
  };
  run: {
    text: string;
    baseSuccess: number;
    success: EventOutcome;
    failure: EventOutcome;
  };
  fight: {
    text: string;
    outcome: {
      triggerMinigame: true;
      requireLocation: LocationRequirement;
    };
  };
} = {
  bribe: {
    text: "💰 Bribe",
    baseSuccess: 0.75,
    success: {
      cash: -500,
      reputation: 15,
      policeEvasion: 5,
      inventory: {}
    },
    failure: {
      cash: -500,
      reputation: -15,
      policeEvasion: -10,
      inventory: { Ice: -2 }
    }
  },
  run: {
    text: "🏃 Run",
    baseSuccess: 0.65,
    success: {
      cash: 0,
      reputation: -10,
      policeEvasion: 10,
      inventory: {}
    },
    failure: {
      cash: -750,
      reputation: -25,
      policeEvasion: -15,
      inventory: { Ice: -3 }
    }
  },
  fight: {
    text: "👊 Fight",
    outcome: {
      triggerMinigame: true,
      requireLocation: {
        blacklist: ["Melbourne CBD", "Kings Cross"],
        failureMessage: "Too many witnesses here for a fight!"
      }
    }
  }
};

// Helper function to create standardized choices with custom modifications
const createEventChoices = (modifications: {
  bribe?: Partial<typeof standardOutcomes.bribe>,
  run?: Partial<typeof standardOutcomes.run>,
  fight?: Partial<typeof standardOutcomes.fight>
}) => {
  return [
    {
      text: `${standardOutcomes.bribe.text} ($${Math.abs(modifications.bribe?.success?.cash ?? standardOutcomes.bribe.success.cash ?? 0)})`,
      outcome: {
        successChance: modifications.bribe?.baseSuccess || standardOutcomes.bribe.baseSuccess,
        success: { ...standardOutcomes.bribe.success, ...modifications.bribe?.success },
        failure: { ...standardOutcomes.bribe.failure, ...modifications.bribe?.failure }
      }
    },
    {
      text: standardOutcomes.run.text,
      outcome: {
        successChance: modifications.run?.baseSuccess || standardOutcomes.run.baseSuccess,
        success: { ...standardOutcomes.run.success, ...modifications.run?.success },
        failure: { ...standardOutcomes.run.failure, ...modifications.run?.failure }
      }
    },
    {
      text: standardOutcomes.fight.text,
      outcome: {
        ...standardOutcomes.fight.outcome,
        requireLocation: modifications.fight?.outcome?.requireLocation || standardOutcomes.fight.outcome.requireLocation
      }
    }
  ];
};

// Now we can define events much more concisely
export const enhancedEvents: EnhancedEvent[] = [
  {
    id: "police_raid",
    description: "Cops kick down your door in %location%. Your neighbor sold you out.",
    conditions: {
      minReputation: -50,
      maxReputation: 50,
      timeOfDay: [22, 23, 0, 1, 2, 3, 4, 5],
      chance: 0.3
    },
    repeatable: true,
    cooldown: 5,
    choices: createEventChoices({
      bribe: {
        success: { 
          cash: -500, 
          reputation: 15,
          policeEvasion: 5,
          inventory: {}
        },
        failure: { 
          cash: -500,
          reputation: -15,
          policeEvasion: -10,
          inventory: { Ice: -2, Heroin: -1 }
        }
      },
      fight: {
        outcome: {
          triggerMinigame: true,
          requireLocation: {
            blacklist: ["Melbourne CBD", "Kings Cross", "St Kilda"],
            failureMessage: "Security is too tight here for a fight!"
          }
        }
      }
    })
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
          inventory: {}
        },
        failure: { 
          cash: -500,
          reputation: -15,
          policeEvasion: -10,
          inventory: { Ice: -2 }
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
            inventory: { Ice: 5 }
          },
          failure: {
            cash: -2000,
            reputation: -20,
            policeEvasion: -15,
            inventory: {}
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
            inventory: {}
          },
          failure: {
            cash: -1000,
            reputation: -30,
            policeEvasion: -10,
            inventory: { Ice: -2 }
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
            inventory: {}
          },
          failure: {
            cash: -1000,
            reputation: -15,
            policeEvasion: -10,
            inventory: {}
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
            inventory: {}
          },
          failure: {
            cash: -1500,
            reputation: -25,
            policeEvasion: -15,
            inventory: { Ice: -3 }
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
            inventory: {}
          },
          failure: {
            cash: -500,
            reputation: -15,
            policeEvasion: -5,
            inventory: { Ice: -2 }
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
            inventory: {}
          },
          failure: {
            cash: -750,
            reputation: -25,
            policeEvasion: -10,
            inventory: { Ice: -3 }
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
    const hour = new Date().getHours();

    // Increase base chance of events
    const baseEventChance = 0.4; // Increased from 0.2
    const modifiedChance = baseEventChance * (1 - policeEvasion / 200);

    if (Math.random() > modifiedChance) return null;

    // First, filter events by cooldown
    const availableEvents = enhancedEvents.filter(event => {
      if (!event.repeatable) return false;
      if (event.lastTriggered && event.cooldown) {
        const daysSinceLastTrigger = currentDay - event.lastTriggered;
        if (daysSinceLastTrigger < event.cooldown) {
          return false;
        }
      }
      return true;
    });

    // Then, filter by other conditions and prioritize location-specific events
    const eligibleEvents = availableEvents.filter(event => {
      const conditions = event.conditions;
      
      // Basic condition checks
      const meetsBasicConditions = (
        (!conditions.minReputation || reputation >= conditions.minReputation) &&
        (!conditions.maxReputation || reputation <= conditions.maxReputation) &&
        (!conditions.timeOfDay || conditions.timeOfDay.includes(hour))
      );

      if (!meetsBasicConditions) return false;

      // Location check
      if (conditions.location) {
        return conditions.location.includes(location);
      }

      return false; // Only allow location-specific events
    });

    console.log('Eligible events:', eligibleEvents.map(e => e.id));

    if (eligibleEvents.length === 0) return null;

    // Weight events based on conditions
    const weightedEvents = eligibleEvents.map(event => ({
      id: event.id,
      weight: calculateEventWeight(event, state.player)
    }));

    console.log('Weighted events:', weightedEvents.map(e => ({
      id: e.id,
      weight: e.weight
    })));

    // Select event using weighted random
    const totalWeight = weightedEvents.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    console.log('Event selection:', { totalWeight, random });

    let selectedEvent = null;
    for (const { id, weight } of weightedEvents) {
      random -= weight;
      if (random <= 0) {
        selectedEvent = enhancedEvents.find(e => e.id === id);
        break;
      }
    }

    if (selectedEvent) {
      // Update the lastTriggered time when an event is selected
      selectedEvent.lastTriggered = currentDay;
      console.log('Selected event:', selectedEvent.id);
      return selectedEvent;
    }

    return null;
  }
);

// Helper function to calculate event weights
const calculateEventWeight = (event: EnhancedEvent, player: PlayerState): number => {
  let weight = 1;

  // Increase weight for police events when police evasion is low
  if (event.id.includes('police') && player.policeEvasion < 50) {
    weight *= 1.5;
  }

  // Increase weight for gang events when reputation is low
  if (event.id.includes('gang') && player.reputation < 0) {
    weight *= 1.3;
  }

  return weight;
};

export default eventSlice.reducer; 