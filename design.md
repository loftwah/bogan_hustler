# Bogan Hustler: The Straya Edition

## Introduction

**Bogan Hustler: The Straya Edition** is a modern, web-based reinterpretation of the classic _Drugwars_/_Dopewars_ game, infused with a distinctly Australian flavor. In this game, players take on the role of a small-time hustler navigating Australia's underground drug trade, buying and selling real drugs with Aussie nicknames, dodging law enforcement, bikie gangs, and unpredictable wildlife hazards. Developed using **Vite** and **React**, and published on **GitHub Pages**, this game combines a retro vibe with modern web technologies to deliver an engaging, accessible experience.

### Target Audience

- Fans of simulation and strategy games like _Drugwars_ or _Dopewars_.
- Players intrigued by Australian culture, slang, and humor.
- Casual web gamers seeking a nostalgic yet fresh experience.

### Platform

- **Web-based**: Built with Vite and React for a fast, responsive frontend.
- **Deployment**: Hosted on GitHub Pages as a static site.

### Tech Suitability

Vite and React are an excellent fit for this project. Vite provides a lightning-fast development environment and efficient builds, ideal for a dynamic game with frequent updates. React’s component-based architecture allows for reusable UI elements—like market screens and inventory displays—making development and maintenance streamlined. Publishing to GitHub Pages is seamless with Vite’s static site output, ensuring wide accessibility without server-side dependencies.

## Game Overview

In **Bogan Hustler**, players traverse iconic Australian cities and regions, trading real drugs with a local twist. The objective is to turn a profit by buying low and selling high in a fluctuating market, all while managing risks like police raids, bikie shakedowns, and random Aussie mishaps. The game retains the turn-based economy of its predecessors but adds a layer of Australian authenticity through its setting, items, and events.

### Key Features

- **Australian Twist**: Real drugs with Aussie street names, set in recognizable locations with cultural flair.
- **Dynamic Economy**: Drug prices shift based on location, demand, and random events.
- **Risk vs. Reward**: Encounters with cops, gangs, and wildlife add challenge and unpredictability.
- **Retro Vibe**: Pixel-art visuals and Aussie slang for a nostalgic yet unique feel.
- **Upgrades**: Invest in gear and allies to boost your hustle.

## Game Mechanics

### Core Gameplay

- **Turn-Based**: Each turn represents a day, during which players can travel, trade, or take other actions.
- **Objective**: Start with limited cash and inventory space, aiming to grow wealth and reputation.
- **Market**: Buy drugs at low prices in one location and sell them where demand (and prices) are high.

### Player Actions

- **Travel**: Move between Australian cities and towns, each with unique market conditions and risks.
- **Buy/Sell**: Trade drugs based on current market prices and inventory limits.
- **Hide**: Lay low to avoid detection after risky moves.
- **Upgrade**: Spend cash on gear, allies, or safehouses to improve efficiency and safety.

### Resources

- **Cash**: Primary currency for transactions and upgrades.
- **Inventory Space**: Limited slots for carrying drugs; expandable with upgrades.
- **Reputation**: Affects NPC interactions and access to premium markets.

### Risks and Challenges

- **Police**: Random checks, stings, or raids can result in fines, arrests, or confiscated goods.
- **Bikie Gangs**: Demand “taxes” or steal inventory if you encroach on their turf.
- **Wildlife**: Drop bears, magpies, or crocs might disrupt your plans, costing you goods or time.
- **Market Fluctuations**: Prices crash or spike due to oversupply, crackdowns, or events like festivals.

## Australian Theme

### Locations

Each location reflects real-world Australian geography and culture, influencing drug availability and risks:

- **Sydney (NSW)**: Cocaine and party drug hub; heavy police presence.
- **Melbourne (VIC)**: Hipster haven for ketamine, weed, and prescription pills.
- **Gold Coast (QLD)**: Meth and steroid central; bikie stronghold.
- **Perth (WA)**: Isolated, high prices, FIFO worker demand; customs risks.
- **Darwin (NT)**: High-risk, high-reward; limited supply but big cash.
- **Alice Springs (NT)**: Grog-running and remote drug trades.
- **Byron Bay (NSW)**: Weed and psychedelics hotspot.
- **Adelaide (SA)**: Low-key, steady demand, less heat.
- **Tasmania (TAS)**: Bush weed paradise; tough to source other drugs.

### Drugs

The game features real drugs relevant to Australia, with local street names and mechanics:

- **Meth (Bikie Dust)**: Cheap, high-risk; bikie-controlled.
- **Cocaine (Booger Sugar)**: Expensive, urban demand; hard to source.
- **MDMA (Pingas)**: Festival staple; prices spike during events.
- **Weed (Bush Bud)**: Illicit trade; steady demand nationwide.
- **Weed (Green Script)**: Prescription-based; randomly available, high quality, costly upfront but profitable.
- **Ketamine (Special K)**: Club and rave favorite; rising popularity.
- **Nangs (Bulbs)**: Nitrous oxide canisters; legal gray area, high turnover.
- **Prescription Pills (Xannies)**: Sourced via dodgy scripts or theft; moderate risk.
- **Steroids (Gear)**: Popular with tradies and gym-goers.

#### Prescription Weed Mechanic

- **Random Availability**: Green Script appears sporadically, simulating prescription access (e.g., via a dodgy Telehealth doc).
- **High Quality, High Cost**: Costs more to acquire but fetches premium prices from upscale buyers.
- **Risk**: Overusing the legal route might trigger a crackdown, cutting off supply temporarily.

### Cultural Elements

- **Slang**: Authentic Aussie dialogue (e.g., “Got any pingas, mate?”).
- **Events**: Festivals, lockout laws, floods, or bikie turf wars impact gameplay.
- **NPCs**: Characters like “Gazza the Meth Cook” or “Shazza the Festival Queen” add flavor.

## User Interface

### UI Components

- **Map Screen**: Interactive map for traveling between locations.
- **Market Screen**: Displays current drug prices, buy/sell options.
- **Inventory**: Tracks cash, drugs carried, and available space.
- **Event Pop-ups**: Alerts for random encounters with decisions (e.g., pay off a bikie or run).

### Interaction

- Click-based navigation and actions, optimized for web browsers.
- Intuitive layout for quick decision-making.

### Visual Style

- **Retro Pixel Art**: 8-bit graphics inspired by classic games.
- **Aussie Aesthetics**: Pub-rock vibes, servo car parks, and outback landscapes.

## Technical Details

### Tech Stack

- **Frontend**: React for modular UI components and state management.
- **Build Tool**: Vite for rapid development and optimized static builds.
- **Deployment**: GitHub Pages for free, easy hosting.

### Additional Tools

- **State Management**: Redux or Context API to handle game state (cash, inventory, events).
- **Styling**: CSS Modules for scoped, maintainable styles.
- **Testing**: Jest and React Testing Library for reliability.

## Development Plan

### Milestones

1. **Prototype**: Basic game loop with two locations, three drugs.
   - _Duration_: 2 weeks
2. **Alpha**: Full map, core drugs, random events implemented.
   - _Duration_: 4 weeks
3. **Beta**: UI polish, upgrades, economy balancing.
   - _Duration_: 3 weeks
4. **Release**: Final testing, bug fixes, deployment to GitHub Pages.
   - _Duration_: 1 week

### Total Timeline

- **10 weeks** from start to launch.

## Monetization and Distribution

- **Free to Play**: Hosted on GitHub Pages, no cost to players.
- **Optional Donations**: PayPal or Ko-fi link for support, given the sensitive drug theme limits traditional monetization.
