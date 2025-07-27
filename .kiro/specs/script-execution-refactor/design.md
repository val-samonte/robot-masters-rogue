# Design Document

## Overview

The status effect script execution system is currently disabled due to borrow checker conflicts. However, the game architecture is already correct - it uses an ID-based system where characters store `Vec<StatusEffectInstanceId>` and instances are stored in `GameState.status_effect_instances`. The solution is to fix the existing script execution code to properly sequence borrows and use this ID-based system.

## Architecture

### Current Problem Analysis

The disabled code in `status.rs` has borrow checker issues because it tries to:

1. Borrow `&mut GameState` to access various collections
2. Borrow `&mut Character` from within GameState
3. Borrow `&mut StatusEffectInstance` from within GameState
4. Create `StatusEffectContext` with all three references simultaneously

This creates simultaneous mutable borrows of GameState, which Rust prevents.

### Correct Solution

The solution is to **properly sequence the borrows** using the existing ID-based architecture:

1. **Use IDs to avoid simultaneous borrows**: Instead of holding multiple mutable references, use character_id, instance_id, and definition_id to get references one at a time when needed.

2. **Sequence context creation properly**: Create the StatusEffectContext by getting references in the right order without conflicts.

3. **Use existing ScriptEngine and ScriptContext**: No new systems needed - just fix the borrow sequencing.

## Components and Interfaces

### 1. Fixed StatusEffectContext Creation

Create a helper function that safely creates StatusEffectContext:

```rust
fn execute_status_effect_script(
    game_state: &mut GameState,
    character_id: u8,
    instance_id: StatusEffectInstanceId,
    definition_id: StatusEffectId,
    script_type: StatusEffectScriptType,
) -> Result<u8, ScriptError> {
    // Get references in proper sequence to avoid borrow conflicts
    // Implementation details in the actual code
}

enum StatusEffectScriptType {
    On,
    Tick,
    Off,
}
```

### 2. Updated Status Effect Functions

Fix the existing functions in `status.rs`:

- `apply_to_character`: Enable on_script execution
- `process_character_status_effects`: Enable tick_script execution
- `remove_status_effect_by_instance_id`: Enable off_script execution

### 3. Proper Borrow Sequencing Pattern

The key pattern is to avoid holding multiple mutable references simultaneously:

```rust
// WRONG - simultaneous mutable borrows
let character = &mut game_state.characters[character_id];
let instance = &mut game_state.status_effect_instances[instance_id];
let context = StatusEffectContext { game_state, character, instance, ... };

// RIGHT - sequence the borrows properly
// Implementation uses proper sequencing to avoid conflicts
```

## Data Models

No new data models needed. Use existing:

- `StatusEffectInstance` (already in GameState)
- `StatusEffectDefinition` (already in GameState)
- `Character` (already in GameState)
- `StatusEffectContext` (already exists)
- `ScriptEngine` (already exists)

## Error Handling

Use existing error handling:

- `ScriptError` for script execution failures
- Graceful handling when character/instance/definition not found
- Continue game execution even if individual scripts fail

## Testing Strategy

### Integration Tests

1. **Status Effect On Script**: Test script executes when status effect is applied
2. **Status Effect Tick Script**: Test script executes every frame while active
3. **Status Effect Off Script**: Test script executes when status effect is removed
4. **Multiple Status Effects**: Test multiple effects on same character
5. **Script Failures**: Test graceful handling of script execution errors

### Regression Tests

1. **Existing Functionality**: Ensure all existing game logic continues to work
2. **Script Behavior**: Verify scripts produce expected results
3. **Performance**: Ensure no performance regression

## Implementation Plan

### Phase 1: Fix On Script Execution

- Remove disabled code comments in `apply_to_character`
- Implement proper borrow sequencing for on_script execution
- Test that status effects can execute on_script when applied

### Phase 2: Fix Tick Script Execution

- Remove disabled code comments in `process_character_status_effects`
- Implement proper borrow sequencing for tick_script execution
- Test that status effects execute tick_script every frame

### Phase 3: Fix Off Script Execution

- Remove disabled code comments in `remove_status_effect_by_instance_id`
- Implement proper borrow sequencing for off_script execution
- Test that status effects execute off_script when removed

### Phase 4: Testing and Cleanup

- Comprehensive testing of all script execution paths
- Remove all "temporarily disabled" comments
- Verify no performance regression

## Migration Strategy

### No Breaking Changes

- Existing script bytecode works unchanged
- ScriptEngine and ScriptContext interfaces unchanged
- Game logic behavior identical to original working implementation
- No new APIs or data structures

### Simple Rollout

1. Fix the disabled code in status.rs
2. Test thoroughly
3. Remove disabled code comments
4. Done - no migration needed
