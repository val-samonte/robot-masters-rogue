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

## CRITICAL BUG: ENTITY_DIR_HORIZONTAL Inconsistency

**Status**: BROKEN - Multiple inconsistent implementations

**Problem**: ENTITY_DIR_HORIZONTAL has multiple implementations across different contexts:

- Some write to `vars[]` array (u8 values)
- Some write to `fixed[]` array (Fixed values)
- Some use `vars.len()` bounds check but write to `fixed[]`
- This causes scripts to read wrong values or get bounds errors

**Expected Behavior**:

- Game State: `dir.0 = 0` (left), `1` (neutral), `2` (right) - u8 storage
- Script Access: Fixed values `-1.0` (left), `0.0` (neutral), `+1.0` (right) - fixed[] array
- Conversion: `script_value = game_state_value - 1`

**Required Fix**: Make ALL implementations consistent:

1. Read operations: Convert u8 → Fixed, store in `fixed[]`, use `fixed.len()` bounds check
2. Write operations: Read Fixed from `fixed[]`, convert Fixed → u8, use `fixed.len()` bounds check

**Impact**: RUN action fails because it can't read direction properly, causing character to not move.

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
