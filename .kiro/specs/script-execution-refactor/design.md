# Design Document

## Overview

The script execution refactor addresses the fundamental borrow checker conflicts in the current system by introducing a proper separation of concerns between script execution and game state management. The solution leverages Rust's ownership system properly while maintaining the existing ScriptEngine and ScriptContext abstractions.

## Architecture

### Current Problem Analysis

The current system has these architectural issues:

1. **Simultaneous Mutable Borrows**: Script execution functions need `&mut GameState`, `&mut Character`, and `&mut StatusEffectInstance`, but `StatusEffectInstance` comes from `GameState`, creating conflicts.

2. **Tight Coupling**: Script execution is tightly coupled to specific data structures, making it hard to extend.

3. **Context Creation Issues**: Creating `StatusEffectContext` requires borrowing multiple mutable references simultaneously.

### Proposed Solution

The solution introduces a **Script Execution Coordinator** pattern that:

1. **Separates Data Preparation from Execution**: Collect all needed data first, then execute scripts with prepared context.

2. **Uses Owned Context Data**: Create contexts with owned/copied data instead of borrowed references where possible.

3. **Implements Deferred Execution**: Queue script executions and process them when we have exclusive access to game state.

## Components and Interfaces

### 1. ScriptExecutionRequest

A data structure that captures all information needed to execute a script later:

```rust
#[derive(Debug, Clone)]
pub struct ScriptExecutionRequest {
    pub script_type: ScriptType,
    pub script_data: Vec<u8>,
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub context_data: ScriptContextData,
}

#[derive(Debug, Clone)]
pub enum ScriptType {
    StatusEffectOn,
    StatusEffectTick,
    StatusEffectOff,
    // Future: ActionScript, ConditionScript, etc.
}

#[derive(Debug, Clone)]
pub struct ScriptContextData {
    pub character_id: u8,
    pub instance_id: Option<StatusEffectInstanceId>,
    pub definition_id: Option<StatusEffectId>,
    // Other context-specific data
}
```

### 2. ScriptExecutionCoordinator

A component that manages script execution requests and processes them safely:

```rust
pub struct ScriptExecutionCoordinator {
    pending_requests: Vec<ScriptExecutionRequest>,
    script_engine: ScriptEngine, // Reused engine instance
}

impl ScriptExecutionCoordinator {
    pub fn queue_script_execution(&mut self, request: ScriptExecutionRequest);
    pub fn process_pending_scripts(&mut self, game_state: &mut GameState) -> Result<(), ScriptError>;
    pub fn execute_script_immediately(&mut self, request: ScriptExecutionRequest, game_state: &mut GameState) -> Result<u8, ScriptError>;
}
```

### 3. Enhanced ScriptContext Creation

Modify context creation to work with the coordinator pattern:

```rust
impl StatusEffectContext<'_> {
    pub fn create_for_execution(
        game_state: &mut GameState,
        character_id: u8,
        instance_id: StatusEffectInstanceId,
        definition_id: StatusEffectId,
    ) -> Result<(StatusEffectContext, &mut Character, &mut StatusEffectInstance), ScriptError>;
}
```

### 4. GameState Integration

Add methods to GameState for coordinated script execution:

```rust
impl GameState {
    pub fn get_script_coordinator(&mut self) -> &mut ScriptExecutionCoordinator;
    pub fn process_all_pending_scripts(&mut self) -> Result<(), ScriptError>;
}
```

## Data Models

### ScriptExecutionRequest Structure

- **script_type**: Enum identifying the type of script (on/tick/off for status effects)
- **script_data**: The actual bytecode to execute
- **args**: Arguments passed to the script engine
- **spawns**: Spawn IDs for spawn creation
- **context_data**: All data needed to recreate the execution context

### ScriptContextData Structure

- **character_id**: ID to locate the character in game state
- **instance_id**: Optional instance ID for status effects
- **definition_id**: Optional definition ID for status effects
- **Additional fields**: As needed for different script types

## Error Handling

### Script Execution Errors

- **InvalidContext**: When context data references non-existent entities
- **BorrowConflict**: If somehow borrow conflicts still occur (should not happen with proper design)
- **ScriptError**: Existing script execution errors are propagated

### Error Recovery

- Failed script executions are logged but don't crash the game
- Invalid context data results in script being skipped
- Partial failures in batch processing continue with remaining scripts

## Testing Strategy

### Unit Tests

1. **ScriptExecutionRequest Creation**: Test request creation with various context types
2. **Coordinator Queuing**: Test queuing and processing of multiple requests
3. **Context Creation**: Test safe context creation without borrow conflicts
4. **Error Handling**: Test error scenarios and recovery

### Integration Tests

1. **Status Effect Scripts**: Test all three script types (on/tick/off) execute properly
2. **Multiple Characters**: Test script execution with multiple characters
3. **Concurrent Requests**: Test handling of multiple queued script requests
4. **Performance**: Verify no performance regression from original system

### Regression Tests

1. **Existing Functionality**: Ensure all existing game logic continues to work
2. **Script Behavior**: Verify scripts produce the same results as before
3. **Memory Safety**: Confirm no unsafe code is needed

## Implementation Phases

### Phase 1: Core Infrastructure

- Implement ScriptExecutionRequest and related data structures
- Create ScriptExecutionCoordinator with basic queuing
- Add GameState integration methods

### Phase 2: Status Effect Integration

- Modify status effect script execution to use coordinator
- Update apply_to_character, process_character_status_effects, and remove functions
- Implement safe context creation for status effects

### Phase 3: Testing and Optimization

- Comprehensive testing of all script execution paths
- Performance optimization and engine reuse
- Documentation and cleanup

### Phase 4: Future Extensibility

- Design patterns for adding action and condition script execution
- Generalize the coordinator for other script types
- API documentation for extending the system

## Migration Strategy

### Backward Compatibility

- Existing script bytecode remains unchanged
- ScriptEngine and ScriptContext interfaces remain stable
- Game logic behavior is identical to original working implementation

### Rollout Plan

1. Implement new system alongside existing disabled code
2. Enable new system for status effects only
3. Verify functionality through testing
4. Remove old disabled code
5. Document new patterns for future script types

## Performance Considerations

### Optimization Strategies

- **Engine Reuse**: Single ScriptEngine instance per coordinator, reset between executions
- **Batch Processing**: Process multiple queued scripts in single game state access
- **Minimal Cloning**: Only clone data that's actually needed for context
- **Lazy Context Creation**: Create contexts only when scripts actually need to execute

### Memory Management

- ScriptExecutionRequest uses minimal owned data
- Context creation borrows from game state only during execution
- No long-lived references that could cause borrow conflicts
- Coordinator clears processed requests to prevent memory leaks
