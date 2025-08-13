# ENTITY_DIR Script Access Patterns

## Overview

This document provides definitive guidance for accessing and manipulating ENTITY_DIR properties in scripts. Understanding these patterns is critical for implementing movement, gravity, and directional behaviors correctly.

## Storage vs Script Access

### Game State Storage (u8 values)

ENTITY_DIR properties are stored as u8 values in the game state:

```rust
// In EntityCore struct
pub dir: (u8, u8), // (horizontal, vertical)
```

**Storage Values:**

- `dir.0` (horizontal): `0` = left, `1` = neutral, `2` = right
- `dir.1` (vertical): `0` = upward, `1` = neutral, `2` = downward

### Script Access (Fixed values)

When accessed through scripts, ENTITY_DIR values are **automatically converted to Fixed-point**:

```rust
// Automatic conversion in read_property implementations
let x = (character.core.dir.0 as i16) - 1;  // 0→-1, 1→0, 2→1
engine.fixed[var_index] = Fixed::from_raw(x);
```

**Script Values (Fixed-point):**

- `dir.0` (horizontal): `-1.0` = left, `0.0` = neutral, `+1.0` = right
- `dir.1` (vertical): `-1.0` = upward, `0.0` = neutral, `+1.0` = downward

## Why Fixed-Point Conversion?

The conversion enables direct multiplication with other Fixed-point properties:

```javascript
// Direct multiplication works correctly
velocity_x = direction_horizontal * move_speed // Both are Fixed-point
jump_velocity = jump_force * direction_vertical * -1 // All Fixed-point
```

Without conversion, you would need manual scaling and type conversions in every script.

## Direction Value Reference

| Game State (u8)        | Script Access (Fixed) | Meaning          |
| ---------------------- | --------------------- | ---------------- |
| **Horizontal (dir.0)** |
| `0`                    | `-1.0`                | Left             |
| `1`                    | `0.0`                 | Neutral          |
| `2`                    | `+1.0`                | Right            |
| **Vertical (dir.1)**   |
| `0`                    | `-1.0`                | Upward gravity   |
| `1`                    | `0.0`                 | Neutral gravity  |
| `2`                    | `+1.0`                | Downward gravity |

## Gravity System

### Default Gravity Orientation

Characters should have `dir.1 = 2` (downward gravity) by default:

```javascript
// In game configuration
characters: [
  {
    // ... other properties
    dir: [1, 2], // neutral horizontal, downward gravity
  },
]
```

### Jump Force Calculation

Since jump forces are positive values, use this formula for gravity-aware jumping:

```javascript
// Pseudo-code (convert to actual script bytecode)
character.vel.1 = character.jump_force * character.dir.1 * -1;
```

**Why multiply by -1?**

- `jump_force` = positive value (e.g., `10.0`)
- `dir.1` = `+1.0` for downward gravity
- `jump_force * dir.1 * -1` = `10.0 * 1.0 * -1` = `-10.0` (upward velocity)

**With inverted gravity:**

- `dir.1` = `-1.0` for upward gravity
- `jump_force * dir.1 * -1` = `10.0 * -1.0 * -1` = `+10.0` (downward velocity)

## Script Implementation Patterns

### ✅ CORRECT: Reading Direction

```javascript
// Read direction into fixed array
OperatorAddress.READ_PROP,
0,  // Store in fixed[0]
PropertyAddress.ENTITY_DIR_HORIZONTAL,  // Automatically converts to Fixed
```

### ✅ CORRECT: Setting Direction

```javascript
// Method 1: Use ASSIGN_FIXED for literal values
OperatorAddress.ASSIGN_FIXED,
0,  // fixed[0] =
1,  // Fixed::from_raw(1) → represents dir = 2 in game state
OperatorAddress.WRITE_PROP,
PropertyAddress.ENTITY_DIR_VERTICAL,
0,  // Write fixed[0] to direction

// Method 2: Read-modify-write pattern
OperatorAddress.READ_PROP,
0,
PropertyAddress.ENTITY_DIR_HORIZONTAL,  // Read current direction
OperatorAddress.NEGATE,
0,  // Flip direction
OperatorAddress.WRITE_PROP,
PropertyAddress.ENTITY_DIR_HORIZONTAL,
0,  // Write back flipped direction
```

### ❌ INCORRECT: Type Mismatch

```javascript
// WRONG - Don't mix ASSIGN_BYTE with ENTITY_DIR
OperatorAddress.ASSIGN_BYTE,  // ❌ Stores in vars[] (u8)
0,
2,
OperatorAddress.WRITE_PROP,
PropertyAddress.ENTITY_DIR_VERTICAL,  // ❌ Expects fixed[] (Fixed)
0,
```

### ✅ CORRECT: Movement Calculation

```javascript
// Calculate velocity = direction * speed
OperatorAddress.READ_PROP,
0,
PropertyAddress.ENTITY_DIR_HORIZONTAL,  // fixed[0] = direction (-1, 0, +1)
OperatorAddress.READ_PROP,
1,
PropertyAddress.CHARACTER_MOVE_SPEED,   // fixed[1] = speed
OperatorAddress.MUL,
2,
0, 1,  // fixed[2] = direction * speed
OperatorAddress.WRITE_PROP,
PropertyAddress.CHARACTER_VEL_X,
2,  // Apply calculated velocity
```

### ✅ CORRECT: Gravity-Aware Jump

```javascript
// Jump with gravity awareness
OperatorAddress.READ_PROP,
0,
PropertyAddress.ENTITY_DIR_VERTICAL,    // fixed[0] = gravity direction
OperatorAddress.READ_PROP,
1,
PropertyAddress.CHARACTER_JUMP_FORCE,   // fixed[1] = jump force
OperatorAddress.MUL,
2,
1, 0,  // fixed[2] = jump_force * gravity_direction
OperatorAddress.NEGATE,
2,     // fixed[2] = -(jump_force * gravity_direction)
OperatorAddress.WRITE_PROP,
PropertyAddress.CHARACTER_VEL_Y,
2,     // Apply jump velocity
```

## Common Mistakes to Avoid

### 1. Array Type Confusion

❌ **WRONG:**

```javascript
ASSIGN_BYTE → vars[0] → WRITE_PROP ENTITY_DIR_*
```

✅ **CORRECT:**

```javascript
ASSIGN_FIXED → fixed[0] → WRITE_PROP ENTITY_DIR_*
```

### 2. Raw Value Confusion

❌ **WRONG:** Assuming script values match game state values

```javascript
// Don't assume dir = 2 in scripts (it's actually +1.0)
```

✅ **CORRECT:** Use converted values

```javascript
// dir.1 = +1.0 in scripts represents downward gravity
```

### 3. Jump Direction Errors

❌ **WRONG:** Forgetting the -1 multiplier

```javascript
velocity = jump_force * gravity_direction // Wrong direction
```

✅ **CORRECT:** Include -1 for proper jump direction

```javascript
velocity = jump_force * gravity_direction * -1 // Correct
```

## Testing and Validation

### Node.js Debug Pattern

```javascript
// Test direction values in Node.js
const char = JSON.parse(gameWrapper.get_characters_json())[0]
console.log('Game state dir:', char.dir) // [1, 2] = neutral horizontal, downward gravity
console.log('Script would see:', [char.dir[0] - 1, char.dir[1] - 1]) // [0, 1] in Fixed-point
```

### Expected Behaviors

- **Horizontal movement:** `velocity_x = direction * move_speed`
- **Gravity-aware jump:** `velocity_y = jump_force * gravity_dir * -1`
- **Direction flip:** `new_direction = -old_direction`
- **Gravity inversion:** `dir.1: 2 → 0` (downward → upward)

## Integration with Other Systems

### Collision Detection

Direction values work with collision flags for turn-around behavior:

```javascript
// Turn around when hitting walls
if (collision_left || collision_right) {
  direction_horizontal = -direction_horizontal
  velocity_x = direction_horizontal * move_speed
}
```

### Status Effects

Status effects can modify direction for temporary gravity changes:

```javascript
// Temporary gravity inversion
WRITE_PROP ENTITY_DIR_VERTICAL with inverted value
```

## Summary

**Key Rules:**

1. **Always use Fixed arrays** (`fixed[]`) with ENTITY_DIR properties
2. **Remember the conversion:** Game state `0,1,2` → Script `-1,0,+1`
3. **Use ASSIGN_FIXED** for literal direction values
4. **Include -1 multiplier** for gravity-aware jumping
5. **Test with Node.js** to verify direction values

**Common Pattern:**

```javascript
READ_PROP → fixed[] → operations → WRITE_PROP
```

This pattern ensures type consistency and correct behavior across all direction-related scripts.
