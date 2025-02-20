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
      timeOfDay: [22, 23, 0, 1, 2, 3, 4, 5], // Night hours
      chance: 0.3
    },
    repeatable: true,
    cooldown: 5, // days
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
  // Add more events with conditions
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
    const { reputation, currentDay } = state.player;
    const hour = new Date().getHours();

    const eligibleEvents = enhancedEvents.filter(event => {
      if (event.lastTriggered && 
          currentDay - event.lastTriggered < (event.cooldown || 0)) {
        return false;
      }

      const conditions = event.conditions;
      return (
        (!conditions.minReputation || reputation >= conditions.minReputation) &&
        (!conditions.maxReputation || reputation <= conditions.maxReputation) &&
        (!conditions.location || conditions.location.includes(location)) &&
        (!conditions.timeOfDay || conditions.timeOfDay.includes(hour)) &&
        (Math.random() < (conditions.chance || 1))
      );
    });

    if (eligibleEvents.length === 0) return null;

    const selectedEvent = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
    selectedEvent.lastTriggered = currentDay;
    
    return selectedEvent;
  }
);

export default eventSlice.reducer; 