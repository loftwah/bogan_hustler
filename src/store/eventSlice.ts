import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface EventChoice {
  text: string;
  outcome: {
    cash?: number;
    inventory?: Record<string, number>;
    reputation?: number;
    policeEvasion?: number;
  };
}

interface Event {
  id: string;
  description: string;
  choices: EventChoice[];
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
export default eventSlice.reducer; 