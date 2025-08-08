# Unfinished Implementations Tracker

This document tracks incomplete implementations to prevent bugs like the collision property issue we just fixed.

## 🚨 CRITICAL RULE: ALWAYS DOCUMENT ISSUES

**MANDATORY PROCESS**: Whenever ANY issue, bug, or incomplete implementation is discovered during development:

1. **IMMEDIATELY** create a task OR
2. **IMMEDIATELY** document it in this file under the appropriate section

**NO EXCEPTIONS**: Never leave issues undocumented. This prevents:

- Lost work and forgotten bugs
- Repeated debugging of the same issues
- Incomplete implementations that break the system
- Time wasted re-investigating known problems

**When to create a task vs document here**:

- **Create a task**: For actionable implementation work that needs to be completed
- **Document here**: For ongoing tracking of incomplete implementations, bug patterns, and reference information

## Property Access Implementation Status

### ConditionContext::read_property

✅ **Implemented Properties:**

- CHARACTER_HEALTH, CHARACTER_ENERGY
- CHARACTER_POS_X, CHARACTER_POS_Y
- ENTITY_DIR_HORIZONTAL, ENTITY_DIR_VERTICAL
- CHARACTER_HEALTH_CAP, CHARACTER_ENERGY_CAP
- CHARACTER_POWER, CHARACTER_WEIGHT
- CHARACTER_JUMP_FORCE, CHARACTER_MOVE_SPEED
- CHARACTER_COLLISION_TOP, CHARACTER_COLLISION_RIGHT, CHARACTER_COLLISION_BOTTOM, CHARACTER_COLLISION_LEFT
- GAME_GRAVITY

✅ **Recently Implemented:**

- CHARACTER_COLLISION_TOP, CHARACTER_COLLISION_RIGHT, CHARACTER_COLLISION_BOTTOM, CHARACTER_COLLISION_LEFT

❌ **Missing Properties:**

- CHARACTER_VEL_X, CHARACTER_VEL_Y (only in ActionContext)
- CHARACTER_SIZE_W, CHARACTER_SIZE_H
- CHARACTER_ENERGY_REGEN, CHARACTER_ENERGY_REGEN_RATE
- CHARACTER_ENERGY_CHARGE, CHARACTER_ENERGY_CHARGE_RATE
- CHARACTER_LOCKED_ACTION_ID, CHARACTER_STATUS_EFFECT_COUNT
- All CHARACTER*ARMOR*\* properties
- All ENTITY\_\* properties except DIR_HORIZONTAL/VERTICAL
- All SPAWN\_\* properties
- All ACTION\_\* properties

### ActionContext::read_property

✅ **Implemented Properties:**

- Same as ConditionContext plus CHARACTER_VEL_X, CHARACTER_VEL_Y

❌ **Missing Properties:**

- Same missing properties as ConditionContext

### Write Property Implementations

✅ **ConditionContext::write_property** - Implemented for basic properties
✅ **ActionContext::write_property** - Implemented for basic properties

## Common Implementation Bugs to Watch For

### 1. Array Type Mismatch

**Bug Pattern:**

```rust
// WRONG - checking fixed.len() but writing to vars
if var_index < engine.fixed.len() {
    engine.vars[var_index] = value;
}
```

**Correct Pattern:**

```rust
// RIGHT - matching array types
if var_index < engine.vars.len() {
    engine.vars[var_index] = value;  // u8 values
}

if var_index < engine.fixed.len() {
    engine.fixed[var_index] = value;  // Fixed values
}
```

### 2. Missing Property Implementation

**Bug Pattern:**

- Property defined in constants.rs
- Property implemented in read_character_property_impl
- Property NOT implemented in main read_property method
- Scripts using READ_PROP fail silently

**Prevention:**

- Always implement properties in BOTH methods
- Use consistent variable types (vars for u8, fixed for Fixed)
- Test property access with Node.js debugging

### 3. Inconsistent Type Conversion

**Bug Pattern:**

```rust
// Inconsistent - some properties use vars, others use fixed for same data type
property_address::SOME_U8_PROP => {
    engine.vars[var_index] = value;  // u8 → vars (correct)
}
property_address::OTHER_U8_PROP => {
    engine.fixed[var_index] = Fixed::from_int(value);  // u8 → fixed (inconsistent)
}
```

## ✅ FIXED: ENTITY_DIR_HORIZONTAL Inconsistency

**Status**: RESOLVED - All implementations now consistent

**Problem**: ENTITY_DIR_HORIZONTAL had multiple inconsistent implementations across different contexts.

**Solution Applied**: Made all implementations consistent:

- Read operations: Convert u8 → Fixed, store in `fixed[]`, use `fixed.len()` bounds check
- Write operations: Read Fixed from `fixed[]`, convert Fixed → u8, use `fixed.len()` bounds check
- Conversion: `script_value = game_state_value - 1`

**Impact**: RUN action now works correctly, characters can move properly.

## ✅ FIXED: Collision Detection Priority System

**Status**: RESOLVED - Wall collision flags now work correctly

**Problem**: Priority system in collision detection was clearing wall collision flags when bottom collision was detected. This prevented turn-around behavior because IS_WALL_LEANING condition always returned false when character was grounded.

**Root Cause**: In `game-engine/src/state.rs` lines 866-878 and 951-963, the collision system used a priority system:

```rust
if collision_flags.2 {
    // Bottom collision has highest priority (gravity/ground contact)
    collision_flags = (false, false, true, false);  // ← THIS CLEARED WALL FLAGS!
}
```

**Solution Applied**: Removed the priority system entirely to allow multiple collision flags simultaneously:

- Characters can now have both bottom collision (grounded) AND wall collision (touching wall)
- Example: `collision = [false, true, true, false]` for character at bottom-right corner
- This enables proper turn-around behavior when character hits wall while grounded

**Impact**:

- ✅ Wall collision flags are now set correctly: `[false, true, true, false]` when hitting right wall
- ✅ IS_WALL_LEANING condition now returns true when touching walls
- ✅ TURN_AROUND action now triggers when hitting walls
- ✅ Movement actions work correctly with collision detection

**Files Modified**: `game-engine/src/state.rs` (collision detection for both characters and spawns)

**Testing**: Verified with Node.js debugging that collision flags are now set correctly and turn-around behavior triggers.

## Current Known Issues (From Task 11.5 Testing)

### Collision System Issues Identified

**Status**: DOCUMENTED - Tasks created for fixes

**Issues Found During Comprehensive Testing**:

1. **Horizontal Collision Detection Failure** (Task 12)

   - Characters never hit left/right walls during movement
   - Only works for stationary characters
   - `check_horizontal_movement` in tilemap.rs may be broken
   - Turn-around behavior never triggers because collision during movement isn't detected

2. **Turn-Around Behavior System Broken** (Task 13)

   - Collision flags are set correctly but behavior never triggers
   - Missing collision property reading in script contexts
   - Turn-around action may not execute properly
   - Complete sequence fails: hit wall → detect collision → change direction → move away

3. **Multiple Collision Flags Set Simultaneously** (Task 14)
   - Character at boundaries shows multiple flags (e.g., `[false, true, true, false]`)
   - Should only show collision in direction of actual wall contact
   - Collision detection too sensitive or using wrong probe sizes
   - Affects behavior trigger accuracy

**Testing Results Summary**:

- ✅ Position correction works for small overlaps (≤8 pixels)
- ✅ Collision detection works for stationary characters
- ✅ Ceiling/floor collision detection works
- ❌ Horizontal collision during movement fails
- ❌ Turn-around behavior never triggers
- ❌ Multiple collision flags set incorrectly

**Next Steps**: Complete tasks 12-14 to fix these core collision system issues.

## ❌ CRITICAL: Turn-Around Behavior Velocity Bug (December 2024)

### Problem Summary

**Status**: ACTIVE BUG - Requires immediate fix

**Core Issue**: Characters can detect wall collisions and change direction correctly, but **cannot move away from walls** after turning around. The `WRITE_PROP CHARACTER_VEL_X` operation fails or gets immediately overridden when characters are overlapping with walls.

### Detailed Investigation Results

**What Works**:

- ✅ Wall collision detection: `collision=[false, true, true, false]` correctly set
- ✅ IS_WALL_LEANING condition: Triggers correctly when touching walls
- ✅ TURN_AROUND action: Direction flips correctly (2→0→2→0...)
- ✅ Script execution: Both separate and combined scripts execute without errors
- ✅ Property reads: All property reading operations work correctly

**What Fails**:

- ❌ **Velocity setting**: `WRITE_PROP CHARACTER_VEL_X` doesn't set velocity when character is against wall
- ❌ **Movement away from wall**: Character stays at same position with velocity=0.0
- ❌ **Turn-around completion**: Character oscillates directions but never moves away

### Root Cause Analysis

**Frame Processing Pipeline Issue**:

1. **Step 4**: Execute character behaviors → Script sets `character.core.vel.0 = -2.0` ✅
2. **Step 5**: Apply gravity to velocity → Modifies velocity ⚠️
3. **Step 6**: `check_and_constrain_velocity_only()` → **RESETS VELOCITY TO 0.0** ❌

**The collision constraint system prevents movement away from walls because**:

- Character is overlapping with wall after position correction
- `check_horizontal_movement()` detects immediate collision for any movement
- Swept collision detection returns distance=0 for overlapping entities
- Velocity gets constrained to 0 regardless of direction

### Failed Fix Attempts

1. **Collision Escape Logic**: Added logic to allow movement away from walls - didn't work
2. **Combined TURN_AROUND_AND_RUN Script**: Single action to flip direction + set velocity - didn't work
3. **Position Push Strategy**: Push character away from wall before setting velocity - didn't work
4. **Cooldown Adjustments**: Prevent rapid oscillation - didn't work

### Debug Evidence

**Node.js Test Results** (300 frames):

```
Frame 96: pos=224.0, vel=2.0, dir=2, collision=[false, false, true, false]  // Moving right, about to hit wall
Frame 97: pos=224.0, vel=0.0, dir=0, collision=[false, true, true, false]   // Hit wall, turned left, velocity=0
Frame 98: pos=224.0, vel=0.0, dir=2, collision=[false, true, true, false]   // Turned right, velocity=0
Frame 99: pos=224.0, vel=0.0, dir=0, collision=[false, true, true, false]   // Turned left, velocity=0
// Infinite oscillation with zero velocity
```

**Key Observation**: Direction changes work perfectly, but velocity never gets set to non-zero when character is against wall.

### Technical Details

**Affected Components**:

- `game-engine/src/state.rs`: `check_and_constrain_velocity_only()` method
- `game-engine/src/tilemap.rs`: `check_horizontal_movement()` method
- `game-engine/src/collision.rs`: Swept collision detection system
- Action script execution: `WRITE_PROP CHARACTER_VEL_X` operation

**Frame Processing Order**:

```rust
// Current problematic order:
1. process_character_behaviors()     // ✅ Sets velocity correctly
2. apply_gravity()                   // ⚠️ Modifies velocity
3. check_and_constrain_velocity_only() // ❌ Resets velocity to 0
4. apply_velocity_to_position()      // ❌ No movement (velocity=0)
```

### Required Solution

**The collision constraint system needs to be modified to**:

1. **Detect when character is overlapping with wall**
2. **Allow movement in directions that reduce overlap**
3. **Only constrain movement that increases overlap**
4. **Preserve script-set velocities for wall escape**

**Alternative approach**: Modify the frame processing order to handle wall escape scenarios differently.

### Test Files Created

**Comprehensive debugging suite in `debug-node/`**:

- `test-300-frames.js` - Main reproduction test
- `test-combined-turn-around-run.js` - Combined script approach
- `test-combined-script-isolated.js` - Isolated script testing
- `debug-run-script-values.js` - Property value verification
- `debug-action-execution-order.js` - Behavior execution analysis
- `debug-force-wall-collision.js` - Collision state testing

**All tests consistently reproduce the bug**: Direction changes work, velocity setting fails.

## Prevention Strategies

### 1. Property Implementation Checklist

When adding a new property:

- [ ] Define constant in `constants.rs`
- [ ] Implement in `ConditionContext::read_property`
- [ ] Implement in `ActionContext::read_property`
- [ ] Implement in `ConditionContext::write_property` (if writable)
- [ ] Implement in `ActionContext::write_property` (if writable)
- [ ] Use correct array type (vars for u8, fixed for Fixed)
- [ ] Test with Node.js debug script

### 1.1. Action Cooldown Considerations

When designing behaviors with immediate response actions:

- [ ] Consider if action needs cooldown or should execute immediately
- [ ] Test behavior with both debug script (cooldown: 0) and web viewer configuration
- [ ] For turn-around/direction-change actions, usually set cooldown: 0
- [ ] Document cooldown reasoning in action configuration

### 2. Regular Audits

- Run grep searches for property_address:: usage
- Check for array type mismatches
- Verify all contexts implement the same properties
- Test property access in isolation

### 3. Documentation Updates

- Update this document when adding properties
- Document type conversion patterns
- Maintain examples of correct implementations

## Type Conversion Reference

### Direction Properties (Special Case)

```rust
// ENTITY_DIR_HORIZONTAL: u8 storage, Fixed script access
// Read: game_state_value - 1 = script_value
property_address::ENTITY_DIR_HORIZONTAL => {
    if var_index < engine.fixed.len() {
        let script_value = (character.core.dir.0 as i16) - 1;
        engine.fixed[var_index] = Fixed::from_int(script_value);
    }
}

// Write: script_value + 1 = game_state_value
property_address::ENTITY_DIR_HORIZONTAL => {
    if var_index < engine.fixed.len() {
        let script_value = engine.fixed[var_index].to_int();
        character.core.dir.0 = ((script_value + 1).max(0).min(2)) as u8;
    }
}
```

### Standard Type Patterns

```rust
// u8 properties → vars array
property_address::CHARACTER_ENERGY => {
    if var_index < engine.vars.len() {
        engine.vars[var_index] = character.energy;
    }
}

// Fixed properties → fixed array
property_address::CHARACTER_POS_X => {
    if var_index < engine.fixed.len() {
        engine.fixed[var_index] = character.core.pos.0;
    }
}

// u16 properties → fixed array (converted)
property_address::CHARACTER_HEALTH => {
    if var_index < engine.fixed.len() {
        engine.fixed[var_index] = Fixed::from_int(character.health as i16);
    }
}

// Boolean properties → vars array (0/1)
property_address::CHARACTER_COLLISION_RIGHT => {
    if var_index < engine.vars.len() {
        engine.vars[var_index] = if character.core.collision.1 { 1 } else { 0 };
    }
}
```
