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
    triggerEvent: (state, action: PayloadAction<Event>) => {
      state.activeEvent = action.payload;
    },
    clearEvent: (state) => {
      state.activeEvent = null;
    },
  },
});

export const { triggerEvent, clearEvent } = eventSlice.actions;
export default eventSlice.reducer; 