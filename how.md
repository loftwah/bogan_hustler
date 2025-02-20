# Bogan Hustler: The Straya Edition - Full Development Guide with Bun, Vite, React, and Strict TypeScript

This guide walks you through building **Bogan Hustler: The Straya Edition**, an Aussie-flavored web game inspired by _Drugwars_. It uses **Bun** as the package manager, **Vite** for fast builds, **React** for the frontend, and is deployed to **GitHub Pages**.

**Requirement**: This project uses **strict TypeScript** for type safety and scalability.

**Current Date**: February 19, 2025 (assumed for tool compatibility).

---

## Step 1: Set Up the Project

1. **Install Bun**

   ```
   curl -fsSL https://bun.sh/install | bash
   bun --version
   ```

2. **Scaffold with Vite + React + TypeScript**

   ```
   bun create vite bogan-hustler --template react-ts
   cd bogan-hustler
   ```

3. **Install Dependencies**

   ```
   bun install
   ```

4. **Run the Dev Server**

   ```
   bun run dev
   ```

   - Open `http://localhost:5173`.

5. **Set Up Git**
   ```
   git init
   git add .
   git commit -m "Initial commit with Bun, Vite, React, and strict TypeScript"
   ```

---

## Step 2: Install Additional Dependencies

```
bun add @reduxjs/toolkit react-redux
bun add --dev gh-pages @types/react @types/react-dom
```

---

## Step 3: Set Up Redux with Strict TypeScript

1. **Redux Store**

   - File: `src/store/store.ts`

   ```typescript
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
   ```

2. **Player Slice**

   - File: `src/store/playerSlice.ts`

   ```typescript
   import { createSlice, PayloadAction } from "@reduxjs/toolkit";

   interface Drug {
     name: string;
     quantity: number;
   }

   interface PlayerState {
     cash: number;
     inventory: Drug[];
     inventorySpace: number;
     reputation: number;
     location: string;
     currentDay: number;
     maxDays: number;
   }

   const initialState: PlayerState = {
     cash: 1000,
     inventory: [],
     inventorySpace: 10,
     reputation: 0,
     location: "Sydney",
     currentDay: 1,
     maxDays: 30,
   };

   const playerSlice = createSlice({
     name: "player",
     initialState,
     reducers: {
       travel: (state, action: PayloadAction<string>) => {
         state.location = action.payload;
         state.currentDay += 1;
       },
       buyDrug: (
         state,
         action: PayloadAction<{
           drug: string;
           quantity: number;
           price: number;
         }>
       ) => {
         const { drug, quantity, price } = action.payload;
         const totalCost = price * quantity;
         const currentSpace = state.inventory.reduce(
           (acc, item) => acc + item.quantity,
           0
         );
         if (
           state.cash >= totalCost &&
           currentSpace + quantity <= state.inventorySpace
         ) {
           state.cash -= totalCost;
           const existing = state.inventory.find((item) => item.name === drug);
           if (existing) {
             existing.quantity += quantity;
           } else {
             state.inventory.push({ name: drug, quantity });
           }
         }
       },
       sellDrug: (
         state,
         action: PayloadAction<{
           drug: string;
           quantity: number;
           price: number;
         }>
       ) => {
         const { drug, quantity, price } = action.payload;
         const totalEarned = price * quantity;
         const item = state.inventory.find((item) => item.name === drug);
         if (item && item.quantity >= quantity) {
           state.cash += totalEarned;
           item.quantity -= quantity;
           if (item.quantity === 0) {
             state.inventory = state.inventory.filter((i) => i.name !== drug);
           }
         }
       },
       upgradeInventory: (state) => {
         if (state.cash >= 500) {
           state.cash -= 500;
           state.inventorySpace += 5;
         }
       },
     },
   });

   export const { travel, buyDrug, sellDrug, upgradeInventory } =
     playerSlice.actions;
   export default playerSlice.reducer;
   ```

3. **Market Slice**

   - File: `src/store/marketSlice.ts`

   ```typescript
   import { createSlice } from "@reduxjs/toolkit";

   interface LocationDrugs {
     [drug: string]: { price: number };
   }

   interface MarketState {
     prices: {
       [location: string]: LocationDrugs;
     };
   }

   const locations: Record<string, { drugs: string[]; policeRisk: number }> = {
     Sydney: { drugs: ["Meth", "Cocaine", "MDMA"], policeRisk: 0.2 },
     Melbourne: { drugs: ["Weed", "Ketamine", "Xannies"], policeRisk: 0.1 },
     "Gold Coast": { drugs: ["Meth", "Steroids"], policeRisk: 0.15 },
     Perth: { drugs: ["Meth", "Cocaine"], policeRisk: 0.1 },
     Darwin: { drugs: ["Weed", "MDMA"], policeRisk: 0.25 },
     "Alice Springs": { drugs: ["Weed"], policeRisk: 0.05 },
     "Byron Bay": { drugs: ["Weed", "Ketamine"], policeRisk: 0.08 },
     Adelaide: { drugs: ["Xannies", "Meth"], policeRisk: 0.1 },
     Tasmania: { drugs: ["Weed"], policeRisk: 0.05 },
   };

   const initialState: MarketState = {
     prices: Object.keys(locations).reduce((acc, loc) => {
       acc[loc] = locations[loc].drugs.reduce((drugs, drug) => {
         drugs[drug] = { price: Math.floor(Math.random() * 50) + 50 };
         return drugs;
       }, {} as LocationDrugs);
       return acc;
     }, {} as MarketState["prices"]),
   };

   const marketSlice = createSlice({
     name: "market",
     initialState,
     reducers: {
       updatePrices: (state) => {
         for (const loc in state.prices) {
           for (const drug in state.prices[loc]) {
             const fluctuation = Math.floor(Math.random() * 20) - 10;
             state.prices[loc][drug].price = Math.max(
               20,
               Math.min(200, state.prices[loc][drug].price + fluctuation)
             );
           }
           if (Math.random() < 0.1) {
             state.prices[loc]["Green Script"] = { price: 150 };
           }
         }
       },
     },
   });

   export const { updatePrices } = marketSlice.actions;
   export default marketSlice.reducer;
   ```

4. **Event Slice**

   - File: `src/store/eventSlice.ts`

   ```typescript
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
   ```

5. **Integrate Redux**

   - File: `src/main.tsx`

   ```typescript
   import React from "react";
   import ReactDOM from "react-dom/client";
   import { Provider } from "react-redux";
   import { store } from "./store/store";
   import App from "./App";
   import "./index.css";

   ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
     <React.StrictMode>
       <Provider store={store}>
         <App />
       </Provider>
     </React.StrictMode>
   );
   ```

---

## Step 4: Create Components

1. **Main App**

   - File: `src/App.tsx`

   ```typescript
   import React, { useState, useEffect } from "react";
   import { useSelector } from "react-redux";
   import MapScreen from "./components/MapScreen";
   import MarketScreen from "./components/MarketScreen";
   import InventoryScreen from "./components/InventoryScreen";
   import EventPopup from "./components/EventPopup";
   import { RootState } from "./store/store";
   import "./App.css";

   function App(): JSX.Element {
     const [currentScreen, setCurrentScreen] = useState<
       "main" | "map" | "market" | "inventory"
     >("main");
     const { cash, location, currentDay, maxDays } = useSelector(
       (state: RootState) => state.player
     );
     const { activeEvent } = useSelector((state: RootState) => state.events);

     useEffect(() => {
       localStorage.setItem(
         "gameState",
         JSON.stringify({ cash, location, currentDay })
       );
     }, [cash, location, currentDay]);

     if (currentDay > maxDays) {
       return <div>Game Over! Final Cash: ${cash}</div>;
     }

     return (
       <div className="app">
         <header>
           <h1>Bogan Hustler: The Straya Edition</h1>
           <div>
             Cash: ${cash} | Location: {location} | Day: {currentDay}/{maxDays}
           </div>
         </header>
         <nav>
           <button onClick={() => setCurrentScreen("map")}>Travel</button>
           <button onClick={() => setCurrentScreen("market")}>Market</button>
           <button onClick={() => setCurrentScreen("inventory")}>
             Inventory
           </button>
         </nav>
         <main>
           {currentScreen === "main" && <p>Welcome, mate! Pick an action.</p>}
           {currentScreen === "map" && <MapScreen />}
           {currentScreen === "market" && <MarketScreen />}
           {currentScreen === "inventory" && <InventoryScreen />}
         </main>
         {activeEvent && <EventPopup />}
         <footer>
           Disclaimer: This is a fictional game and does not promote illegal
           activities.
         </footer>
       </div>
     );
   }

   export default App;
   ```

2. **Map Screen**

   - File: `src/components/MapScreen.tsx`

   ```typescript
   import React from "react";
   import { useDispatch, useSelector } from "react-redux";
   import { travel } from "../store/playerSlice";
   import { updatePrices } from "../store/marketSlice";
   import { triggerEvent } from "../store/eventSlice";
   import { RootState, AppDispatch } from "../store/store";

   const locations: string[] = [
     "Sydney",
     "Melbourne",
     "Gold Coast",
     "Perth",
     "Darwin",
     "Alice Springs",
     "Byron Bay",
     "Adelaide",
     "Tasmania",
   ];

   const events: {
     id: string;
     probability: number;
     description: string;
     choices: {
       text: string;
       outcome: { cash?: number; inventory?: number };
     }[];
   }[] = [
     {
       id: "police",
       probability: 0.1,
       description: "Cops are onto you! Pay a bribe or lose gear?",
       choices: [
         { text: "Bribe ($100)", outcome: { cash: -100 } },
         { text: "Run", outcome: { inventory: -2 } },
       ],
     },
     {
       id: "bikie",
       probability: 0.05,
       description: "Bikies demand a tax! Pay up or fight?",
       choices: [
         { text: "Pay ($200)", outcome: { cash: -200 } },
         { text: "Fight", outcome: { inventory: -3 } },
       ],
     },
   ];

   function MapScreen(): JSX.Element {
     const dispatch: AppDispatch = useDispatch();
     const currentLocation = useSelector(
       (state: RootState) => state.player.location
     );

     const handleTravel = (location: string): void => {
       if (location !== currentLocation) {
         dispatch(travel(location));
         dispatch(updatePrices());
         const eventChance = Math.random();
         const event = events.find((e) => eventChance < e.probability);
         if (event) {
           dispatch(triggerEvent(event));
         }
       }
     };

     return (
       <div>
         <h2>Travel to:</h2>
         <div className="map">
           {locations.map((loc) => (
             <button
               key={loc}
               onClick={() => handleTravel(loc)}
               disabled={loc === currentLocation}
             >
               {loc}
             </button>
           ))}
         </div>
       </div>
     );
   }

   export default MapScreen;
   ```

3. **Market Screen**

   - File: `src/components/MarketScreen.tsx`

   ```typescript
   import React, { useState } from "react";
   import { useSelector, useDispatch } from "react-redux";
   import { buyDrug, sellDrug } from "../store/playerSlice";
   import { RootState, AppDispatch } from "../store/store";

   function MarketScreen(): JSX.Element {
     const dispatch: AppDispatch = useDispatch();
     const { location, inventory } = useSelector(
       (state: RootState) => state.player
     );
     const prices = useSelector(
       (state: RootState) => state.market.prices[location]
     );
     const [quantity, setQuantity] = useState<number>(1);

     const handleBuy = (drug: string, price: number): void => {
       dispatch(buyDrug({ drug, quantity, price }));
     };

     const handleSell = (drug: string, price: number): void => {
       dispatch(sellDrug({ drug, quantity, price }));
     };

     return (
       <div>
         <h2>Market in {location}</h2>
         <input
           type="number"
           min="1"
           value={quantity}
           onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
         />
         <ul>
           {Object.entries(prices).map(([drug, { price }]) => {
             const owned =
               inventory.find((item) => item.name === drug)?.quantity || 0;
             return (
               <li key={drug}>
                 {drug} - ${price}
                 <button onClick={() => handleBuy(drug, price)}>Buy</button>
                 {owned > 0 && (
                   <button onClick={() => handleSell(drug, price)}>
                     Sell ({owned})
                   </button>
                 )}
               </li>
             );
           })}
         </ul>
       </div>
     );
   }

   export default MarketScreen;
   ```

4. **Inventory Screen**

   - File: `src/components/InventoryScreen.tsx`

   ```typescript
   import React from "react";
   import { useSelector, useDispatch } from "react-redux";
   import { upgradeInventory } from "../store/playerSlice";
   import { RootState, AppDispatch } from "../store/store";

   function InventoryScreen(): JSX.Element {
     const dispatch: AppDispatch = useDispatch();
     const { cash, inventory, inventorySpace } = useSelector(
       (state: RootState) => state.player
     );

     return (
       <div>
         <h2>Inventory</h2>
         <p>Cash: ${cash}</p>
         <p>
           Space: {inventory.reduce((acc, item) => acc + item.quantity, 0)}/
           {inventorySpace}
         </p>
         <ul>
           {inventory.map((item) => (
             <li key={item.name}>
               {item.name} - {item.quantity}
             </li>
           ))}
         </ul>
         <button onClick={() => dispatch(upgradeInventory())}>
           Upgrade Space (+5 for $500)
         </button>
       </div>
     );
   }

   export default InventoryScreen;
   ```

5. **Event Popup**

   - File: `src/components/EventPopup.tsx`

   ```typescript
   import React from "react";
   import { useSelector, useDispatch } from "react-redux";
   import { clearEvent } from "../store/eventSlice";
   import { buyDrug } from "../store/playerSlice";
   import { RootState, AppDispatch } from "../store/store";

   function EventPopup(): JSX.Element | null {
     const dispatch: AppDispatch = useDispatch();
     const event = useSelector((state: RootState) => state.events.activeEvent);

     const handleChoice = (outcome: {
       cash?: number;
       inventory?: number;
     }): void => {
       if (outcome.cash) {
         dispatch(
           buyDrug({ drug: "Penalty", quantity: 0, price: -outcome.cash })
         );
       } else if (outcome.inventory) {
         dispatch(
           buyDrug({ drug: "Penalty", quantity: -outcome.inventory, price: 0 })
         );
       }
       dispatch(clearEvent());
     };

     if (!event) return null;

     return (
       <div className="event-popup">
         <h3>Event!</h3>
         <p>{event.description}</p>
         {event.choices.map((choice, index) => (
           <button key={index} onClick={() => handleChoice(choice.outcome)}>
             {choice.text}
           </button>
         ))}
       </div>
     );
   }

   export default EventPopup;
   ```

---

## Step 5: Add Styling

1. **Global Styles**

   - File: `src/index.css`

   ```css
   body {
     font-family: "Courier New", Courier, monospace;
     background-color: #1a1a1a;
     color: #fff;
     margin: 0;
     padding: 20px;
   }
   ```

2. **App Styles**
   - File: `src/App.css`
   ```css
   .app {
     max-width: 800px;
     margin: 0 auto;
   }
   header {
     text-align: center;
     margin-bottom: 20px;
   }
   nav {
     display: flex;
     gap: 10px;
     justify-content: center;
     margin-bottom: 20px;
   }
   button {
     background: #ff4500;
     border: 2px solid #fff;
     color: #fff;
     padding: 5px 10px;
     cursor: pointer;
     font-family: inherit;
   }
   button:disabled {
     opacity: 0.5;
     cursor: not-allowed;
   }
   .map {
     display: grid;
     grid-template-columns: repeat(3, 1fr);
     gap: 10px;
   }
   .event-popup {
     position: fixed;
     top: 50%;
     left: 50%;
     transform: translate(-50%, -50%);
     background: #333;
     padding: 20px;
     border: 2px solid #ff4500;
     text-align: center;
   }
   footer {
     text-align: center;
     margin-top: 20px;
     font-size: 0.8em;
   }
   ```

---

## Step 6: Update package.json

- File: `package.json`

```json
{
  "name": "bogan-hustler",
  "homepage": "https://yourusername.github.io/bogan-hustler",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "predeploy": "bun run build",
    "deploy": "gh-pages -d dist"
  },
  "dependencies": {
    "@reduxjs/toolkit": "^2.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^9.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "gh-pages": "^6.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

- Replace `yourusername` with your GitHub username.

---

## Step 7: Test and Deploy

1. **Test Locally**

   ```
   bun run dev
   ```

2. **Build for Production**

   ```
   bun run build
   ```

3. **Deploy to GitHub Pages**
   - Set up repo:
     ```
     git remote add origin https://github.com/yourusername/bogan-hustler.git
     git branch -M main
     git push -u origin main
     ```
   - Deploy:
     ```
     bun run predeploy
     npx gh-pages -d dist
     ```
   - Visit `https://yourusername.github.io/bogan-hustler`.

---

## Step 8: Documentation

- File: `README.md`

```markdown
# Bogan Hustler: The Straya Edition

A web-based game built with Bun, Vite, React, and strict TypeScript.

## How to Play

- **Travel**: Hit up different Aussie cities.
- **Market**: Buy cheap, flog it for a profit.
- **Inventory**: Keep your stash in check.
- **Survive**: Avoid the coppers and bikies for 30 days.

## Installation

1. Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. Clone: `git clone https://github.com/yourusername/bogan-hustler.git`
3. Install: `bun install`
4. Run: `bun run dev`
```

---

## Notes

- **Directory Structure**:
  ```
  bogan-hustler/
  ├── src/
  │   ├── components/
  │   │   ├── MapScreen.tsx
  │   │   ├── MarketScreen.tsx
  │   │   ├── InventoryScreen.tsx
  │   │   └── EventPopup.tsx
  │   ├── store/
  │   │   ├── store.ts
  │   │   ├── playerSlice.ts
  │   │   ├── marketSlice.ts
  │   │   └── eventSlice.ts
  │   ├── App.tsx
  │   ├── App.css
  │   ├── index.css
  │   └── main.tsx
  ├── package.json
  ├── README.md
  ├── tsconfig.json
  └── vite.config.ts
  ```
- **Next Steps**: Add more events, drugs, or pixel-art assets after the prototype.
