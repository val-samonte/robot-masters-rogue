# WASM Wrapper API Documentation

## Overview

The WASM wrapper provides a JavaScript-compatible interface to the Robot Masters game engine. It handles game initialization, state management, frame stepping, and data serialization between the Rust game engine and JavaScript environments.

## Core Classes

### GameWrapper

The main class that wraps the game engine functionality.

```typescript
class GameWrapper {
  constructor(configJson: string): GameWrapper

  // Configuration methods
  getConfigJson(): string
  static validateConfig(configJson: string): string
  isInitialized(): boolean

  // Game lifecycle methods
  newGame(): void
  isGameInitialized(): boolean
  stepFrame(): void
  isGameEnded(): boolean
  getGameStatus(): string

  // Frame and timing methods
  getFrame(): number
  getFrameInfoJson(): string

  // State access methods
  getStateJson(): string
  getCharactersJson(): string
  getSpawnsJson(): string
  getStatusEffectsJson(): string

  // Error handling and recovery methods
  getLastErrorDetails(): string
  isStable(): boolean
  attemptStabilization(): string
  getHealthInfo(): string
}
```

## Constructor

### `new GameWrapper(configJson: string)`

Creates a new GameWrapper instance with the provided JSON configuration.

**Parameters:**

- `configJson` (string): JSON string containing complete game configuration

**Returns:** GameWrapper instance

**Throws:** Error if configuration is invalid or malformed

**Example:**

```javascript
const config = {
  seed: 12345,
  tilemap: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    // ... 13 more rows
  ],
  characters: [
    {
      id: 1,
      group: 1,
      position: [5.0, 5.0],
      health: 100,
      energy: 50,
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      energy_regen: 1,
      energy_regen_rate: 60,
      energy_charge: 2,
      energy_charge_rate: 30,
      behaviors: [[0, 0]],
    },
  ],
  actions: [],
  conditions: [],
  spawns: [],
  status_effects: [],
}

const wrapper = new GameWrapper(JSON.stringify(config))
```

## Configuration Methods

### `getConfigJson(): string`

Returns the current configuration as a JSON string.

**Returns:** JSON string of current configuration

**Throws:** Error if no configuration is available

**Example:**

```javascript
const configJson = wrapper.getConfigJson()
const config = JSON.parse(configJson)
console.log('Current seed:', config.seed)
```

### `static validateConfig(configJson: string): string`

Validates a JSON configuration string without creating a GameWrapper instance.

**Parameters:**

- `configJson` (string): JSON configuration to validate

**Returns:** Success message if valid

**Throws:** Error with validation details if invalid

**Example:**

```javascript
try {
  const result = GameWrapper.validateConfig(JSON.stringify(config))
  console.log(result) // "Configuration is valid"
} catch (error) {
  console.error('Validation failed:', error)
}
```

### `isInitialized(): boolean`

Checks if the wrapper has been properly initialized with a configuration.

**Returns:** true if initialized, false otherwise

**Example:**

```javascript
if (wrapper.isInitialized()) {
  console.log('Wrapper is ready for game initialization')
}
```

## Game Lifecycle Methods

### `newGame(): void`

Initializes a new game using the current configuration. This must be called before stepping frames.

**Throws:** Error if configuration is invalid or game initialization fails

**Example:**

```javascript
try {
  wrapper.newGame()
  console.log('Game initialized successfully')
} catch (error) {
  console.error('Failed to initialize game:', error)
}
```

### `isGameInitialized(): boolean`

Checks if a game has been initialized and is ready for frame execution.

**Returns:** true if game is initialized, false otherwise

**Example:**

```javascript
if (wrapper.isGameInitialized()) {
  // Safe to call stepFrame()
  wrapper.stepFrame()
}
```

### `stepFrame(): void`

Advances the game state by exactly one frame (1/60th second). Maintains deterministic behavior.

**Throws:** Error if game is not initialized or frame stepping fails

**Example:**

```javascript
// Game loop example
function gameLoop() {
  if (wrapper.isGameInitialized() && !wrapper.isGameEnded()) {
    try {
      wrapper.stepFrame()
      updateDisplay()
    } catch (error) {
      console.error('Frame step failed:', error)
    }
  }
}

setInterval(gameLoop, 1000 / 60) // 60 FPS
```

### `isGameEnded(): boolean`

Checks if the game has ended (reached maximum frames or other end condition).

**Returns:** true if game has ended, false otherwise

**Example:**

```javascript
if (wrapper.isGameEnded()) {
  console.log('Game over! Final frame:', wrapper.getFrame())
}
```

### `getGameStatus(): string`

Returns the current game status as a string.

**Returns:** One of: "not_initialized", "playing", "ended"

**Example:**

```javascript
const status = wrapper.getGameStatus()
switch (status) {
  case 'not_initialized':
    console.log('Game needs to be initialized')
    break
  case 'playing':
    console.log('Game is running')
    break
  case 'ended':
    console.log('Game has finished')
    break
}
```

## Frame and Timing Methods

### `getFrame(): number`

Returns the current frame number for timing synchronization.

**Returns:** Current frame number (0 if not initialized)

**Example:**

```javascript
const currentFrame = wrapper.getFrame()
const elapsedSeconds = currentFrame / 60
console.log(`Game time: ${elapsedSeconds.toFixed(2)} seconds`)
```

### `getFrameInfoJson(): string`

Returns detailed frame timing information as JSON.

**Returns:** JSON string with frame timing data

**Throws:** Error if game is not initialized

**Example:**

```javascript
const frameInfo = JSON.parse(wrapper.getFrameInfoJson())
console.log('Frame:', frameInfo.frame)
console.log('Status:', frameInfo.status)
console.log('Elapsed:', frameInfo.elapsed_seconds)
console.log('Remaining:', frameInfo.remaining_seconds)
```

**Response format:**

```typescript
interface FrameInfo {
  frame: number
  status: 'playing' | 'ended'
  max_frames: number
  fps: number
  elapsed_seconds: number
  remaining_seconds: number
}
```

## State Access Methods

### `getStateJson(): string`

Returns complete game state as JSON string including all entities and frame info.

**Returns:** JSON string with complete game state

**Throws:** Error if game is not initialized

**Example:**

```javascript
const state = JSON.parse(wrapper.getStateJson())
console.log('Characters:', state.characters.length)
console.log('Spawns:', state.spawns.length)
console.log('Status effects:', state.status_effects.length)
```

### `getCharactersJson(): string`

Returns detailed character information as JSON.

**Returns:** JSON array of character states

**Throws:** Error if game is not initialized

**Example:**

```javascript
const characters = JSON.parse(wrapper.getCharactersJson())
characters.forEach((char) => {
  console.log(`Character ${char.id}: HP=${char.health}, Energy=${char.energy}`)
  console.log(`Position: [${char.position[0]}, ${char.position[1]}]`)
})
```

### `getSpawnsJson(): string`

Returns all active spawn instances as JSON.

**Returns:** JSON array of spawn states

**Throws:** Error if game is not initialized

**Example:**

```javascript
const spawns = JSON.parse(wrapper.getSpawnsJson())
spawns.forEach((spawn) => {
  console.log(
    `Spawn ${spawn.id}: Owner=${spawn.owner_id}, Lifespan=${spawn.lifespan}`
  )
})
```

### `getStatusEffectsJson(): string`

Returns all active status effects as JSON.

**Returns:** JSON array of status effect states

**Throws:** Error if game is not initialized

**Example:**

```javascript
const effects = JSON.parse(wrapper.getStatusEffectsJson())
effects.forEach((effect) => {
  console.log(
    `Effect ${effect.instance_id}: Duration=${effect.remaining_duration}`
  )
})
```

## Error Handling and Recovery Methods

### `getLastErrorDetails(): string`

Returns detailed error information for the last operation.

**Returns:** JSON string with error details

**Example:**

```javascript
try {
  wrapper.stepFrame()
} catch (error) {
  const details = wrapper.getLastErrorDetails()
  console.log('Error details:', details)
}
```

### `isStable(): boolean`

Checks if the wrapper is in a stable state.

**Returns:** true if stable, false if there are stability issues

**Example:**

```javascript
if (!wrapper.isStable()) {
  console.warn('System instability detected')
  wrapper.attemptStabilization()
}
```

### `attemptStabilization(): string`

Attempts to recover from errors and stabilize the wrapper.

**Returns:** Status message about stabilization attempt

**Throws:** Error if stabilization fails

**Example:**

```javascript
try {
  const result = wrapper.attemptStabilization()
  console.log('Stabilization result:', result)
} catch (error) {
  console.error('Stabilization failed:', error)
}
```

### `getHealthInfo(): string`

Returns system health information as JSON.

**Returns:** JSON string with health metrics

**Example:**

```javascript
const health = JSON.parse(wrapper.getHealthInfo())
console.log('System health:', health)
```

**Response format:**

```typescript
interface HealthInfo {
  is_initialized: boolean
  game_initialized: boolean
  is_stable: boolean
  frame: number
  character_count: number
  spawn_count: number
  status_effect_count: number
  cache_status: {
    has_cached_frame: boolean
    has_cached_state: boolean
    has_cached_characters: boolean
    has_cached_spawns: boolean
    has_cached_status_effects: boolean
  }
}
```

## Performance Considerations

- The wrapper includes internal caching for JSON serialization to improve performance
- Cache is automatically invalidated when game state changes
- Multiple calls to the same getter method within the same frame will use cached results
- Frame stepping clears all caches to ensure data consistency

## Thread Safety

The WASM wrapper is designed for single-threaded use. Do not call methods from multiple threads simultaneously.
