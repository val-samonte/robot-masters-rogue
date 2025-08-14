# Design Document

## Overview

The gravity direction system needs to be corrected to properly implement the established direction rule where 0=upward, 1=neutral, 2=downward. The current implementation has the gravity multiplier logic inverted, causing incorrect physics behavior.

## Architecture

The gravity system consists of three main components:

1. **Direction Storage**: `EntityCore.dir.1` stores the gravity direction as a u8 value (0, 1, or 2)
2. **Gravity Multiplier**: `EntityCore::get_gravity_multiplier()` converts direction to a Fixed multiplier
3. **Gravity Application**: `GameState::apply_gravity()` applies the multiplied gravity force to velocity

## Components and Interfaces

### EntityCore Direction System

**Current Broken Logic:**

```rust
pub fn get_gravity_multiplier(&self) -> Fixed {
    match self.dir.1 {
        0 => Fixed::from_int(1),  // WRONG: Upward gravity returns +1
        1 => Fixed::ZERO,         // Correct: Neutral gravity
        2 => Fixed::from_int(-1), // WRONG: Downward gravity returns -1
        _ => Fixed::ZERO,
    }
}
```

**Corrected Logic:**

```rust
pub fn get_gravity_multiplier(&self) -> Fixed {
    match self.dir.1 {
        0 => Fixed::from_int(-1), // CORRECT: Upward gravity returns -1
        1 => Fixed::ZERO,         // Correct: Neutral gravity
        2 => Fixed::from_int(1),  // CORRECT: Downward gravity returns +1
        _ => Fixed::ZERO,
    }
}
```

### Default Direction Values

**Current Issue:**

- Characters default to `dir: (2, 0)` which means right-facing with upward gravity
- This causes new characters to fall upward by default

**Corrected Defaults:**

- Characters should default to `dir: (2, 2)` for right-facing with downward gravity
- Spawns should remain `dir: (*, 1)` for neutral gravity

### Grounding Logic

The grounding logic in both ConditionContext and ActionContext is already correctly implemented:

```rust
match character.core.dir.1 {
    0 => character.core.collision.0, // Upward gravity: grounded when touching ceiling
    2 => character.core.collision.2, // Downward gravity: grounded when touching floor
    _ => character.core.collision.0 || character.core.collision.2, // Neutral: either
}
```

This logic is correct and doesn't need changes.

## Data Models

### EntityCore Structure

The `EntityCore.dir` field remains unchanged:

- `dir.0`: Horizontal direction (0=left, 1=neutral, 2=right)
- `dir.1`: Vertical direction (0=upward, 1=neutral, 2=downward)

### Gravity Physics Model

**Physics Calculation:**

```
final_velocity = current_velocity + (global_gravity × gravity_multiplier)
```

**Expected Behavior:**

- `global_gravity = +0.5` (positive = downward force)
- `dir.1 = 0` (upward): `multiplier = -1` → `velocity += +0.5 × -1 = -0.5` (upward acceleration)
- `dir.1 = 1` (neutral): `multiplier = 0` → `velocity += +0.5 × 0 = 0` (no change)
- `dir.1 = 2` (downward): `multiplier = +1` → `velocity += +0.5 × +1 = +0.5` (downward acceleration)

## Error Handling

### Invalid Direction Values

The `get_gravity_multiplier()` function should handle invalid `dir.1` values by defaulting to neutral gravity (multiplier = 0).

### Boundary Conditions

- Ensure gravity multiplier calculation is consistent across all entity types
- Validate that default values follow the established direction rule

## Testing Strategy

### Unit Testing Approach

1. **Gravity Multiplier Testing**:

   - Test each direction value (0, 1, 2) returns correct multiplier
   - Test invalid values default to neutral

2. **Physics Integration Testing**:

   - Create characters with each gravity direction
   - Apply gravity for multiple frames
   - Verify velocity changes match expected direction

3. **Default Value Testing**:
   - Create new characters and verify default `dir.1 = 2`
   - Create new spawns and verify default `dir.1 = 1`

### Node.js Debug Testing

Create debug scripts to verify:

- Characters with `dir.1 = 0` fall upward (negative velocity)
- Characters with `dir.1 = 2` fall downward (positive velocity)
- Characters with `dir.1 = 1` maintain constant vertical velocity

### Integration Testing

Test with existing game configurations to ensure:

- Normal gameplay still works (characters fall down by default)
- Inverted gravity systems work correctly (characters fall up when inverted)
- Grounding detection works for both normal and inverted gravity

## Implementation Priority

1. **High Priority**: Fix `get_gravity_multiplier()` logic
2. **High Priority**: Fix default character direction to `(2, 2)`
3. **Medium Priority**: Verify grounding logic consistency
4. **Low Priority**: Add validation for invalid direction values

## Backward Compatibility

Since this is a fresh start project with no backward compatibility requirements, we can make these breaking changes immediately. Any existing game configurations that relied on the incorrect behavior will need to be updated.

## Performance Considerations

The changes are minimal and have no performance impact:

- Simple arithmetic operations in `get_gravity_multiplier()`
- No additional memory allocation
- No changes to core game loop structure
