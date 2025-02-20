import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Event {
  id: string;
  description: string;
  choices: {
    text: string;
    outcome: { cash?: number; inventory?: Record<string, number>; reputation?: number };
  }[];
}

interface EventState {
  activeEvent: Event | null;
}

const events: Event[] = [
  {
    id: "police_raid",
    description: "Cops raid your stash in %location%! Bribe 'em or bolt?",
    choices: [
      { text: "Bribe ($200)", outcome: { cash: -200, reputation: 5 } },
      { text: "Run", outcome: { inventory: { Meth: -2 }, reputation: -10 } },
    ],
  },
  {
    id: "bikie_debt",
    description: "Bikies roll up in %location% demandin' cash. Pay or fight?",
    choices: [
      { text: "Pay Up ($300)", outcome: { cash: -300, reputation: 10 } },
      { text: "Fight Back", outcome: { inventory: { Weed: -3 }, reputation: -15 } },
    ],
  },
  {
    id: "market_boom",
    description: "A festival in %location% spikes demand! Sell now?",
    choices: [
      { text: "Sell High", outcome: { cash: 500, inventory: { MDMA: -2 } } },
      { text: "Hold", outcome: { reputation: 5 } },
    ],
  },
];

const initialState: EventState = {
  activeEvent: null,
};

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
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

export const { triggerRandomEvent, clearEvent } = eventSlice.actions;
export default eventSlice.reducer; 