# Design Document

## Overview

The current game engine embeds Actions, Conditions, Spawns, and StatusEffects directly into Characters and other entities, causing significant memory overhead and data duplication. This design refactors the system to use a definition-based architecture where these components are defined once and referenced by ID, similar to how SpawnDefinitions are currently handled.

The refactoring will introduce definition collections at the game state level and modify Characters to store behavior as (ConditionId, ActionId) pairs instead of embedded objects. This approach reduces memory usage, improves serialization efficiency, and enables better reusability of game logic components.

## Architecture

### Current Architecture Issues

- Characters embed full Condition and Action objects in their behaviors Vec
- Multiple characters using the same behavior duplicate the entire script data
- Game state serialization includes redundant script bytecode
- Memory usage scales poorly with the number of characters and behaviors

### New Architecture Benefits

- Single source of truth for all definitions
- Memory usage scales with unique definitions, not usage count
- Improved serialization efficiency
- Better separation of concerns between definitions and instances
- Consistent pattern with existing SpawnDefinition system

## Components and Interfaces

### Definition Collections

The GameState will be extended with new definition collections:

```rust
pub struct GameState {
    // Existing fields...
    pub action_definitions: Vec<ActionDefinition>,
    pub condition_definitions: Vec<ConditionDefinition>,
    pub spawn_definitions: Vec<SpawnDefinition>, // Already exists
    pub status_effect_definitions: Vec<StatusEffectDefinition>,

    // Instance collections for active game objects
    pub action_instances: Vec<ActionInstance>,
    pub condition_instances: Vec<ConditionInstance>,
    pub status_effect_instances: Vec<StatusEffectInstance>, // Already exists on characters
}
```

### Definition Structures

Each definition type will contain the static configuration data:

```rust
pub struct ActionDefinition {
    pub energy_cost: u8,
    pub interval: u16,
    pub duration: u16,
    pub cooldown: u16,
    pub vars: [u8; 8],
    pub fixed: [Fixed; 4],
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub script: Vec<u8>,
}

pub struct ConditionDefinition {
    pub energy_mul: Fixed,
    pub vars: [u8; 8],
    pub fixed: [Fixed; 4],
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub script: Vec<u8>,
}

pub struct StatusEffectDefinition {
    pub duration: u16,
    pub stack_limit: u8,
    pub reset_on_stack: bool,
    pub vars: [u8; 8],
    pub fixed: [Fixed; 4],
    pub args: [u8; 8],
    pub spawns: [u8; 4],
    pub on_script: Vec<u8>,
    pub tick_script: Vec<u8>,
    pub off_script: Vec<u8>,
}
```

### Instance Structures

Instances will contain runtime state and reference their definitions:

```rust
pub struct ActionInstance {
    pub definition_id: ActionId,
    pub remaining_duration: u16,
    pub last_used_frame: u16,
    pub runtime_vars: [u8; 8],
    pub runtime_fixed: [Fixed; 4],
}

pub struct ConditionInstance {
    pub definition_id: ConditionId,
    pub runtime_vars: [u8; 8],
    pub runtime_fixed: [Fixed; 4],
}
```

### Character Behavior Modification

Characters will store behaviors as ID pairs instead of embedded objects:

```rust
pub struct Character {
    // Existing fields...
    pub behaviors: Vec<(ConditionId, ActionId)>, // Changed from embedded objects
    pub locked_action: Option<ActionInstanceId>, // References instance, not definition
    // Other fields remain the same...
}
```

### Public API Changes

The new_game function will accept definition collections:

```rust
pub fn new_game(
    seed: u16,
    tilemap: [[u8; 16]; 15],
    characters: Vec<Character>,
    action_definitions: Vec<ActionDefinition>,
    condition_definitions: Vec<ConditionDefinition>,
    spawn_definitions: Vec<SpawnDefinition>,
    status_effect_definitions: Vec<StatusEffectDefinition>,
) -> GameResult<GameState>
```

## Data Models

### ID Management

All definition IDs will be managed as indices into their respective Vec collections:

- ActionId: usize (index into action_definitions)
- ConditionId: usize (index into condition_definitions)
- SpawnLookupId: usize (index into spawn_definitions) - already exists
- StatusEffectId: usize (index into status_effect_definitions)

### Instance Management

Active instances will be tracked separately from definitions:

- ActionInstance: Runtime state for active actions
- ConditionInstance: Runtime state for condition evaluations
- StatusEffectInstance: Runtime state for active status effects (already exists)

### Reference Resolution

The behavior execution system will resolve IDs to definitions at runtime:

```rust
impl GameState {
    pub fn get_action_definition(&self, id: ActionId) -> Option<&ActionDefinition> {
        self.action_definitions.get(id)
    }

    pub fn get_condition_definition(&self, id: ConditionId) -> Option<&ConditionDefinition> {
        self.condition_definitions.get(id)
    }

    // Similar methods for other definition types...
}
```

## Error Handling

### Definition Validation

During game initialization, the system will validate that all referenced IDs exist:

- Character behaviors reference valid ConditionId and ActionId pairs
- Action spawns reference valid SpawnLookupId values
- Circular references are detected and reported

### Runtime Error Handling

During gameplay, missing definition lookups will be handled gracefully:

- Invalid IDs will log warnings and skip execution
- Fallback behaviors will prevent game crashes
- Error states will be tracked for debugging

### Error Types

New error variants will be added to GameError:

```rust
pub enum GameError {
    // Existing variants...
    InvalidActionId,
    InvalidConditionId,
    InvalidStatusEffectId,
    CircularReference,
    MissingDefinition,
}
```

## Testing Strategy

### Unit Tests

Each definition and instance type will have comprehensive unit tests:

- Definition creation and validation
- Instance lifecycle management
- ID resolution and error handling
- Memory usage verification

### Integration Tests

Behavior execution will be tested with the new architecture:

- Character behavior execution with ID references
- Spawn creation with definition lookups
- Status effect application and removal
- Cross-reference validation

### Migration Tests

Existing test data will be completely restructured for the new format:

- Convert embedded objects to definition-based architecture
- Update all test cases to use definition collections and ID references
- Verify functional equivalence despite structural changes
- Performance comparison tests for memory usage improvements

### Performance Tests

Memory efficiency improvements will be validated:

- Memory usage with multiple characters sharing behaviors
- Serialization size comparisons
- Lookup performance benchmarks

## Migration Strategy

### Breaking Changes Approach

This refactoring introduces significant breaking changes that will require comprehensive test updates:

- API signatures will change to accept definition collections
- Character behavior storage format will change completely
- Test data structures will need to be rebuilt with the new architecture

### Data Conversion

Existing embedded objects will be extracted into definition collections:

- Identify unique Action/Condition objects across all test cases
- Create definition collections with these unique objects
- Replace all embedded object references with ID-based references
- Update character initialization to use (ConditionId, ActionId) pairs

### Test Migration

All existing tests will be updated to work with the new architecture:

- Convert test data from embedded objects to definition-based format
- Update test assertions to work with ID-based references
- Modify test utilities to create definition collections
- Ensure core game behavior remains functionally equivalent despite structural changes

### Validation

The migration will focus on functional equivalence rather than backward compatibility:

- Game logic produces equivalent results with new architecture
- Performance improvements are measurable and significant
- All definition references resolve correctly
- No memory leaks or invalid references in the new system
