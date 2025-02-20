import { configureStore } from "@reduxjs/toolkit";
import playerReducer, { PlayerState } from "./playerSlice";
import marketReducer, { MarketState } from "./marketSlice";
import eventReducer, { EventState } from "./eventSlice";

// Debug logging middleware
const loggerMiddleware = () => (next: any) => (action: any) => {
  console.log('Dispatching:', action);
  const result = next(action);
  console.log('Next State:', store.getState());
  return result;
};

export const store = configureStore({
  reducer: {
    player: playerReducer,
    market: marketReducer,
    events: eventReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(loggerMiddleware),
});

export interface RootState {
  player: PlayerState;
  market: MarketState;
  events: EventState;
}

export type AppDispatch = typeof store.dispatch;

// Log initial state
console.log('Initial Redux State:', store.getState()); 