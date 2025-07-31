# Design Document

## Overview

The web viewer is a simple React-based debugging tool for the Robot Masters game engine. It loads game configurations, displays them visually using React PIXI, and provides predefined script constants for easy testing of character behaviors.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React UI      │    │   Jotai State    │    │  WASM Wrapper   │
│   Components    │◄──►│   (Game State)   │◄──►│   Integration   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│  React PIXI     │                            │  Game Engine    │
│  (Declarative   │                            │   (Rust/WASM)   │
│   Rendering)    │                            └─────────────────┘
└─────────────────┘
```

### Technology Stack

- **Build Tool**: Vite
- **Frontend**: React + TypeScript
- **Styling**: Tailwind 4
- **State**: Jotai (for game entity positions/sizes)
- **Rendering**: React PIXI for declarative entity rendering
- **Game Engine**: WASM wrapper

## Components and Interfaces

### Core Components

#### 1. App Component

- Root component with WASM initialization and Jotai providers

#### 2. GameCanvas

- React PIXI component that declaratively renders entities
- Displays characters and spawns based on position/size from Jotai state

#### 3. ConfigurationLoader

- Simple file input for loading JSON configurations

#### 4. ScriptConstants

- Simple constants file for easy script mix-and-matching:

```typescript
export const ACTION_SCRIPTS = {
  RUN: [
    /* bytecode array */
  ],
  TURN_AROUND: [
    /* bytecode array */
  ],
  JUMP: [
    /* bytecode array */
  ],
  WALL_JUMP: [
    /* bytecode array */
  ],
  CHARGE: [
    /* bytecode array */
  ],
}

export const CONDITION_SCRIPTS = {
  ALWAYS: [
    /* bytecode array */
  ],
  CHANCE_10: [
    /* bytecode array */
  ],
  CHANCE_20: [
    /* bytecode array */
  ],
  CHANCE_50: [
    /* bytecode array */
  ],
  ENERGY_LOW_10: [
    /* bytecode array */
  ],
  ENERGY_LOW_20: [
    /* bytecode array */
  ],
  IS_GROUNDED: [
    /* bytecode array */
  ],
  IS_WALL_SLIDING: [
    /* bytecode array */
  ],
}
```

#### 5. GameControls (Optional)

- Basic play/pause/step controls for debugging

### State Management Architecture

#### Jotai Atoms

```typescript
// Core game state
export const gameWrapperAtom = atom<GameWrapper | null>(null)
export const gameConfigAtom = atom<GameConfig | null>(null)
export const gameStateAtom = atom<GameStateData | null>(null)

// Entity rendering state (what Jotai is actually for)
export const charactersAtom = atom<CharacterRenderData[]>([])
export const spawnsAtom = atom<SpawnRenderData[]>([])

// Simple UI state
export const isPlayingAtom = atom<boolean>(false)
export const currentFrameAtom = atom<number>(0)
```

## Data Models

### Simple Script Constants

```typescript
import { operator_address, property_address } from 'robot-masters-engine'

export const ACTION_SCRIPTS = {
  RUN: [
    operator_address.READ_PROP,
    0,
    property_address.ENTITY_FACING,
    operator_address.ASSIGN_FIXED,
    0,
    2,
    1, // 2.0 speed
    operator_address.MUL,
    1,
    0,
    0,
    operator_address.WRITE_PROP,
    property_address.CHARACTER_VEL_X,
    1,
    operator_address.EXIT,
    0,
  ],

  TURN_AROUND: [
    operator_address.READ_PROP,
    0,
    property_address.ENTITY_FACING,
    operator_address.EQUAL,
    1,
    0,
    0,
    operator_address.ASSIGN_BYTE,
    2,
    1,
    operator_address.ASSIGN_BYTE,
    3,
    0,
    operator_address.WRITE_PROP,
    property_address.ENTITY_FACING,
    1,
    operator_address.EXIT,
    0,
  ],

  JUMP: [
    operator_address.EXIT_IF_NO_ENERGY,
    10,
    operator_address.ASSIGN_FIXED,
    0,
    -5,
    1,
    operator_address.WRITE_PROP,
    property_address.CHARACTER_VEL_Y,
    0,
    operator_address.APPLY_ENERGY_COST,
    operator_address.EXIT,
    0,
  ],

  WALL_JUMP: [
    operator_address.READ_PROP,
    0,
    property_address.CHARACTER_COLLISION_LEFT,
    operator_address.READ_PROP,
    1,
    property_address.CHARACTER_COLLISION_RIGHT,
    operator_address.OR,
    2,
    0,
    1,
    operator_address.EXIT_IF_NO_ENERGY,
    15,
    operator_address.ASSIGN_FIXED,
    0,
    -4,
    1,
    operator_address.ASSIGN_FIXED,
    1,
    3,
    1,
    operator_address.WRITE_PROP,
    property_address.CHARACTER_VEL_Y,
    0,
    operator_address.WRITE_PROP,
    property_address.CHARACTER_VEL_X,
    1,
    operator_address.APPLY_ENERGY_COST,
    operator_address.EXIT,
    0,
  ],

  CHARGE: [
    operator_address.READ_PROP,
    0,
    property_address.CHARACTER_ENERGY,
    operator_address.READ_PROP,
    1,
    property_address.CHARACTER_ENERGY_CAP,
    operator_address.LESS_THAN,
    2,
    0,
    1,
    operator_address.READ_PROP,
    3,
    property_address.CHARACTER_ENERGY_CHARGE,
    operator_address.ADD_BYTE,
    4,
    0,
    3,
    operator_address.MIN,
    5,
    4,
    1,
    operator_address.WRITE_PROP,
    property_address.CHARACTER_ENERGY,
    5,
    operator_address.EXIT,
    0,
  ],
}

export const CONDITION_SCRIPTS = {
  ALWAYS: [operator_address.ASSIGN_BYTE, 0, 1, operator_address.EXIT, 0],

  CHANCE_10: [
    operator_address.ASSIGN_RANDOM,
    0,
    operator_address.ASSIGN_BYTE,
    1,
    25,
    operator_address.LESS_THAN,
    2,
    0,
    1,
    operator_address.EXIT_WITH_VAR,
    2,
  ],

  CHANCE_20: [
    operator_address.ASSIGN_RANDOM,
    0,
    operator_address.ASSIGN_BYTE,
    1,
    51,
    operator_address.LESS_THAN,
    2,
    0,
    1,
    operator_address.EXIT_WITH_VAR,
    2,
  ],

  CHANCE_50: [
    operator_address.ASSIGN_RANDOM,
    0,
    operator_address.ASSIGN_BYTE,
    1,
    128,
    operator_address.LESS_THAN,
    2,
    0,
    1,
    operator_address.EXIT_WITH_VAR,
    2,
  ],

  ENERGY_LOW_10: [
    operator_address.READ_PROP,
    0,
    property_address.CHARACTER_ENERGY,
    operator_address.READ_PROP,
    1,
    property_address.CHARACTER_ENERGY_CAP,
    operator_address.DIV_BYTE,
    2,
    1,
    10,
    operator_address.LESS_THAN,
    3,
    0,
    2,
    operator_address.EXIT_WITH_VAR,
    3,
  ],

  ENERGY_LOW_20: [
    operator_address.READ_PROP,
    0,
    property_address.CHARACTER_ENERGY,
    operator_address.READ_PROP,
    1,
    property_address.CHARACTER_ENERGY_CAP,
    operator_address.DIV_BYTE,
    2,
    1,
    5,
    operator_address.LESS_THAN,
    3,
    0,
    2,
    operator_address.EXIT_WITH_VAR,
    3,
  ],

  IS_GROUNDED: [
    operator_address.READ_PROP,
    0,
    property_address.CHARACTER_COLLISION_BOTTOM,
    operator_address.EXIT_WITH_VAR,
    0,
  ],

  IS_WALL_SLIDING: [
    operator_address.READ_PROP,
    0,
    property_address.CHARACTER_COLLISION_BOTTOM,
    operator_address.NOT,
    1,
    0,
    operator_address.READ_PROP,
    2,
    property_address.CHARACTER_COLLISION_LEFT,
    operator_address.READ_PROP,
    3,
    property_address.CHARACTER_COLLISION_RIGHT,
    operator_address.OR,
    4,
    2,
    3,
    operator_address.AND,
    5,
    1,
    4,
    operator_address.EXIT_WITH_VAR,
    5,
  ],
}
```

## Error Handling

Simple error display for:

- Configuration loading errors
- WASM wrapper errors
- Rendering errors

## Testing Strategy

Basic testing for:

- Script constant validation
- Configuration loading
- PIXI rendering
- WASM integration

## Implementation Phases

### Phase 1: Basic Setup

1. Vite + React + TypeScript + Tailwind 4
2. WASM wrapper integration
3. Basic file loading

### Phase 2: Script Constants

1. Create script constants file
2. Configuration generation with script mixing
3. Validation

### Phase 3: Visual Rendering

1. React PIXI setup
2. Entity rendering based on position/size
3. Basic tilemap display

### Phase 4: Polish (Optional)

1. Game controls
2. Better error handling
3. Export functionality

This is a simple debugging viewer - nothing more, nothing less.
