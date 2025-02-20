import { configureStore } from "@reduxjs/toolkit";
import playerReducer from "./playerSlice";
import marketReducer from "./marketSlice";
import eventReducer from "./eventSlice";

export const store = configureStore({
  reducer: {
    player: playerReducer,
    market: marketReducer,
    events: eventReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 