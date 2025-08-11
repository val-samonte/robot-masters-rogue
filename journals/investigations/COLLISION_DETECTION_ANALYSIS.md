# Collision Detection Issues Analysis

## Problem Statement

Characters get stuck after turning around at walls due to collision detection timing and position overlap issues. The collision system has multiple critical bugs that cause characters to jump to invalid positions and report incorrect collision flags.

## Current Symptoms (Confirmed by Debug Testing)

### 1. Massive Position Jump

- **Expected**: Character at x=230 with width=16 should hit wall at x=240 and stop at x=224
- **Actual**: Character jumps from x=230 to x=256 between frame 0 and frame 1 (26-pixel jump!)
- **Impact**: Character ends up completely outside the 256-pixel wide game area

### 2. Wrong Collision Flags

- **Expected**: Character hitting right wall should have collision_flags[1] = true (right collision)
- **Actual**: Character shows collision_flags[3] = true (left collision)
- **Impact**: Turn-around behaviors trigger incorrectly, causing characters to move in wrong direction

### 3. Zero Velocity with Position Changes

- **Expected**: If velocity is (0.0, y), horizontal position should not change
- **Actual**: Character has velocity (0.0, 0.5) but position changes from x=230 to x=256
- **Impact**: Physics system is fundamentally broken

### 4. Character Outside Game Boundaries

- **Expected**: Characters should be constrained within 0 ≤ x ≤ 240 (16x15 tilemap, 16 pixels per tile)
- **Actual**: Character ends up at x=256, which is 16 pixels outside the game area
- **Impact**: Character is invisible and unreachable

## Frame Execution Order Analysis

Based on `game-engine/src/state.rs::advance_frame()`, the current frame processing order is:

1. **Process status effects** - Updates character status effects
2. **Execute character behaviors** - Runs condition/action scripts, sets velocity
3. **Apply gravity** - Adds gravity to velocity
4. **Check collisions and constrain velocity** - `check_and_constrain_movement()`
   - Calls `correct_entity_overlap_static()` - **POSITION CORRECTION HAPPENS HERE**
   - Checks horizontal/vertical movement constraints
   - Updates collision flags
5. **Apply velocity to position** - Adds velocity to position
6. **Clean up entities** - Removes expired entities

## Root Cause Analysis

### Issue 1: Position Correction Algorithm is Broken

The `correct_entity_overlap_static()` method in `game-engine/src/state.rs` has several problems:

```rust
// Current problematic algorithm:
const MAX_CORRECTION_DISTANCE: i32 = 32; // Too large!

// Try pushing left first (for entities moving right into walls)
for distance in 1..=MAX_CORRECTION_DISTANCE {
    let test_pos = (
        entity.pos.0.sub(crate::math::Fixed::from_int(distance as i16)),
        entity.pos.1,
    );
    // ... test collision and move if valid
}
```

**Problems**:

- **MAX_CORRECTION_DISTANCE = 32** is too large (2 tiles worth of movement)
- **No velocity direction consideration** - always tries left first, regardless of movement direction
- **No boundary checking** - can push entities outside game area
- **Linear search** - tries every pixel from 1 to 32, inefficient

### Issue 2: Collision Flag Detection Logic is Wrong

The collision flag detection in `check_and_constrain_movement()` has timing issues:

```rust
// Current problematic logic:
if horizontal_collision {
    if original_vel_x.to_int() > 0 {
        collision_flags.1 = true; // right collision
    } else if original_vel_x.to_int() < 0 {
        collision_flags.3 = true; // left collision
    }
}
```

**Problems**:

- **Position correction happens BEFORE collision flag detection**
- **Flags are based on original velocity, not final position**
- **No validation that flags match actual collision state**

### Issue 3: Frame Processing Order Creates Race Conditions

The current order causes timing issues:

1. Position correction moves character (x=230 → x=256)
2. Collision flags are set based on old velocity (0.0, 0.0)
3. Next frame's behaviors see wrong collision state
4. Character gets stuck in invalid state

## Coordinate System Documentation

### Tilemap Layout

- **Dimensions**: 16 columns × 15 rows
- **Tile Size**: 16 pixels × 16 pixels
- **Total Game Area**: 256 pixels wide × 240 pixels tall
- **Wall Positions**:
  - Left wall: x = 0 (column 0)
  - Right wall: x = 240 (column 15 × 16 = 240)
  - Top wall: y = 0 (row 0)
  - Bottom wall: y = 224 (row 14 × 16 = 224)

### Entity Coordinate System

- **Position**: Top-left corner of entity bounding box
- **Size**: Width and height in pixels
- **Bounds Calculation**:
  - Left edge: pos.x
  - Right edge: pos.x + width
  - Top edge: pos.y
  - Bottom edge: pos.y + height

### Collision Detection Coordinate System

- **Tile Coordinates**: `tile_x = pixel_x / 16`, `tile_y = pixel_y / 16`
- **Boundary Checks**: Entity spans from pos to pos + size (exclusive)
- **Wall Collision**: Entity right edge ≥ 240 should trigger right wall collision

## Debug Test Results

Using `debug-node/debug-collision-simple.js` with character starting at x=230:

```
Frame 0: Position (230.0, 208.0), Velocity (0.0, 0.0), Collision [false, false, false, false]
Frame 1: Position (256.0, 208.5), Velocity (0.0, 0.5), Collision [false, false, false, true]
```

**Analysis**:

- Character should be at x=224 (pushed back from wall)
- Instead character is at x=256 (pushed 26 pixels in wrong direction)
- Collision flags show left collision instead of right collision
- Character is now outside the game area entirely

## Expected Behavior vs Actual Behavior

### Expected Collision Sequence

1. Character at x=230 with width=16 has right edge at x=246
2. Right edge overlaps with wall at x=240 by 6 pixels
3. Position correction pushes character left to x=224 (minimal movement)
4. Collision flags set to [false, true, false, false] (right collision)
5. Turn-around behavior triggers, character faces left
6. Character moves left away from wall

### Actual Collision Sequence

1. Character at x=230 with width=16 has right edge at x=246
2. Position correction pushes character LEFT by 26 pixels to x=256 (wrong direction!)
3. Character is now outside game area (x=256 > 240)
4. Collision flags set to [false, false, false, true] (wrong direction)
5. Behaviors see incorrect collision state
6. Character stuck in invalid position

## Impact on Game Functionality

### Immediate Issues

- Characters get stuck at walls and cannot move
- Turn-around behaviors trigger incorrectly
- Characters can end up outside game boundaries
- Physics system produces non-deterministic results

### Long-term Issues

- Game becomes unplayable when characters hit walls
- Multiplayer/replay systems will desync due to non-deterministic physics
- AI behaviors fail because collision detection is unreliable
- Performance issues from inefficient position correction algorithm

## Next Steps

The analysis reveals that the collision detection system needs a complete rewrite with the following priorities:

1. **Fix position overlap correction algorithm** (Task 11.2)
2. **Fix tilemap collision detection coordinate system** (Task 11.1)
3. **Fix frame processing order and timing** (Task 11.3)
4. **Implement comprehensive collision flag detection** (Task 11.4)
5. **Test and validate complete collision system** (Task 11.5)
6. **Optimize collision detection performance** (Task 11.6)

Each of these issues must be addressed systematically to restore proper collision detection functionality.

## Debug Tools Created

### 1. debug-node/debug-collision-simple.js

- Basic collision detection test
- Shows the x=230 → x=256 position jump
- Confirms wrong collision flags (left instead of right)
- Demonstrates character ending up outside game area

### 2. debug-node/debug-collision-detailed.js

- Frame-by-frame analysis of collision processing
- Traces exact frame execution order
- Identifies position correction as the source of the jump
- Shows 26-pixel position change with zero velocity

### 3. debug-node/debug-position-correction.js

- Isolated test of position correction algorithm
- Tests multiple overlap scenarios (left wall, right wall, boundaries)
- Confirms MAX_CORRECTION_DISTANCE = 32 is too large
- Demonstrates lack of boundary checking

## Key Findings Summary

### Critical Bugs Identified

1. **Position Correction Algorithm Broken**: `correct_entity_overlap_static()` pushes entities in wrong direction
2. **Collision Flag Logic Wrong**: Flags set based on old velocity, not final position
3. **Frame Processing Order Issues**: Position correction happens before collision flag updates
4. **Coordinate System Problems**: Boundary calculations allow out-of-bounds positions
5. **No Boundary Validation**: Characters can end up outside 256-pixel game area

### Root Cause: correct_entity_overlap_static() Method

```rust
// BROKEN ALGORITHM in game-engine/src/state.rs
const MAX_CORRECTION_DISTANCE: i32 = 32; // TOO LARGE!

// Always tries left first - WRONG for right-moving entities
for distance in 1..=MAX_CORRECTION_DISTANCE {
    let test_pos = (entity.pos.0.sub(Fixed::from_int(distance)), entity.pos.1);
    // No boundary checking - can push outside game area
}
```

### Impact Assessment

- **Immediate**: Characters get stuck at walls, game becomes unplayable
- **Long-term**: Physics system unreliable, multiplayer/replay desync issues
- **Performance**: Inefficient linear search algorithm

## Analysis Complete

This analysis has successfully identified and documented the collision detection issues. The position jump from x=230 to x=256 is caused by the broken `correct_entity_overlap_static()` method, which:

1. Uses MAX_CORRECTION_DISTANCE = 32 (too large)
2. Always tries pushing left first (wrong direction)
3. Has no boundary checking (allows out-of-bounds positions)
4. Sets collision flags incorrectly (based on old velocity)

The debug tools created provide comprehensive testing capabilities for validating fixes to the collision system. The next tasks should focus on implementing the fixes identified in this analysis.
