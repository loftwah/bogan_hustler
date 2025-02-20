import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "./store";

interface EventChoice {
  text: string;
  outcome: {
    cash?: number;
    inventory?: Record<string, number>;
    reputation?: number;
    policeEvasion?: number;
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

interface EnhancedEvent extends Event {
  conditions: EventConditions;
  repeatable: boolean;
  cooldown?: number;
  lastTriggered?: number;
}

export interface EventState {
  activeEvent: Event | null;
}

// Define some events
const events: Event[] = [
  {
    id: "police_raid",
    description: "Cops kick down your door in %location%. Your neighbor sold you out.",
    choices: [
      { 
        text: "Bribe ($500)", 
        outcome: { 
          cash: -500, 
          reputation: 5,
          policeEvasion: -10 
        }
      },
      { 
        text: "Run", 
        outcome: { 
          inventory: { Ice: -5, Heroin: -3 }, 
          reputation: -20,
          policeEvasion: 5
        }
      },
    ],
  },
  {
    id: "bikie_shakedown",
    description: "Rebels MC caught you dealing on their turf in %location%. Time to pay up.",
    choices: [
      { 
        text: "Pay Protection ($400)", 
        outcome: { 
          cash: -400, 
          reputation: 15 
        }
      },
      { 
        text: "Tell Them to Get Stuffed", 
        outcome: { 
          inventory: { Ice: -4 }, 
          reputation: -25, 
          cash: -200,
          policeEvasion: -15
        }
      },
    ],
  },
];

const enhancedEvents: EnhancedEvent[] = [
  {
    id: "police_raid",
    description: "Cops kick down your door in %location%. Your neighbor sold you out.",
    conditions: {
      minReputation: -50,
      maxReputation: 50,
      location: ["Kings Cross", "Redfern", "Cabramatta"],
      timeOfDay: [22, 23, 0, 1, 2, 3, 4, 5],
      chance: 0.3
    },
    repeatable: true,
    cooldown: 5,
    choices: [
      { 
        text: "Bribe ($500)", 
        outcome: { 
          cash: -500, 
          reputation: 5,
          policeEvasion: -10 
        }
      },
      { 
        text: "Run", 
        outcome: { 
          inventory: { Ice: -5, Heroin: -3 }, 
          reputation: -20,
          policeEvasion: 5
        }
      },
    ],
  },
  {
    id: "street_deal",
    description: "A sketchy character offers to buy your entire stock in %location%.",
    conditions: {
      minReputation: -100,
      location: ["Kings Cross", "Redfern", "Mount Druitt"],
      timeOfDay: [0, 1, 2, 3, 4],
      chance: 0.2
    },
    repeatable: true,
    cooldown: 3,
    choices: [
      {
        text: "Accept Deal",
        outcome: {
          cash: 1000,
          reputation: -10,
          policeEvasion: -5
        }
      },
      {
        text: "Decline",
        outcome: {
          reputation: 5,
          policeEvasion: 2
        }
      }
    ]
  },
  {
    id: "turf_protection",
    description: "Local gang in %location% demands protection money.",
    conditions: {
      minReputation: -30,
      maxReputation: 30,
      chance: 0.25
    },
    repeatable: true,
    cooldown: 7,
    choices: [
      {
        text: "Pay Up ($300)",
        outcome: {
          cash: -300,
          reputation: 15,
          policeEvasion: 5
        }
      },
      {
        text: "Refuse",
        outcome: {
          reputation: -25,
          policeEvasion: -10,
          inventory: { Ice: -2, Heroin: -1 }
        }
      }
    ]
  },
  {
    id: "festival_opportunity",
    description: "Music festival happening in %location%. Huge demand for party drugs!",
    conditions: {
      location: ["Byron Bay", "Sydney CBD", "Melbourne CBD"],
      timeOfDay: [12, 13, 14, 15, 16, 17, 18, 19, 20],
      chance: 0.4
    },
    repeatable: true,
    cooldown: 14,
    choices: [
      {
        text: "Set Up Shop",
        outcome: {
          cash: 800,
          reputation: 10,
          policeEvasion: -15
        }
      },
      {
        text: "Play It Safe",
        outcome: {
          policeEvasion: 5,
          reputation: -5
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
      const event = events[Math.floor(Math.random() * events.length)];
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

    const eligibleEvents = enhancedEvents.filter(event => {
      // Skip events on cooldown
      if (event.lastTriggered && 
          currentDay - event.lastTriggered < (event.cooldown || 0)) {
        return false;
      }

      const conditions = event.conditions;
      
      // Consider police evasion skill in chance calculation
      const modifiedChance = (conditions.chance || 0) * (1 - policeEvasion / 200);

      return (
        (!conditions.minReputation || reputation >= conditions.minReputation) &&
        (!conditions.maxReputation || reputation <= conditions.maxReputation) &&
        (!conditions.location || conditions.location.includes(location)) &&
        (!conditions.timeOfDay || conditions.timeOfDay.includes(hour)) &&
        (Math.random() < modifiedChance)
      );
    });

    if (eligibleEvents.length === 0) return null;

    // Weight events based on conditions
    const weightedEvents = eligibleEvents.map(event => ({
      event,
      weight: calculateEventWeight(event, state.player)
    }));

    // Select event using weighted random
    const totalWeight = weightedEvents.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    const selectedEvent = weightedEvents.find(e => {
      random -= e.weight;
      return random <= 0;
    })?.event || eligibleEvents[0];

    selectedEvent.lastTriggered = currentDay;
    
    return selectedEvent;
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