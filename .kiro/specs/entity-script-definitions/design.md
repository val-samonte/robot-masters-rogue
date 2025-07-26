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

Each definition type contains the static configuration data (vars and fixed arrays have been moved to instances):

```rust
pub struct ActionDefinition {
    pub energy_cost: u8,
    pub interval: u16,
    pub duration: u16,
    pub cooldown: u16,
    pub args: [u8; 8],        // Static configuration only
    pub spawns: [u8; 4],      // References to spawn definitions
    pub script: Vec<u8>,
}

pub struct ConditionDefinition {
    pub energy_mul: Fixed,
    pub args: [u8; 8],        // Static configuration only
    pub script: Vec<u8>,
}

pub struct StatusEffectDefinition {
    pub duration: u16,
    pub stack_limit: u8,
    pub reset_on_stack: bool,
    pub args: [u8; 8],        // Static configuration only
    pub spawns: [u8; 4],      // References to spawn definitions
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

Characters now store behaviors as ID pairs and status effects as ID references:

```rust
pub struct Character {
    // Existing fields...
    pub behaviors: Vec<(ConditionId, ActionId)>, // ✅ IMPLEMENTED - Changed from embedded objects
    pub locked_action: Option<ActionInstanceId>, // ✅ IMPLEMENTED - References instance, not definition
    pub status_effects: Vec<StatusEffectInstanceId>, // ✅ IMPLEMENTED - Changed from embedded objects
    pub action_last_used: Vec<u16>, // ✅ IMPLEMENTED - Tracks cooldowns per action definition
    // Other fields remain the same...
}
```

### Public API Changes

✅ **IMPLEMENTED** - The new_game function now accepts definition collections with validation:

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

The API includes:

- ✅ Definition validation to ensure all referenced IDs exist
- ✅ Character behavior reference validation
- ✅ Basic circular reference detection for spawn definitions
- ✅ Comprehensive error handling with new GameError variants

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

✅ **IMPLEMENTED** - The GameState provides definition lookup methods:

```rust
impl GameState {
    pub fn get_action_definition(&self, id: ActionId) -> Option<&ActionDefinition> {
        self.action_definitions.get(id)
    }

    pub fn get_condition_definition(&self, id: ConditionId) -> Option<&ConditionDefinition> {
        self.condition_definitions.get(id)
    }

    pub fn get_status_effect_definition(&self, id: StatusEffectId) -> Option<&StatusEffectDefinition> {
        self.status_effect_definitions.get(id)
    }

    pub fn get_spawn_definition(&self, id: usize) -> Option<&SpawnDefinition> {
        self.spawn_definitions.get(id)
    }

    // Similar methods for instances and mutable access
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

✅ **IMPLEMENTED** - New error variants have been added to GameError:

```rust
pub enum GameError {
    // Existing variants...
    InvalidActionId,           // ✅ IMPLEMENTED
    InvalidConditionId,        // ✅ IMPLEMENTED
    InvalidStatusEffectId,     // ✅ IMPLEMENTED
    InvalidSpawnId,           // ✅ IMPLEMENTED
    CircularReference,        // ✅ IMPLEMENTED
    MissingDefinition,        // ✅ IMPLEMENTED
}
```

These errors are integrated into the error handling system with appropriate error messages and recoverability flags.

## Implementation Status

### Completed Components

✅ **Definition Structures** (Tasks 1, 5)

- ActionDefinition, ConditionDefinition, StatusEffectDefinition structures created
- Variables moved from definitions to instances for proper separation
- Validation methods implemented for all definition types

✅ **Instance Structures** (Tasks 2, 5)

- ActionInstance, ConditionInstance structures with definition_id references
- Runtime state management separated from static definitions
- Instance creation methods linking to definition IDs

✅ **GameState Integration** (Task 8)

- Definition collections added to GameState
- Instance collections for runtime state management
- Definition lookup methods implemented

✅ **Character Modifications** (Task 7)

- Behaviors changed to Vec<(ConditionId, ActionId)> pairs
- Status effects changed to Vec<StatusEffectInstanceId>
- Action cooldown tracking with action_last_used vector

✅ **Public API** (Task 9)

- new_game function accepts all definition collections
- Comprehensive validation of definition references
- Circular reference detection for spawn definitions
- Error handling with new GameError variants

✅ **Property System Updates** (Task 6)

- PropertyAddress enum distinguishes definition vs instance properties
- Property accessors resolve definition properties via ID lookup
- Instance properties accessed directly from instances

### Pending Implementation

🔄 **Status Effects System** (Task 10 - Next Priority)

- Status effect processing needs update for ID-based architecture
- Apply/remove status effect methods need implementation
- Script execution methods need instance reference handling

⏳ **Behavior Execution** (Task 11)

- Character behavior execution with ID resolution
- Context objects need definition reference handling
- Instance creation and management during execution

⏳ **Spawn System Updates** (Task 12)

- Spawn creation with definition lookups
- Action script spawn references by ID

⏳ **Serialization Updates** (Task 14)

- Binary serialization format for definition collections
- JSON serialization including definitions and instances

## Development Approach

### No Backward Compatibility

Following the project's development principles:

- ✅ **Breaking Changes Implemented** - API signatures completely changed
- ✅ **Legacy Code Removed** - All embedded object patterns eliminated
- ✅ **Clean Architecture** - Definition-based system implemented from scratch

### No Tests During Development

Following the project's testing principles:

- 🚫 **No Test Files Created** - Focus on core implementation first
- 🚫 **No Test-Driven Development** - Rapid prototyping phase
- ✅ **Implementation First** - Core systems built without test overhead

### Current Architecture Benefits

The implemented changes provide:

- **Memory Efficiency** - Definitions stored once, referenced by ID
- **Clean Separation** - Static definitions vs runtime instances
- **Validation** - Comprehensive ID reference validation
- **Error Handling** - Graceful handling of invalid references
- **Consistency** - Unified pattern across all component types

### Next Steps

The remaining tasks focus on:

1. **Status Effects Integration** - Complete the ID-based status system
2. **Behavior Execution** - Implement runtime ID resolution
3. **Spawn System** - Complete definition-based spawn creation
4. **Serialization** - Update formats for new architecture

The foundation is solid with definition collections, validation, and API changes complete. The remaining work focuses on runtime execution with the new ID-based references.
