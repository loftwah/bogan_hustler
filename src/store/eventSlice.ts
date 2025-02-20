import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Event {
  id: string;
  description: string;
  choices: {
    text: string;
    outcome: { cash?: number; inventory?: number };
  }[];
}

interface EventState {
  activeEvent: Event | null;
}

const initialState: EventState = {
  activeEvent: null,
};

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    triggerRandomEvent: (state) => {
      // For now, just a simple event
      state.activeEvent = {
        id: "police",
        description: "Cops spotted! What do you do?",
        choices: [
          { text: "Run", outcome: { cash: -100 } },
          { text: "Hide", outcome: { inventory: -1 } },
        ],
      };
    },
    clearEvent: (state) => {
      state.activeEvent = null;
    },
  },
});

export const { triggerRandomEvent, clearEvent } = eventSlice.actions;
export default eventSlice.reducer; 