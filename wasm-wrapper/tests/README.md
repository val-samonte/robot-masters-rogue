# Robot Masters Game Engine - WASM Wrapper

This package provides WebAssembly bindings for the Robot Masters Game Engine, along with TypeScript constants and utilities for building game scripts.

## Installation

```bash
npm install robot-masters-wasm
```

## Usage

### Basic Game Initialization

```typescript
import { GameWrapper } from './wasm_wrapper'
import { createExampleGameConfig } from './examples'

// Create a game configuration
const config = createExampleGameConfig()

// Initialize the game
const game = new GameWrapper(JSON.stringify(config))

// Check if initialization was successful
if (game.is_initialized()) {
  console.log('Game initialized successfully!')
}
```

### Building Scripts with Constants

```typescript
import { OperatorAddress, PropertyAddress, ScriptBuilder } from './constants'

// Create a simple movement script
const script = new ScriptBuilder()
  .exitIfNoEnergy(1) // Exit if not enough energy
  .applyEnergyCost() // Consume energy
  .readProperty(0, PropertyAddress.ENTITY_FACING) // Read facing direction
  .assignFixed(1, 3, 1) // Set speed to 3.0
  .mulFixed(2, 0, 1) // Multiply facing * speed
  .writeProperty(PropertyAddress.CHARACTER_VEL_X, 2) // Set X velocity
  .applyDuration() // Lock action for duration
  .build()

// Use the script in an action definition
const actionDefinition = {
  energy_cost: 15,
  interval: 1,
  duration: 20,
  cooldown: 40,
  args: [0, 0, 0, 0, 0, 0, 0, 0],
  spawns: [0, 0, 0, 0],
  script: script,
}
```

### Manual Script Building

```typescript
import { OperatorAddress, PropertyAddress } from './constants'

// Build script manually using raw constants
const manualScript = [
  OperatorAddress.EXIT_IF_NO_ENERGY,
  1, // Exit if no energy
  OperatorAddress.APPLY_ENERGY_COST, // Apply energy cost
  OperatorAddress.READ_PROP,
  0,
  PropertyAddress.CHARACTER_POS_X, // Read X position
  OperatorAddress.ASSIGN_FIXED,
  1,
  1,
  1, // Set fixed[1] = 1.0
  OperatorAddress.ADD,
  2,
  0,
  1, // Add position + 1.0
  OperatorAddress.WRITE_PROP,
  PropertyAddress.CHARACTER_POS_X,
  2, // Write new position
  OperatorAddress.EXIT,
  0, // Exit successfully
]
```

## Constants Reference

### Operator Addresses

The `OperatorAddress` object contains constants for all script operators:

- **Control Flow**: `EXIT`, `EXIT_IF_NO_ENERGY`, `EXIT_IF_COOLDOWN`, `SKIP`, `GOTO`
- **Properties**: `READ_PROP`, `WRITE_PROP`
- **Variables**: `ASSIGN_BYTE`, `ASSIGN_FIXED`, `ASSIGN_RANDOM`, `TO_BYTE`, `TO_FIXED`
- **Arithmetic**: `ADD`, `SUB`, `MUL`, `DIV`, `NEGATE`, `ADD_BYTE`, `SUB_BYTE`, etc.
- **Logic**: `EQUAL`, `NOT_EQUAL`, `LESS_THAN`, `AND`, `OR`, `NOT`
- **Game Actions**: `LOCK_ACTION`, `UNLOCK_ACTION`, `APPLY_ENERGY_COST`, `APPLY_DURATION`, `SPAWN`

### Property Addresses

The `PropertyAddress` object contains constants for accessing game properties:

- **Game State**: `GAME_SEED`, `GAME_FRAME`, `GAME_GRAVITY`
- **Character**: `CHARACTER_ID`, `CHARACTER_POS_X`, `CHARACTER_HEALTH`, `CHARACTER_ENERGY`
- **Actions**: `ACTION_DEF_ENERGY_COST`, `ACTION_INST_VAR0`, `ACTION_INST_REMAINING_DURATION`
- **Spawns**: `SPAWN_POS_X`, `SPAWN_VEL_Y`, `SPAWN_INST_LIFESPAN`
- **Status Effects**: `STATUS_EFFECT_DEF_DURATION`, `STATUS_EFFECT_INST_STACK_COUNT`

### Elements

The `Element` object contains constants for damage types:

```typescript
Element.PUNCT // Puncture - piercing damage
Element.BLAST // Explosive AOE damage
Element.FORCE // Blunt impact damage
Element.SEVER // Critical damage
Element.HEAT // Burning damage over time
Element.CRYO // Slowing/freezing effects
Element.JOLT // Energy manipulation
Element.ACID // Disables buffs
Element.VIRUS // Behavior alteration
```

## Script Building Patterns

### Action Scripts

Actions are triggered when conditions are met and consume energy:

```typescript
const attackScript = new ScriptBuilder()
  .exitIfNoEnergy(1) // Require energy
  .exitIfCooldown(1) // Respect cooldown
  .applyEnergyCost() // Consume energy
  .spawn(0) // Create projectile
  .applyDuration() // Lock action
  .build()
```

### Condition Scripts

Conditions determine when actions should trigger:

```typescript
const enemyNearCondition = new ScriptBuilder()
  .readProperty(0, PropertyAddress.CHARACTER_POS_X)
  // ... distance calculation logic ...
  .assignByte(0, 1) // Set result to true
  .exit(0) // Return result
  .build()
```

### Spawn Scripts

Spawns control projectile and temporary object behavior:

```typescript
const projectileScript = new ScriptBuilder()
  .readProperty(0, PropertyAddress.SPAWN_VEL_X)
  .readProperty(1, PropertyAddress.SPAWN_POS_X)
  .addFixed(2, 1, 0) // Update position
  .writeProperty(PropertyAddress.SPAWN_POS_X, 2)
  .build()
```

## Configuration Validation

The wrapper includes built-in validation:

```typescript
import { GameWrapper } from './wasm_wrapper'

try {
  // Validate configuration without creating game instance
  GameWrapper.validate_config(JSON.stringify(config))
  console.log('Configuration is valid!')
} catch (error) {
  console.error('Validation failed:', error)
}
```

## Examples

See `examples.ts` for complete working examples of:

- Character movement scripts
- Projectile spawning
- Status effect applications
- Condition evaluations
- Complete game configurations

## Important Notes

1. **Sync with Rust**: These constants must stay synchronized with the Rust constants in `game-engine/src/constants.rs`
2. **Fixed-Point Math**: The engine uses fixed-point arithmetic. Use `assignFixed(var, numerator, denominator)` for decimal values
3. **Script Limits**: Scripts have a maximum length defined by `MAX_SCRIPT_LENGTH` in the engine
4. **Variable Indices**: Scripts have 8 byte variables (0-7) and 4 fixed-point variables (0-3)

## Type Safety

The package includes TypeScript definitions for better development experience:

```typescript
import type {
  OperatorAddressType,
  PropertyAddressType,
  ElementType,
} from './constants'

function buildScript(
  op: OperatorAddressType,
  prop: PropertyAddressType
): number[] {
  return [op, 0, prop]
}
```
