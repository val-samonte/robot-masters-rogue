# Direction System Documentation (Updated)

## Overview

The direction system has been updated to use a consistent 0,1,2 pattern for both horizontal and vertical directions, with proper Fixed-point arithmetic for script operations.

## Horizontal Direction System

### Storage Format

- **Game State**: `character.core.dir.0` as `u8`
- **Values**: `0 = left`, `1 = neutral`, `2 = right`

### Script Access

- **Property**: `ENTITY_DIR_HORIZONTAL` (0x40)
- **Script Type**: `Fixed` values in `engine.fixed[]` array
- **Values**: `-1.0 = left`, `0.0 = neutral`, `+1.0 = right`

### Conversion Logic

```rust
// Read (Game State → Script)
let script_value = (game_state_value as i16) - 1;
engine.fixed[var_index] = Fixed::from_int(script_value);

// Write (Script → Game State)
let script_value = engine.fixed[var_index].to_int();
game_state_value = ((script_value + 1).max(0).min(2)) as u8;
```

### Usage in Scripts

```typescript
// Read current direction
OperatorAddress.READ_PROP,
0,
PropertyAddress.ENTITY_DIR_HORIZONTAL, // → fixed[0] = -1.0, 0.0, or +1.0

// Multiply by move speed for movement
OperatorAddress.READ_PROP,
1,
PropertyAddress.CHARACTER_MOVE_SPEED, // → fixed[1] = move speed

OperatorAddress.MUL,
2,
0,
1, // fixed[2] = direction * speed

// Write to velocity
OperatorAddress.WRITE_PROP,
PropertyAddress.CHARACTER_VEL_X,
2, // Apply calculated velocity
```

## Vertical Direction System

### Storage Format

- **Game State**: `character.core.dir.1` as `u8`
- **Values**: `0 = downward`, `1 = neutral`, `2 = upward`

### Script Access

- **Property**: `ENTITY_DIR_VERTICAL` (0x41)
- **Script Type**: `u8` values in `engine.vars[]` array
- **Usage**: Controls gravity multiplier effect

## Collision Properties (Fixed)

### Issue Resolution

**Problem**: Collision properties were implemented in `read_character_property_impl` but not in the main `read_property` method used by conditions.

**Solution**: Added collision properties to `ConditionContext::read_property`:

```rust
// Character collision flags
property_address::CHARACTER_COLLISION_TOP => {
    if var_index < engine.vars.len() {
        engine.vars[var_index] = if character.core.collision.0 { 1 } else { 0 };
    }
}
property_address::CHARACTER_COLLISION_RIGHT => {
    if var_index < engine.vars.len() {
        engine.vars[var_index] = if character.core.collision.1 { 1 } else { 0 };
    }
}
// ... similar for BOTTOM and LEFT
```

### Available Properties

- `CHARACTER_COLLISION_TOP` (0x26) - Top collision detection
- `CHARACTER_COLLISION_RIGHT` (0x27) - Right collision detection
- `CHARACTER_COLLISION_BOTTOM` (0x28) - Bottom collision detection
- `CHARACTER_COLLISION_LEFT` (0x29) - Left collision detection

### Usage in Conditions

```typescript
// Wall leaning detection
OperatorAddress.READ_PROP,
0,
PropertyAddress.CHARACTER_COLLISION_RIGHT, // → vars[0] = 0 or 1

OperatorAddress.READ_PROP,
1,
PropertyAddress.CHARACTER_COLLISION_LEFT, // → vars[1] = 0 or 1

OperatorAddress.OR,
2,
0,
1, // vars[2] = vars[0] OR vars[1]

OperatorAddress.EXIT_WITH_VAR,
2, // Return collision result
```

## Complete Turn-Around Behavior

### Behavior Configuration

```typescript
behaviors: [
  [0, 0], // IS_WALL_LEANING → TURN_AROUND (high priority)
  [1, 1], // ALWAYS → RUN (low priority)
]
```

### Execution Flow

1. **No Wall Contact**: IS_WALL_LEANING returns false → RUN executes → Character moves
2. **Wall Contact**: IS_WALL_LEANING returns true → TURN_AROUND executes → Direction flips
3. **After Turn**: IS_WALL_LEANING returns false → RUN executes → Character moves in new direction

### TURN_AROUND Action

```typescript
TURN_AROUND: [
  OperatorAddress.READ_PROP,
  0,
  PropertyAddress.ENTITY_DIR_HORIZONTAL, // Read current direction
  OperatorAddress.NEGATE,
  0, // Flip direction: -1.0 ↔ +1.0
  OperatorAddress.WRITE_PROP,
  PropertyAddress.ENTITY_DIR_HORIZONTAL,
  0, // Write flipped direction
  OperatorAddress.EXIT,
  1,
]
```

## Testing and Debugging

### Node.js Debug Pattern

```javascript
// Create debug script in debug-node/debug.js
const gameWrapper = new GameWrapper(JSON.stringify(gameConfig))
gameWrapper.new_game()

for (let frame = 0; frame < 100; frame++) {
  const before = JSON.parse(gameWrapper.get_characters_json())
  gameWrapper.step_frame()
  const after = JSON.parse(gameWrapper.get_characters_json())

  // Log direction changes
  if (before[0].dir[0] !== after[0].dir[0]) {
    console.log(`Direction: ${before[0].dir[0]} → ${after[0].dir[0]}`)
  }

  // Log wall collisions
  if (after[0].collision[1] || after[0].collision[3]) {
    console.log(
      `Wall hit: R=${after[0].collision[1]} L=${after[0].collision[3]}`
    )
  }
}
```

### Verification Checklist

- [ ] Character starts moving in initial direction
- [ ] Character hits wall and collision flag becomes true
- [ ] IS_WALL_LEANING condition returns true when touching wall
- [ ] TURN_AROUND action executes and flips direction
- [ ] Character moves in opposite direction after turn
- [ ] Process repeats when hitting opposite wall

## Migration Notes

### From Old System

- **Old**: `dir[0] = 0/1` (left/right) with direct u8 script access
- **New**: `dir[0] = 0/1/2` (left/neutral/right) with Fixed script access

### Breaking Changes

- Scripts using `ENTITY_DIR_HORIZONTAL` now receive Fixed values instead of u8
- Direction arithmetic now uses Fixed-point operations
- Collision properties now work in condition scripts (previously broken)

### Compatibility

- Game state serialization format unchanged (still u8 values)
- WASM interface unchanged
- Only script-level access patterns changed
