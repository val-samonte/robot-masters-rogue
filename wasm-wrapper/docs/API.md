# WASM Wrapper API Documentation

## Overview

The WASM wrapper provides a JavaScript-compatible interface to the Robot Masters game engine. It handles game initialization, state management, frame stepping, and data serialization between the Rust game engine and JavaScript environments.

## JSON Data Structures

### GameConfig

The main configuration object that defines the complete game setup.

```typescript
interface GameConfig {
  seed: number // u16 - Random seed for deterministic gameplay
  tilemap: number[][] // 15x16 grid of tile types (0=empty, 1=block)
  characters: CharacterDefinitionJson[] // Character definitions
  actions: ActionDefinitionJson[] // Action definitions
  conditions: ConditionDefinitionJson[] // Condition definitions
  spawns: SpawnDefinitionJson[] // Spawn definitions
  status_effects: StatusEffectDefinitionJson[] // Status effect definitions
}
```

### CharacterDefinitionJson

Defines a character entity with all its properties.

```typescript
interface CharacterDefinitionJson {
  id: number // u8 - Unique character identifier
  group: number // u8 - Group/team identifier
  position: [[number, number], [number, number]] // Fixed-point [x, y] as [[x_num, x_den], [y_num, y_den]]
  health: number // u16 - Current health points (0-65535)
  health_cap: number // u16 - Maximum health capacity (must be >= health)
  energy: number // u8 - Current energy (0-255)
  energy_cap: number // u8 - Maximum energy capacity (0-255)
  power: number // u8 - Attack power (0-255)
  weight: number // u8 - Entity weight for physics (0-255)
  jump_force: [number, number] // Fixed-point jump strength [numerator, denominator]
  move_speed: [number, number] // Fixed-point movement speed [numerator, denominator]
  armor: number[] // u8[9] - Armor values for 9 elements (0-255 each)
  energy_regen: number // u8 - Energy regeneration per tick (0-255)
  energy_regen_rate: number // u8 - Frames between energy regeneration (0-255)
  energy_charge: number // u8 - Energy charge amount (0-255)
  energy_charge_rate: number // u8 - Frames between energy charges (0-255)
  dir: [number, number] // [u8, u8] - Direction [facing, gravity_dir] (0-255 each)
  enmity: number // u8 - Hostility level (0-255)
  target_id: number | null // Option<u8> - Target entity ID (null if no target)
  target_type: number // u8 - Target type (0=none, 1=character, 2=spawn)
  behaviors: [number, number][] // Array of [condition_id, action_id] pairs
}
```

### ActionDefinitionJson

Defines an action that characters can perform.

```typescript
interface ActionDefinitionJson {
  energy_cost: number // u8 - Energy required to use action (0-255)
  cooldown: number // u16 - Frames before action can be used again (0-65535)
  args: number[] // u8[8] - Action arguments (0-255 each)
  spawns: number[] // u8[4] - Spawn IDs this action can create (0-255 each)
  script: number[] // Vec<u8> - Bytecode script for action logic
}
```

### ConditionDefinitionJson

Defines a condition that triggers actions.

```typescript
interface ConditionDefinitionJson {
  energy_mul: number // i16 - Fixed-point energy multiplier as raw integer (-32768 to 32767)
  args: number[] // u8[8] - Condition arguments (0-255 each)
  script: number[] // Vec<u8> - Bytecode script for condition logic
}
```

### SpawnDefinitionJson

Defines a spawn entity (projectiles, effects, etc.).

```typescript
interface SpawnDefinitionJson {
  damage_base: number // u16 - Base damage amount (0-65535)
  damage_range: number // u16 - Random damage variation (0-65535)
  crit_chance: number // u8 - Critical hit chance (0-255)
  crit_multiplier: number // u8 - Critical damage multiplier (0-255)
  health_cap: number // u8 - Maximum health for spawn (0-255)
  duration: number // u16 - Lifespan in frames (0-65535)
  element: number | null // Option<u8> - Element type (0-8, null for none)
  chance: number // u8 - Spawn success chance (0-255)
  args: number[] // u8[8] - Spawn arguments (0-255 each)
  spawns: number[] // u8[4] - Child spawn IDs (0-255 each)
  behavior_script: number[] // Vec<u8> - Behavior logic bytecode
  collision_script: number[] // Vec<u8> - Collision handling bytecode
  despawn_script: number[] // Vec<u8> - Cleanup logic bytecode
}
```

### StatusEffectDefinitionJson

Defines a status effect that can be applied to entities.

```typescript
interface StatusEffectDefinitionJson {
  duration: number // u16 - Effect duration in frames (0-65535)
  stack_limit: number // u8 - Maximum stack count (0-255)
  reset_on_stack: boolean // bool - Whether to reset duration on new stack
  chance: number // u8 - Application success chance (0-255)
  args: number[] // u8[8] - Effect arguments (0-255 each)
  spawns: number[] // u8[4] - Spawn IDs this effect can create (0-255 each)
  on_script: number[] // Vec<u8> - Script when effect is applied
  tick_script: number[] // Vec<u8> - Script executed each frame
  off_script: number[] // Vec<u8> - Script when effect expires
}
```

## Fixed-Point Value Handling

The game engine uses deterministic fixed-point arithmetic to ensure consistent behavior across platforms. Fixed-point values are represented as `[numerator, denominator]` pairs in JSON:

- **Position**: `[[x_numerator, x_denominator], [y_numerator, y_denominator]]`
- **Velocity**: `[[vx_numerator, vx_denominator], [vy_numerator, vy_denominator]]`
- **Single values**: `[numerator, denominator]` (e.g., jump_force, move_speed)

**Example:**

```javascript
// Represents the value 5.0 as fixed-point
const fixedValue = [160, 32] // 160/32 = 5.0

// Position at (3.5, 7.25)
const position = [
  [112, 32],
  [232, 32],
] // [112/32, 232/32] = [3.5, 7.25]
```

**Important:** Denominators must never be zero, as this will cause validation errors.

## Validation Rules

The GameConfig validation enforces several important constraints:

### Character Validation

- `health_cap >= health` - Health capacity must be at least current health
- `target_type != 0` when `target_id` is set - Must specify target type when targeting
- All Fixed-point denominators must be non-zero
- All behavior references must point to valid condition and action indices

### Tilemap Validation

- Must be exactly 15 rows by 16 columns
- Each tile value should be 0 (empty) or 1 (block)

### Reference Validation

- All spawn references in actions and status effects must be valid
- All behavior condition/action pairs must reference existing definitions
- Element values in spawns must be 0-8 or null

### Error Messages

Validation errors include:

- **Field**: The specific field that failed validation
- **Message**: Human-readable description of the problem
- **Context**: Additional details about the error

**Example validation error:**

```json
{
  "field": "characters[0].health_cap",
  "message": "Health cap must be greater than or equal to current health",
  "context": "health_cap: 50, health: 100"
}
```

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
    // ... 13 more rows (15 total rows, 16 columns each)
  ],
  characters: [
    {
      id: 1,
      group: 1,
      position: [
        [160, 32],
        [160, 32],
      ], // Fixed-point [numerator, denominator] pairs for [x, y]
      health: 100, // u16 - Current health points
      health_cap: 150, // u16 - Maximum health capacity
      energy: 50, // u8 - Current energy
      energy_cap: 100, // u8 - Maximum energy capacity
      power: 10, // u8 - Attack power
      weight: 5, // u8 - Entity weight for physics
      jump_force: [320, 32], // Fixed-point [numerator, denominator] for jump strength
      move_speed: [96, 32], // Fixed-point [numerator, denominator] for movement speed
      armor: [0, 0, 0, 0, 0, 0, 0, 0, 0], // u8[9] - Armor values for 9 elements
      energy_regen: 1, // u8 - Energy regeneration amount
      energy_regen_rate: 60, // u8 - Frames between energy regen
      energy_charge: 2, // u8 - Energy charge amount
      energy_charge_rate: 30, // u8 - Frames between energy charge
      dir: [1, 0], // [u8; 2] - Direction [facing, gravity_dir]
      enmity: 0, // u8 - Hostility level
      target_id: null, // Option<u8> - Target entity ID (null if no target)
      target_type: 0, // u8 - Target type (0=none, 1=character, 2=spawn)
      behaviors: [[0, 0]], // Array of [condition_id, action_id] pairs
    },
  ],
  actions: [
    {
      energy_cost: 20, // u8 - Energy required to use action
      cooldown: 60, // u16 - Frames before action can be used again
      args: [0, 0, 0, 0, 0, 0, 0, 0], // u8[8] - Action arguments
      spawns: [0, 0, 0, 0], // u8[4] - Spawn IDs this action can create
      script: [1, 2, 0], // Vec<u8> - Bytecode script for action logic
    },
  ],
  conditions: [
    {
      energy_mul: 32, // i16 - Fixed-point energy multiplier (raw value)
      args: [0, 0, 0, 0, 0, 0, 0, 0], // u8[8] - Condition arguments
      script: [1, 0, 1, 2, 0], // Vec<u8> - Bytecode script for condition logic
    },
  ],
  spawns: [
    {
      damage_base: 25, // u16 - Base damage amount
      damage_range: 10, // u16 - Random damage variation
      crit_chance: 15, // u8 - Critical hit chance (0-255)
      crit_multiplier: 150, // u8 - Critical damage multiplier (0-255)
      health_cap: 50, // u8 - Maximum health for spawn
      duration: 300, // u16 - Lifespan in frames
      element: 2, // Option<u8> - Element type (0-8, null for none)
      chance: 200, // u8 - Spawn success chance (0-255)
      args: [0, 0, 0, 0, 0, 0, 0, 0], // u8[8] - Spawn arguments
      spawns: [0, 0, 0, 0], // u8[4] - Child spawn IDs
      behavior_script: [], // Vec<u8> - Behavior logic
      collision_script: [], // Vec<u8> - Collision handling
      despawn_script: [], // Vec<u8> - Cleanup logic
    },
  ],
  status_effects: [
    {
      duration: 180, // u16 - Effect duration in frames
      stack_limit: 3, // u8 - Maximum stack count
      reset_on_stack: false, // bool - Whether to reset duration on new stack
      chance: 100, // u8 - Application success chance (0-255)
      args: [0, 0, 0, 0, 0, 0, 0, 0], // u8[8] - Effect arguments
      spawns: [0, 0, 0, 0], // u8[4] - Spawn IDs this effect can create
      on_script: [], // Vec<u8> - Script when effect is applied
      tick_script: [], // Vec<u8> - Script executed each frame
      off_script: [], // Vec<u8> - Script when effect expires
    },
  ],
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
console.log(`Frame ${state.frame}: ${state.status}`)
console.log('Characters:', state.characters.length)
console.log('Spawns:', state.spawns.length)
console.log('Status effects:', state.status_effects.length)
console.log('Tilemap size:', state.tilemap.length, 'x', state.tilemap[0].length)
```

**GameStateJson Structure:**

```typescript
interface GameStateJson {
  frame: number // u16 - Current frame number
  seed: number // u16 - Random seed used for this game
  status: string // "playing" | "ended" - Current game status
  characters: CharacterStateJson[] // Array of character states
  spawns: SpawnStateJson[] // Array of spawn instance states
  status_effects: StatusEffectStateJson[] // Array of status effect states
  tilemap: number[][] // 15x16 grid of current tile states
}
```

### `getCharactersJson(): string`

Returns detailed character information as JSON.

**Returns:** JSON array of character states

**Throws:** Error if game is not initialized

**Example:**

```javascript
const characters = JSON.parse(wrapper.getCharactersJson())
characters.forEach((char) => {
  console.log(
    `Character ${char.id}: HP=${char.health}/${char.health_cap}, Energy=${char.energy}/${char.energy_cap}`
  )
  console.log(
    `Position: [${char.position[0][0]}/${char.position[0][1]}, ${char.position[1][0]}/${char.position[1][1]}]`
  )
  console.log(`Power: ${char.power}, Weight: ${char.weight}`)
  console.log(`Target: ${char.target_id} (type: ${char.target_type})`)
})
```

**CharacterStateJson Structure:**

```typescript
interface CharacterStateJson {
  id: number // u8 - Character identifier
  group: number // u8 - Group/team identifier
  position: [[number, number], [number, number]] // Fixed-point [x, y] position
  velocity: [[number, number], [number, number]] // Fixed-point [vx, vy] velocity
  health: number // u16 - Current health points
  health_cap: number // u16 - Maximum health capacity
  energy: number // u8 - Current energy
  energy_cap: number // u8 - Maximum energy capacity
  power: number // u8 - Attack power
  weight: number // u8 - Entity weight
  jump_force: [number, number] // Fixed-point jump strength
  move_speed: [number, number] // Fixed-point movement speed
  armor: number[] // u8[9] - Armor values for 9 elements
  energy_regen: number // u8 - Energy regeneration amount
  energy_regen_rate: number // u8 - Frames between energy regen
  energy_charge: number // u8 - Energy charge amount
  energy_charge_rate: number // u8 - Frames between energy charge
  dir: [number, number] // [u8, u8] - Direction [facing, gravity_dir]
  enmity: number // u8 - Hostility level
  target_id: number | null // Option<u8> - Target entity ID
  target_type: number // u8 - Target type
  size: [number, number] // [u8, u8] - Entity size [width, height]
  collision: [boolean, boolean, boolean, boolean] // [top, right, bottom, left] collision flags
  locked_action: number | null // Option<u8> - Currently locked action ID
  status_effects: number[] // Vec<u8> - Active status effect IDs
  behaviors: [number, number][] // Array of [condition_id, action_id] pairs
}
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
    `Spawn ${spawn.id}: Owner=${spawn.owner_id} (type: ${spawn.owner_type})`
  )
  console.log(
    `Health: ${spawn.health}/${spawn.health_cap}, Life: ${spawn.life_span}`
  )
  console.log(
    `Position: [${spawn.position[0][0]}/${spawn.position[0][1]}, ${spawn.position[1][0]}/${spawn.position[1][1]}]`
  )
  console.log(`Rotation: ${spawn.rotation[0]}/${spawn.rotation[1]}`)
})
```

**SpawnStateJson Structure:**

```typescript
interface SpawnStateJson {
  id: number // u8 - Spawn instance identifier
  spawn_id: number // u8 - Spawn definition ID
  owner_id: number // u8 - Owner entity ID
  owner_type: number // u8 - Owner type (1=Character, 2=Spawn)
  position: [[number, number], [number, number]] // Fixed-point [x, y] position
  velocity: [[number, number], [number, number]] // Fixed-point [vx, vy] velocity
  health: number // u16 - Current health points
  health_cap: number // u16 - Maximum health capacity
  rotation: [number, number] // Fixed-point rotation angle
  life_span: number // u16 - Remaining lifespan in frames
  element: number | null // Option<u8> - Element type (0-8)
  dir: [number, number] // [u8, u8] - Direction [facing, gravity_dir]
  enmity: number // u8 - Hostility level
  target_id: number | null // Option<u8> - Target entity ID
  target_type: number // u8 - Target type
  size: [number, number] // [u8, u8] - Entity size [width, height]
  collision: [boolean, boolean, boolean, boolean] // [top, right, bottom, left] collision flags
  runtime_vars: number[] // u8[4] - Runtime variables
  runtime_fixed: [
    [number, number],
    [number, number],
    [number, number],
    [number, number]
  ] // Fixed-point runtime values
}
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
    `Effect ${effect.instance_id}: Definition=${effect.definition_id}`
  )
  console.log(`Duration: ${effect.life_span}, Stacks: ${effect.stack_count}`)
  console.log(`Runtime vars: [${effect.runtime_vars.join(', ')}]`)
})
```

**StatusEffectStateJson Structure:**

```typescript
interface StatusEffectStateJson {
  instance_id: number // u8 - Status effect instance identifier
  definition_id: number // usize - Status effect definition ID
  life_span: number // u16 - Remaining duration in frames
  stack_count: number // u8 - Current stack count
  runtime_vars: number[] // u8[4] - Runtime variables
  runtime_fixed: [
    [number, number],
    [number, number],
    [number, number],
    [number, number]
  ] // Fixed-point runtime values
}
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

## Practical Examples

### Creating a Basic Character

```javascript
const character = {
  id: 1,
  group: 1,
  position: [
    [160, 32],
    [160, 32],
  ], // Position (5.0, 5.0)
  health: 100,
  health_cap: 150,
  energy: 50,
  energy_cap: 100,
  power: 15,
  weight: 8,
  jump_force: [320, 32], // Jump force of 10.0
  move_speed: [96, 32], // Move speed of 3.0
  armor: [10, 5, 0, 15, 20, 0, 0, 8, 12], // Varied armor values
  energy_regen: 2,
  energy_regen_rate: 30, // Regen every 0.5 seconds
  energy_charge: 5,
  energy_charge_rate: 60, // Charge every 1 second
  dir: [1, 0], // Facing right, normal gravity
  enmity: 0, // Neutral
  target_id: null, // No target
  target_type: 0, // No targeting
  behaviors: [
    [0, 0],
    [1, 1],
  ], // Two behavior pairs
}
```

### Creating a Projectile Spawn

```javascript
const projectile = {
  damage_base: 30,
  damage_range: 10, // 30-40 damage
  crit_chance: 25, // ~10% crit chance (25/255)
  crit_multiplier: 200, // ~78% damage bonus (200/255)
  health_cap: 1, // Dies in one hit
  duration: 180, // 3 seconds at 60fps
  element: 1, // Fire element
  chance: 255, // Always spawns
  args: [0, 0, 0, 0, 0, 0, 0, 0],
  spawns: [0, 0, 0, 0],
  behavior_script: [
    /* bytecode */
  ],
  collision_script: [
    /* bytecode */
  ],
  despawn_script: [
    /* bytecode */
  ],
}
```

### Handling Fixed-Point Values

```javascript
// Convert floating-point to fixed-point
function toFixedPoint(value, denominator = 32) {
  return [Math.round(value * denominator), denominator]
}

// Convert fixed-point to floating-point
function fromFixedPoint([numerator, denominator]) {
  return numerator / denominator
}

// Example usage
const position = [
  toFixedPoint(7.5), // x = 7.5 -> [240, 32]
  toFixedPoint(12.25), // y = 12.25 -> [392, 32]
]

const actualX = fromFixedPoint(position[0]) // 7.5
const actualY = fromFixedPoint(position[1]) // 12.25
```

### Error Handling Best Practices

```javascript
function safeGameStep(wrapper) {
  try {
    if (!wrapper.isGameInitialized()) {
      console.warn('Game not initialized')
      return false
    }

    if (wrapper.isGameEnded()) {
      console.log('Game has ended')
      return false
    }

    if (!wrapper.isStable()) {
      console.warn('System unstable, attempting recovery')
      wrapper.attemptStabilization()
    }

    wrapper.stepFrame()
    return true
  } catch (error) {
    console.error('Game step failed:', error)

    // Get detailed error information
    const details = wrapper.getLastErrorDetails()
    console.log('Error details:', details)

    // Check system health
    const health = JSON.parse(wrapper.getHealthInfo())
    console.log('System health:', health)

    return false
  }
}
```

### Validation Error Handling

```javascript
function createGameWithValidation(config) {
  try {
    // Validate configuration first
    const validationResult = GameWrapper.validateConfig(JSON.stringify(config))
    console.log('Validation passed:', validationResult)

    // Create wrapper
    const wrapper = new GameWrapper(JSON.stringify(config))

    // Initialize game
    wrapper.newGame()

    return wrapper
  } catch (error) {
    console.error('Game creation failed:', error)

    // Parse validation errors if available
    try {
      const errorData = JSON.parse(error.message)
      if (errorData.validation_errors) {
        console.log('Validation errors:')
        errorData.validation_errors.forEach((err) => {
          console.log(`- ${err.field}: ${err.message}`)
          if (err.context) {
            console.log(`  Context: ${err.context}`)
          }
        })
      }
    } catch (parseError) {
      // Error message wasn't JSON, just log it
      console.log('Raw error:', error.message)
    }

    return null
  }
}
```

## Performance Considerations

- The wrapper includes internal caching for JSON serialization to improve performance
- Cache is automatically invalidated when game state changes
- Multiple calls to the same getter method within the same frame will use cached results
- Frame stepping clears all caches to ensure data consistency
- Fixed-point arithmetic ensures deterministic behavior but may be slower than floating-point
- Large tilemaps and many entities will impact serialization performance

## Thread Safety

The WASM wrapper is designed for single-threaded use. Do not call methods from multiple threads simultaneously.

## Deterministic Behavior

The game engine is designed to be completely deterministic:

- Same seed + same inputs = same results
- Fixed-point arithmetic prevents floating-point inconsistencies
- All random number generation is seeded and reproducible
- Frame-perfect timing ensures consistent simulation

This makes the engine suitable for:

- Replay systems
- Multiplayer synchronization
- Automated testing
- Tournament play
