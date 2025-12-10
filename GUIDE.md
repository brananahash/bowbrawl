# Game Development Architecture and Best Practices Guide

This guide teaches you how to build multiplayer games using proper architecture patterns and best practices with the Jamango API framework.

## Table of Contents

- [Overview](#overview)
- [Architecture Overview](#architecture-overview)
- [Entry Points](#entry-points)
- [Project Structure](#project-structure)
- [Core Systems](#core-systems)
- [Client-Side Architecture](#client-side-architecture)
- [Server-Side Architecture](#server-side-architecture)
- [Shared Code Organization](#shared-code-organization)
- [Best Practices](#best-practices)
- [Getting Started](#getting-started)
- [Utility Systems](#utility-systems)

## Overview

Learn to create multiplayer games with features like:
- Real-time player interactions
- Persistent player data and progression
- Dynamic game systems and mechanics
- Marketplace and trading systems
- Weather and environmental effects
- Cross-platform support

This guide uses the Jamango API framework, which provides tools for creating multiplayer games with robust client-server architecture.

## Architecture Overview

The project follows a clean **Client-Server-Shared** architecture pattern with clear separation of concerns:

```
project/
├── client.ts          # Client entry point
├── server.ts          # Server entry point
├── client/            # Client-side systems
├── server/            # Server-side systems
└── shared/            # Shared code (traits, commands, constants)
```

### Key Architectural Principles

1. **Separation of Concerns**: Client handles UI and presentation, server manages game logic and state
2. **Trait-Based Entity System**: Uses a trait system for managing entity data and behavior
3. **Command Pattern**: Network communication through well-defined commands
4. **System-Based Architecture**: Functionality organized into discrete systems
5. **Data-Driven Design**: Game content managed through external data sources

## Entry Points

### Client Entry Point (`client.ts`)

The client entry point initializes client-side systems and handles:

```typescript
import { onGameStart, onGameTick, onPlayerJoin } from "jamango";
import * as HotbarSystem from "./client/hotbarSystem";
import * as UI from "./client/ui";
// ... other imports

onGameStart(() => {
    TutorialSystem.init();
    InteractionSystem.init();
    HotbarSystem.init();
    MusicSystem.init();
    UI.init();
    PlotSystem.init();
    MobileControls.init();
});

onGameTick((dt, time) => {
    TutorialSystem.update(time);
    InteractionSystem.update();
    HotbarSystem.update();
    // ... other updates
});
```

**Key Responsibilities:**
- Initialize client-side systems
- Handle UI updates and user input
- Manage visual effects and audio
- Coordinate client-side state

### Server Entry Point (`server.ts`)

The server entry point manages game logic and state:

```typescript
import { onGameStart, onGameTick, onPlayerJoin, onPlayerLeave } from "jamango";
import * as GrowSystem from "./server/growSystem";
import * as ShopSystem from "./server/shopSystem";
// ... other imports

onPlayerJoin((playerId, data) => {
    setupPlayer(playerId);
    // Initialize player state
});

onGameTick((dt, time) => {
    GrowSystem.update(dt);
    ShopSystem.update(time);
    WeatherSystem.update(dt);
    // ... other updates
});
```

**Key Responsibilities:**
- Manage authoritative game state
- Handle player connections and persistence
- Execute game logic systems
- Validate player actions

## Project Structure

### Client Folder (`client/`)

Contains all client-side systems and UI components:

```
client/
├── ui/                # UI components and systems
│   ├── components.ts  # Reusable UI components
│   ├── shop.ts        # Shop interface
│   ├── hotbar.ts      # Player hotbar UI
│   ├── notifications.ts # Notification system
│   ├── index.tx       # initializes UI and exports an interface to work with UI
│   └── ...
├── hotbarSystem.ts    # Hotbar management
├── interactionSystem.ts # Interaction handling
├── musicSystem.ts     # Audio management
├── platform.ts        # Platform detection
├── tintSystem.ts      # Visual effects
└── ...
```

### Server Folder (`server/`)

Contains server-side game logic systems:

```
server/
├── growSystem.ts      # Plant growth logic
├── shopSystem.ts      # Marketplace logic
├── plotSystem.ts      # Garden plot management
├── weatherSystem.ts   # Weather mechanics
├── cheatSystem.ts     # Development/testing tools
├── persistence.ts     # Data saving/loading
└── ...
```

### Shared Code

Code shared between client and server:

- **`traits.ts`** - Entity trait definitions
- **`commands.ts`** - Network command definitions  
- **`constants.ts`** - Game configuration constants
- **`localization/`** - Internationalization support

## Core Systems

### Trait System

The game uses a trait-based entity system for managing entity data:

```typescript
// Define a trait. Use "Trait" suffix to follow naming convention
export const PlayerTrait = defineTrait<{
    coins: number;
    plotIndex: number;
    seeds: SeedItem[];
    fruits: FruitItem[];
}>>("Player");

// Set trait data
setTrait(playerId, PlayerTrait, playerData);

// Get trait data
const player = getTrait(playerId, PlayerTrait);

// Find entities with trait
const allPlayers = getAllWithTraits([PlayerTrait]);
```

**Benefits:**
- Flexible entity composition
- Type-safe data access
- Easy querying and filtering
- Modular system design

### Command System

Network communication uses a command pattern:

```typescript
// Define commands
export const BUY_ITEM = net.defineCommand<{ key: string }>("buy_item");
export const SELL_FRUITS = net.defineCommand<void>("sell_fruits");

// Server: Listen for commands
net.listen(BUY_ITEM, (data, playerId) => {
    // Handle buy item logic
});

// Client: Send commands
net.send(BUY_ITEM, { key: "carrot" });
```

Command definitions should be placed in `shared/commands.ts` file. Listeners should be added to appropriate systems.

**Benefits:**
- Type-safe network communication
- Clear separation of client actions and server responses
- Easy to add new functionality
- Built-in serialization

## Client-Side Architecture

### UI System Organization

The UI is organized into modular components in `client/ui/`:

- **`components.ts`** - Reusable UI building blocks (buttons, popups, etc.)
- **`shop.ts`** - Shop interface and marketplace
- **`index.ts`** - a public interface to interact with UI

### System Pattern

Client systems follow a consistent pattern:

```typescript
// System initialization
export function init() {
    // Setup event listeners, UI elements, etc.
}

// System updates (called every frame)
export function update(dt: number, time: number) {
    // Update system state
}

// System-specific functionality
export function doSomething() {
    // System behavior
}
```

### Audio Management (`client/musicSystem.ts`)

Centralized audio system for:
- Background music
- Sound effects
- Spatial audio
- Volume management

```typescript
export function init() {
    playSound("background_music", { volume: 0.3, loop: true });
}

export function playClick() {
    playSound("click_sound", { volume: 0.3 });
}
```

## Server-Side Architecture

### Game Logic Systems

Example systems you might implement:

**Progress System** - Manages time-based progression:
```typescript
export function update(dt: number) {
    const entities = getAllWithTraits([ProgressTrait]);
    
    entities.forEach(entity => {
        // Update progress over time
        // Handle completion states
        // Trigger events
    });
}
```

**Economy System** - Handles marketplace logic:
- Item availability and pricing
- Purchase validation
- Inventory management
- Dynamic pricing

**Environmental System** - Dynamic world state:
- Weather effects on gameplay
- Day/night cycles
- Seasonal changes
- Environmental interactions

### Development Tools (`server/cheatSystem.ts`)

Development and testing utilities:

```typescript
const Commands = {
    "/currency": (playerId, amount) => {
        // Add currency to player
    },
    "/speed": (playerId, seconds) => {
        // Speed up time/progress
    },
    "/teleport": (playerId) => {
        // Enable teleportation
    }
};
```

**Benefits:**
- Speeds up development and testing
- Easy debugging of game mechanics
- Quality assurance tools

## Shared Code Organization

### Traits (`traits.ts`)

Centralized trait definitions ensure consistency:

```typescript
export const PlayerTrait = defineTrait<PlayerData>("Player");
export const PlantTrait = defineTrait<PlantData>("Plant");
export const ShopTrait = defineTrait<ShopData>("Shop");
```

### Commands (`commands.ts`)

All network commands in one place:

```typescript
export const BUY_ITEM = net.defineCommand<BuyItemData>("buy_item");
export const USE_SEED = net.defineCommand<UseSeedData>("use_seed");
export const HARVEST = net.defineCommand<HarvestData>("harvest");
```

### Constants (`constants.ts`)

Game configuration and settings:

```typescript
export const WEATHER_INTERVAL = 5 * 60; // seconds
export const START_BALANCE = 200;
export const HOTBAR_MAX_SLOTS = 6;

export enum TutorialSteps {
    none = 0,
    buySeeds,
    plantSeeds,
    // ...
}
```

### Localization (`shared/localization/`)

Internationalization support:

```typescript
// shared/localization/en.ts
export default {
    "ui.score": "Score",
    "ui.level": "Level",
    "tutorials.move.mobile": "Drag to move",
    "tutorials.move.desktop": "Use arrows to move",
    // ...
};

// Usage
import { LL } from "../shared/localization";
const text = LL("ui.score");
```

## Best Practices

### 1. Code Organization

- **Separate concerns**: Keep client, server, and shared code distinct
- **Modular systems**: Each system has a single responsibility
- **Consistent patterns**: Use similar structures across systems
- **Clear naming**: Files and functions have descriptive names

### 2. State Management

- **Server authority**: Server is the source of truth for game state
- **Trait-based data**: Use traits for flexible entity composition
- **Immutable updates**: Replace trait data rather than mutating
- **Persistence**: Save important data to survive disconnections

### 3. Network Communication

- **Command pattern**: Use defined commands for all client-server communication
- **Type safety**: Leverage TypeScript for compile-time checks
- **Validation**: Server validates all client requests
- **Error handling**: Gracefully handle network failures

### 4. Performance

- **Update frequency**: Systems update at appropriate intervals
- **Batch operations**: Group similar operations together
- **Lazy loading**: Load resources when needed
- **Memory management**: Clean up unused entities and data

### 5. User Experience

- **Responsive UI**: UI updates immediately for player actions
- **Audio feedback**: Sound effects for all interactions
- **Visual polish**: Smooth animations and transitions
- **Platform adaptation**: UI adapts to device capabilities

### 6. Development Workflow

- **Development tools**: Cheat commands for testing
- **Hot reloading**: Fast iteration during development
- **External data**: Use spreadsheets for content editing
- **Localization**: Support multiple languages from the start

### 7. Error Handling

```typescript
onGameTick((dt, time) => {
    try {
        GameSystem.update(time);
        PlayerSystem.update();
        // ... other systems
    } catch (e) {
        console.error(e);
    }
});
```

- **Graceful degradation**: Systems continue working when others fail
- **Logging**: Record errors for debugging
- **Recovery**: Attempt to recover from errors when possible

### 8. Testing and Debugging

- **Cheat system**: Quick access to game states for testing
- **Debug modes**: Additional information during development
- **Console logging**: Strategic logging for debugging
- **Development flags**: Enable/disable features during development

## Getting Started

### 1. Project Setup

TODO

### 2. Entry Points

Create your main entry points:

```typescript
// client.ts
import { onGameStart } from "jamango";

onGameStart(() => {
    console.log("Client started!");
});

// server.ts
import { onGameStart } from "jamango";

onGameStart(() => {
    console.log("Server started!");
});
```

### 3. Add Your First System

```typescript
// traits.ts
import { defineTrait } from "jamango";

export const PlayerTrait = defineTrait<{
    score: number;
    level: number;
}>("Player");

// server/scoreSystem.ts
import { getTrait, setTrait } from "jamango";
import { PlayerTrait } from "../traits";

export function addScore(playerId: number, points: number) {
    const player = getTrait(playerId, PlayerTrait);
    player.score += points;
    setTrait(playerId, PlayerTrait, player);
}
```

### 4. Add UI

```typescript
// client/ui/index.ts
import { uiElement } from "jamango";

let scoreDisplayElement: HTMLElement!;

export function init() {
  uiElement!.innerHTML = `<div id="score-display"></div>`;

  scoreDisplayElement = uiElement!.querySelector("#score-display");
}

export function updateScore(score: number) {
  scoreDisplayElement.innerText = `Score: ${score}`;
}

// client.ts
import { onGameStart } from "jamango";
import * as UI from './client/ui';

onGameStart(() => {
  // ... other logic ...
  UI.init();
});

```

### 5. Connect Systems

```typescript
// commands.ts
import { net } from "jamango";

export const ADD_SCORE = net.defineCommand<{ points: number }>("add_score");

// server.ts
import { ADD_SCORE } from "./commands";
import * as ScoreSystem from "./server/scoreSystem";

net.listen(ADD_SCORE, (data, playerId) => {
    ScoreSystem.addScore(playerId, data.points);
});
```

This architecture provides a solid foundation for building multiplayer games with clean separation of concerns, type safety, and excellent developer experience. The modular design makes it easy to add new features and maintain the codebase as it grows.


## Utility Systems

### Task Scheduler (`taskScheduler.ts`)

Manages delayed and recurring tasks:

```typescript
// Schedule a one-time task
scheduleTask(() => {
    console.log("Hello!");
}, 1000); // 1 second delay

// Schedule recurring task
scheduleTask(() => {
    updateGameState();
}, 5000, 5000); // Every 5 seconds
```

**Use Cases:**
- Delayed actions
- Periodic updates
- Timeout handling
- Animation sequencing

### External Data Loading (`spreadsheet-parser.ts`)

Loads game data from external sources:

```typescript
async function generateContent(sourceId: string, dataSet: string) {
    const data = await loadData(sourceId, dataSet);
    return parseDataWithKeys(dataSet, data);
}
```

**Benefits:**
- Non-programmer content editing
- Easy game balancing
- Dynamic content updates
- Data-driven design

### Platform Detection

Enables platform-specific features:
- Touch controls on mobile
- Desktop keyboard shortcuts
- Platform-specific UI layouts
- Performance optimizations
